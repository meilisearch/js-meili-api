describe("Meilisearch JS Browser test", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:3000/meilisearch");
  });

  it("Should have created an index and displayed it", async () => {
    await page.waitForSelector("#indexes");
    let element = await page.$("#indexes");
    let value = await page.evaluate((el) => el.textContent, element);
    await expect(value).toMatch("testIndex");
  });
});

describe("Meilisearch JS CORS test", () => {
  beforeAll(async () => {
    await page.goto("http://localhost:3000/headers");
  });
  it("Should not throw cors error", async () => {
    await page.waitForSelector("#error");
    let element = await page.$("#error");
    let value = await page.evaluate((el) => el.textContent, element);
    await expect(value).toMatch("NO ERRORS");
  });
});
