import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureRecipeFolder, resolveRecipeDocument } from "./google-recipe-export";

afterEach(() => vi.unstubAllGlobals());

function response(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("managed Google recipe export targets", () => {
  it("reuses the stored Hearthworks Recipes folder when it is still available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      id: "folder-1",
      mimeType: "application/vnd.google-apps.folder",
      trashed: false,
      webViewLink: "https://drive.google.com/drive/folders/folder-1",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(ensureRecipeFolder("token", "folder-1")).resolves.toEqual({
      folderId: "folder-1",
      folderUrl: "https://drive.google.com/drive/folders/folder-1",
      created: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updates the stored recipe Doc instead of creating a duplicate", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ body: { content: [{ endIndex: 2 }] } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveRecipeDocument({
      title: "Plain Sourdough",
      folderId: "folder-1",
      token: "token",
      existingFileId: "doc-1",
    })).resolves.toEqual({
      fileId: "doc-1",
      fileUrl: "https://docs.google.com/document/d/doc-1/edit",
      created: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("replaces a missing managed Doc in the same recipe folder", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({ id: "doc-2", webViewLink: "https://docs.google.com/document/d/doc-2/edit" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(resolveRecipeDocument({
      title: "Plain Sourdough",
      folderId: "folder-1",
      token: "token",
      existingFileId: "missing-doc",
    })).resolves.toEqual({
      fileId: "doc-2",
      fileUrl: "https://docs.google.com/document/d/doc-2/edit",
      created: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "POST" });
  });
});
