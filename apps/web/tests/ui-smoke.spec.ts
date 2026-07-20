import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", text: "Command center" },
  { path: "/design-system", text: "Command Center" },
  { path: "/accounting", text: "Trial balance" },
  { path: "/procurement", text: "Purchase orders" },
  { path: "/workflow-inbox", text: "Workflow Inbox" },
  { path: "/quotes", text: "Quotes" },
  { path: "/orders", text: "Sales Orders" },
  { path: "/invoices", text: "Invoices" },
  { path: "/inventory", text: "Inventory" },
  { path: "/manufacturing", text: "Manufacturing" },
  { path: "/integrations", text: "API and event operations" },
  { path: "/settings", text: "Settings and modules" },
];

for (const route of routes) {
  test(`${route.path} renders command-center UI`, async ({ page }) => {
    await page.goto(route.path);
    await expect(
      page.getByText(route.text, { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Design system" }),
    ).toBeVisible();
    const layout = await page.evaluate(() => {
      const shell = document.querySelector(".erp-shell");
      const sidebar = document.querySelector(".sidebar");
      const main = document.querySelector("main");
      const topbar = document.querySelector(".topbar");
      if (!shell || !sidebar || !main || !topbar) {
        return null;
      }
      const shellRect = shell.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const topbarRect = topbar.getBoundingClientRect();

      return {
        bodyOverflows:
          document.documentElement.scrollWidth > window.innerWidth + 2,
        mainHeight: mainRect.height,
        shellWidth: shellRect.width,
        sidebarBackground: getComputedStyle(sidebar).backgroundColor,
        topbarHeight: topbarRect.height,
      };
    });

    expect(layout).not.toBeNull();
    expect(layout?.shellWidth).toBeGreaterThan(1_000);
    expect(layout?.mainHeight).toBeGreaterThan(400);
    expect(layout?.topbarHeight).toBeGreaterThan(48);
    expect(layout?.sidebarBackground).not.toBe("rgba(0, 0, 0, 0)");
    expect(layout?.bodyOverflows).toBe(false);
  });
}

test("command palette filters and navigates", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("/");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await page
    .getByPlaceholder("Type a module, record area, or workspace")
    .fill("inventory");
  await expect(page.getByRole("link", { name: /Inventory/ })).toBeVisible();
  await page.getByRole("link", { name: /Inventory/ }).click();
  await expect(page).toHaveURL(/\/inventory$/);
});

test("procurement renders workflow actions and history surfaces", async ({
  page,
}) => {
  await page.goto("/procurement");
  await expect(
    page.getByText("Purchase orders", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.locator(".workflow-action-bar").first()).toBeVisible();
  await expect(page.locator(".workflow-history").first()).toBeVisible();
});

for (const path of ["/quotes", "/orders", "/invoices"]) {
  test(`${path} renders sales workflow actions and history surfaces`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator(".workflow-action-bar").first()).toBeVisible();
    await expect(page.locator(".workflow-history").first()).toBeVisible();
  });
}

test("workflow inbox renders assigned tasks and action forms", async ({
  page,
}) => {
  await page.goto("/workflow-inbox");
  await expect(page.getByText("Action queue")).toBeVisible();
  await expect(page.locator(".workflow-task-card").first()).toBeVisible();
  await expect(page.locator(".workflow-task-action").first()).toBeVisible();
});

test("settings renders workflow assignment policy controls", async ({
  page,
}) => {
  await page.goto("/settings");
  await expect(page.getByText("Assignment rules")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save assignment" }),
  ).toBeVisible();
  await expect(page.getByText("Escalation rules")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save escalation" }),
  ).toBeVisible();
});

test("integrations renders workflow task notification status", async ({
  page,
}) => {
  await page.goto("/integrations");
  await expect(
    page.getByRole("heading", { name: "Workflow task operations" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
});
