import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

const representativeViewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

const plannerRoutes = [
  "/dashboard",
  "/events",
  "/events/sample/plan",
  "/events/sample/report",
  "/recipes",
  "/recipes/plain",
  "/recipes/import",
  "/account",
];

async function expectResponsiveContainment(page: Page) {
  await expect(page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")).toHaveCount(0);
  const documentSize = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  const escaped = await page.locator("body *").evaluateAll((elements) => {
    const viewportWidth = document.documentElement.clientWidth;
    const isIntentionallyClipped = (element: Element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (["auto", "scroll", "hidden", "clip"].includes(overflowX) && parent.scrollWidth > parent.clientWidth) return true;
        parent = parent.parentElement;
      }
      return false;
    };
    return elements.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || isIntentionallyClipped(element)) return [];
      return rect.left < -1 || rect.right > viewportWidth + 1
        ? [{ tagName: element.tagName, className: String(element.className), left: rect.left, right: rect.right }]
        : [];
    });
  });
  expect(escaped).toEqual([]);
  expect(documentSize.scrollWidth).toBeLessThanOrEqual(documentSize.clientWidth + 1);
}

async function openPlanStep(page: Page, step: number) {
  await page.goto("/events/sample/plan");
  await page.locator(".step-rail button").nth(step - 1).click();
  await expect(page.locator(".plan-panel")).toBeVisible();
}

for (const viewport of representativeViewports) {
  test.describe(`${viewport.width}px planner sweep`, () => {
    test.use({ viewport });

    for (const route of plannerRoutes) {
      test(`${route} stays inside the viewport`, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator("body")).not.toBeEmpty();
        await expectResponsiveContainment(page);
      });
    }

    test("all five plan steps stay contained", async ({ page }) => {
      for (let step = 1; step <= 5; step += 1) {
        await openPlanStep(page, step);
        await expectResponsiveContainment(page);
      }
    });
  });
}

for (const width of [559, 560, 561, 899, 900, 901]) {
  test(`shared shell is stable at the ${width}px breakpoint boundary`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/events/sample/plan");
    await expectResponsiveContainment(page);
  });
}

test("plan review separates names, metadata, and totals", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPlanStep(page, 3);
  const firstRow = page.locator(".review-row").first();
  const [name, metadata, total] = await Promise.all([
    firstRow.locator("strong").boundingBox(),
    firstRow.locator("small").boundingBox(),
    firstRow.locator(":scope > b").boundingBox(),
  ]);
  expect(name).not.toBeNull();
  expect(metadata).not.toBeNull();
  expect(total).not.toBeNull();
  expect(metadata!.y).toBeGreaterThanOrEqual(name!.y + name!.height - 1);
  expect(total!.x).toBeGreaterThan(name!.x);
  await expectResponsiveContainment(page);
});

test("date-time and suffix controls remain inside their wrappers", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPlanStep(page, 1);
  const dateWrapper = page.locator(".input-with-icon");
  const dateInput = dateWrapper.locator('input[type="datetime-local"]');
  const [wrapperBox, inputBox] = await Promise.all([dateWrapper.boundingBox(), dateInput.boundingBox()]);
  expect(wrapperBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  expect(inputBox!.x).toBeGreaterThanOrEqual(wrapperBox!.x);
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(wrapperBox!.x + wrapperBox!.width + 1);
  await expectResponsiveContainment(page);

  await page.goto("/recipes/plain");
  await page.getByRole("button", { name: "Edit recipe" }).click();
  const suffix = page.locator(".quick-ingredient-row .number-suffix").first();
  const suffixPadding = await suffix.locator("input").evaluate((element) => parseFloat(getComputedStyle(element).paddingRight));
  expect(suffixPadding).toBeGreaterThanOrEqual(35);
  await expectResponsiveContainment(page);
});

test("iOS WebKit date-time control cannot create horizontal page drag", async ({ page }) => {
  await openPlanStep(page, 1);
  const dateWrapper = page.locator(".input-with-icon").filter({ has: page.locator('input[type="datetime-local"]') });
  const dateInput = dateWrapper.locator('input[type="datetime-local"]');
  const [wrapperBox, inputBox] = await Promise.all([dateWrapper.boundingBox(), dateInput.boundingBox()]);
  expect(wrapperBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  expect(inputBox!.x).toBeGreaterThanOrEqual(wrapperBox!.x);
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(wrapperBox!.x + wrapperBox!.width + 1);
  await expectResponsiveContainment(page);

  await page.evaluate(() => window.scrollTo({ left: 100, behavior: "instant" }));
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
  test.describe(`${viewport.width}px visual baselines`, () => {
    test.use({ viewport });

    test("event details", async ({ page }) => {
      await openPlanStep(page, 1);
      await expect(page.locator(".plan-panel")).toHaveScreenshot(`event-details-${viewport.width}.png`);
    });

    test("plan review", async ({ page }) => {
      await openPlanStep(page, 3);
      await expect(page.locator(".plan-panel")).toHaveScreenshot(`plan-review-${viewport.width}.png`);
    });

    test("recipe editor", async ({ page }) => {
      await page.goto("/recipes/plain");
      await page.getByRole("button", { name: "Edit recipe" }).click();
      await expect(page.locator(".recipe-edit-form")).toHaveScreenshot(`recipe-editor-${viewport.width}.png`);
    });
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }]) {
  for (const theme of ["studio", "garden", "confetti"]) {
    test(`${theme} theme stays contained at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/events/sample/plan");
      await page.locator(".app-shell").evaluate((element, nextTheme) => element.setAttribute("data-theme", nextTheme), theme);
      await expectResponsiveContainment(page);
    });
  }
}
