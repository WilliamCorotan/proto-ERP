import { expect, test } from "@playwright/test";

for (const path of ["/", "/design-system", "/accounting", "/procurement", "/workflow-inbox", "/quotes", "/orders", "/invoices", "/integrations"]) {
  test(`${path} mobile layout renders without page overflow`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(".erp-shell")).toBeVisible();
    const layout = await page.evaluate(() => {
      const shell = document.querySelector(".erp-shell");
      const sidebar = document.querySelector(".sidebar");
      const main = document.querySelector("main");
      if (!shell || !sidebar || !main) {
        return null;
      }
      const shellRect = shell.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();

      return {
        bodyOverflows: document.documentElement.scrollWidth > window.innerWidth + 2,
        mainHeight: mainRect.height,
        shellWidth: shellRect.width,
        sidebarHeight: sidebar.getBoundingClientRect().height
      };
    });

    expect(layout).not.toBeNull();
    expect(layout?.shellWidth).toBeGreaterThan(300);
    expect(layout?.mainHeight).toBeGreaterThan(400);
    expect(layout?.sidebarHeight).toBeGreaterThan(40);
    expect(layout?.bodyOverflows).toBe(false);
  });
}
