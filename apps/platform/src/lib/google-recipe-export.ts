import type { RecipeGoogleDocModel } from "./recipe-google-doc";

const COLORS = {
  charcoal: { red: 0.15, green: 0.13, blue: 0.11 },
  copper: { red: 0.58, green: 0.24, blue: 0.12 },
  cream: { red: 0.98, green: 0.96, blue: 0.91 },
  rule: { red: 0.82, green: 0.77, blue: 0.68 },
  white: { red: 1, green: 1, blue: 1 },
};

type DocCell = { startIndex?: number; endIndex?: number; content?: Array<{ startIndex?: number; endIndex?: number }> };
type DocTable = { tableRows?: Array<{ tableCells?: DocCell[] }> };
type DocElement = { startIndex?: number; endIndex?: number; table?: DocTable };
type GoogleDocument = { body?: { content?: DocElement[] } };

export class GoogleApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const color = (rgbColor: { red: number; green: number; blue: number }) => ({ color: { rgbColor } });
const dimension = (magnitude: number) => ({ magnitude, unit: "PT" });

async function googleFetch(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = response.status === 401 || response.status === 403
      ? "Google authorization needs to be reconnected."
      : `Google export failed (${response.status}).`;
    throw new GoogleApiError(message, response.status);
  }
  return body;
}

function documentEndIndex(document: GoogleDocument) {
  return document.body?.content?.at(-1)?.endIndex ?? 2;
}

async function getDocument(fileId: string, token: string): Promise<GoogleDocument> {
  return googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}`, token);
}

async function batchUpdate(fileId: string, token: string, requests: Array<Record<string, unknown>>) {
  if (!requests.length) return;
  await googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify({ requests }),
  });
}

async function appendText(fileId: string, token: string, text: string) {
  const document = await getDocument(fileId, token);
  const startIndex = documentEndIndex(document) - 1;
  await batchUpdate(fileId, token, [{ insertText: { location: { index: startIndex }, text } }]);
  return { startIndex, endIndex: startIndex + text.length };
}

function cellTextRange(cell: DocCell) {
  const startIndex = cell.content?.[0]?.startIndex ?? cell.startIndex;
  const endIndex = (cell.content?.at(-1)?.endIndex ?? cell.endIndex ?? 0) - 1;
  return startIndex !== undefined && endIndex > startIndex ? { startIndex, endIndex } : null;
}

async function appendTable(fileId: string, token: string, rows: string[][], widths: number[], headerRows = 0) {
  const rowCount = rows.length;
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const before = await getDocument(fileId, token);
  const location = { index: documentEndIndex(before) - 1 };
  await batchUpdate(fileId, token, [{ insertTable: { rows: rowCount, columns: columnCount, location } }]);

  const emptyDocument = await getDocument(fileId, token);
  const tableElement = emptyDocument.body?.content?.filter((element) => element.table).at(-1);
  if (!tableElement?.table || tableElement.startIndex === undefined) throw new Error("Google could not format the recipe table.");
  const emptyRows = tableElement.table.tableRows ?? [];
  const insertions = emptyRows.flatMap((row, rowIndex) => (row.tableCells ?? []).map((cell, columnIndex) => ({
    index: cell.content?.[0]?.startIndex ?? (cell.startIndex ?? 0) + 1,
    text: rows[rowIndex]?.[columnIndex] ?? "",
  }))).filter((item) => item.index > 0 && item.text).sort((a, b) => b.index - a.index);
  await batchUpdate(fileId, token, insertions.map((item) => ({ insertText: { location: { index: item.index }, text: item.text } })));

  const filledDocument = await getDocument(fileId, token);
  const filledElement = filledDocument.body?.content?.filter((element) => element.table).at(-1);
  if (!filledElement?.table || filledElement.startIndex === undefined) throw new Error("Google could not finish the recipe table.");
  const thinBorder = { color: color(COLORS.rule), width: dimension(0.5), dashStyle: "SOLID" };
  const tableStartLocation = { index: filledElement.startIndex };
  const requests: Array<Record<string, unknown>> = [
    {
      updateTableCellStyle: {
        tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 }, rowSpan: rowCount, columnSpan: columnCount },
        tableCellStyle: {
          backgroundColor: color(COLORS.cream),
          contentAlignment: "MIDDLE",
          paddingTop: dimension(6),
          paddingBottom: dimension(6),
          paddingLeft: dimension(7),
          paddingRight: dimension(7),
          borderTop: thinBorder,
          borderBottom: thinBorder,
          borderLeft: thinBorder,
          borderRight: thinBorder,
        },
        fields: "backgroundColor,contentAlignment,paddingTop,paddingBottom,paddingLeft,paddingRight,borderTop,borderBottom,borderLeft,borderRight",
      },
    },
    ...widths.map((width, columnIndex) => ({
      updateTableColumnProperties: {
        tableStartLocation,
        columnIndices: [columnIndex],
        tableColumnProperties: { widthType: "FIXED_WIDTH", width: dimension(width) },
        fields: "widthType,width",
      },
    })),
  ];

  if (headerRows) requests.push({
    updateTableCellStyle: {
      tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 }, rowSpan: headerRows, columnSpan: columnCount },
      tableCellStyle: { backgroundColor: color(COLORS.charcoal) },
      fields: "backgroundColor",
    },
  });

  for (const [rowIndex, row] of (filledElement.table.tableRows ?? []).entries()) {
    for (const [columnIndex, cell] of (row.tableCells ?? []).entries()) {
      const range = cellTextRange(cell);
      if (!range) continue;
      const isHeader = rowIndex < headerRows;
      requests.push({
        updateTextStyle: {
          range,
          textStyle: {
            weightedFontFamily: { fontFamily: "Arial" },
            fontSize: dimension(9.5),
            bold: isHeader || columnIndex === 0,
            foregroundColor: color(isHeader ? COLORS.white : COLORS.charcoal),
          },
          fields: "weightedFontFamily,fontSize,bold,foregroundColor",
        },
      });
    }
  }
  await batchUpdate(fileId, token, requests);
}

async function appendHeading(fileId: string, token: string, heading: string) {
  const range = await appendText(fileId, token, `${heading}\n`);
  await batchUpdate(fileId, token, [
    {
      updateTextStyle: {
        range,
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(17), bold: true, foregroundColor: color(COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range,
        paragraphStyle: { spaceAbove: dimension(16), spaceBelow: dimension(7), keepWithNext: true },
        fields: "spaceAbove,spaceBelow,keepWithNext",
      },
    },
  ]);
}

async function createDriveFolder(token: string) {
  return googleFetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", token, {
    method: "POST",
    body: JSON.stringify({ name: "Hearthworks Recipes", mimeType: "application/vnd.google-apps.folder" }),
  });
}

export async function ensureRecipeFolder(token: string, existingFolderId?: string | null) {
  if (existingFolderId) {
    try {
      const folder = await googleFetch(`https://www.googleapis.com/drive/v3/files/${existingFolderId}?fields=id,trashed,webViewLink,mimeType`, token);
      if (!folder.trashed && folder.mimeType === "application/vnd.google-apps.folder") {
        return { folderId: existingFolderId, folderUrl: folder.webViewLink ?? `https://drive.google.com/drive/folders/${existingFolderId}`, created: false };
      }
    } catch (error) {
      if (!(error instanceof GoogleApiError) || error.status !== 404) throw error;
    }
  }
  const folder = await createDriveFolder(token);
  if (!folder.id) throw new Error("Google did not return a recipe folder ID.");
  return { folderId: folder.id as string, folderUrl: folder.webViewLink ?? `https://drive.google.com/drive/folders/${folder.id}`, created: true };
}

async function createRecipeDocument(title: string, folderId: string, token: string) {
  const file = await googleFetch("https://www.googleapis.com/drive/v3/files?fields=id,webViewLink", token, {
    method: "POST",
    body: JSON.stringify({ name: title, mimeType: "application/vnd.google-apps.document", parents: [folderId] }),
  });
  if (!file.id) throw new Error("Google did not return a recipe document ID.");
  return { fileId: file.id as string, fileUrl: file.webViewLink ?? `https://docs.google.com/document/d/${file.id}/edit` };
}

async function populateRecipeDocument(fileId: string, model: RecipeGoogleDocModel, token: string) {
  const current = await getDocument(fileId, token);
  const endIndex = documentEndIndex(current);
  const resetRequests: Array<Record<string, unknown>> = [];
  if (endIndex > 2) resetRequests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } });
  resetRequests.push({
    updateDocumentStyle: {
      documentStyle: { marginTop: dimension(48), marginBottom: dimension(48), marginLeft: dimension(60), marginRight: dimension(60) },
      fields: "marginTop,marginBottom,marginLeft,marginRight",
    },
  });
  await batchUpdate(fileId, token, resetRequests);

  const opening = `HEARTHWORKS\nRECIPE\n\n${model.title}\n${model.subtitle}\n`;
  const openingRange = await appendText(fileId, token, opening);
  const titleStart = openingRange.startIndex + opening.indexOf(model.title);
  const subtitleStart = openingRange.startIndex + opening.indexOf(model.subtitle);
  await batchUpdate(fileId, token, [
    {
      updateTextStyle: {
        range: { startIndex: openingRange.startIndex, endIndex: openingRange.startIndex + "HEARTHWORKS".length },
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(10), bold: true, foregroundColor: color(COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: openingRange.startIndex + "HEARTHWORKS\n".length, endIndex: openingRange.startIndex + "HEARTHWORKS\nRECIPE".length },
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(8), bold: true, foregroundColor: color(COLORS.copper) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: titleStart, endIndex: titleStart + model.title.length },
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(28), bold: true, foregroundColor: color(COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: titleStart, endIndex: titleStart + model.title.length + 1 },
        paragraphStyle: { spaceAbove: dimension(7), spaceBelow: dimension(7), borderBottom: { color: color(COLORS.copper), width: dimension(1.5), padding: dimension(7), dashStyle: "SOLID" }, keepWithNext: true },
        fields: "spaceAbove,spaceBelow,borderBottom,keepWithNext",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: subtitleStart, endIndex: subtitleStart + model.subtitle.length },
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(9), foregroundColor: color(COLORS.copper) },
        fields: "weightedFontFamily,fontSize,foregroundColor",
      },
    },
  ]);

  await appendTable(fileId, token, [model.summary.map((item) => item.value), model.summary.map((item) => item.label)], [120, 120, 120, 120]);

  for (const section of model.sections) {
    await appendHeading(fileId, token, section.heading);
    if (section.rows) await appendTable(fileId, token, section.rows, [270, 90, 120], 1);
    if (section.body) {
      const range = await appendText(fileId, token, `${section.body}\n`);
      await batchUpdate(fileId, token, [{
        updateTextStyle: {
          range,
          textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(10.5), foregroundColor: color(COLORS.charcoal) },
          fields: "weightedFontFamily,fontSize,foregroundColor",
        },
      }, {
        updateParagraphStyle: {
          range,
          paragraphStyle: { lineSpacing: 125, spaceBelow: dimension(6) },
          fields: "lineSpacing,spaceBelow",
        },
      }]);
    }
  }

  const footer = await appendText(fileId, token, `${model.footer}\n`);
  await batchUpdate(fileId, token, [{
    updateTextStyle: {
      range: footer,
      textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(7.5), foregroundColor: color(COLORS.copper) },
      fields: "weightedFontFamily,fontSize,foregroundColor",
    },
  }, {
    updateParagraphStyle: {
      range: footer,
      paragraphStyle: { alignment: "CENTER", spaceAbove: dimension(14), borderTop: { color: color(COLORS.rule), width: dimension(0.5), padding: dimension(7), dashStyle: "SOLID" } },
      fields: "alignment,spaceAbove,borderTop",
    },
  }]);
}

export async function exportRecipeGoogleDoc(input: {
  title: string;
  folderId: string;
  token: string;
  model: RecipeGoogleDocModel;
  existingFileId?: string | null;
}) {
  const file = await resolveRecipeDocument(input);
  await populateRecipeDocument(file.fileId, input.model, input.token);
  return file;
}

export async function resolveRecipeDocument(input: {
  title: string;
  folderId: string;
  token: string;
  existingFileId?: string | null;
}) {
  let created = false;
  let fileId = input.existingFileId ?? undefined;
  let fileUrl = fileId ? `https://docs.google.com/document/d/${fileId}/edit` : undefined;

  if (fileId) {
    try {
      await getDocument(fileId, input.token);
    } catch (error) {
      if (!(error instanceof GoogleApiError) || error.status !== 404) throw error;
      fileId = undefined;
      fileUrl = undefined;
    }
  }

  if (!fileId) {
    const file = await createRecipeDocument(input.title, input.folderId, input.token);
    fileId = file.fileId;
    fileUrl = file.fileUrl;
    created = true;
  }

  return { fileId, fileUrl: fileUrl ?? `https://docs.google.com/document/d/${fileId}/edit`, created };
}
