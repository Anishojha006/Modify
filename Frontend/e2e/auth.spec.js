import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
    await page.route(/\/get-me$/, (route) =>
        route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ message: "Not authenticated" }),
        }),
    );
});

test("user can log in and reach the protected dashboard", async ({ page }) => {
    await page.route(/\/login$/, async (route) => {
        if (route.request().method() !== "POST") {
            await route.continue();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                message: "Logged in",
                user: { username: "qa-member", email: "qa@example.com" },
            }),
        });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("qa@example.com");
    await page.getByLabel("Password").fill("test-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
});

test("registration rejects mismatched passwords before sending a request", async ({ page }) => {
    let registrationRequests = 0;
    await page.route(/\/register$/, async (route) => {
        if (route.request().method() !== "POST") {
            await route.continue();
            return;
        }

        registrationRequests += 1;
        await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
                user: { username: "qa-member", email: "qa@example.com" },
            }),
        });
    });

    await page.goto("/register");
    await page.getByLabel("Username").fill("qa-member");
    await page.getByLabel("Email").fill("qa@example.com");
    await page.getByLabel("Password", { exact: true }).fill("test-password");
    await page.getByLabel("Confirm Password").fill("different-password");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByRole("alert")).toHaveText("Passwords do not match.");
    expect(registrationRequests).toBe(0);
});
