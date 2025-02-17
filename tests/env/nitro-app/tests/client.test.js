const { spawn } = require("node:child_process");

let server;

beforeAll(() => {
  server = spawn("node", [".output/server/index.mjs"]);
});

afterAll(() => {
  server.kill();
});

describe("Meilisearch JS w/ Nitro App Server Browser test", () => {
  it("Should have created an index and displayed it", async () => {
    await new Promise((next) => {
      server.stdout.on("data", () => {
        next();
        server.stdout.removeAllListeners("data");
      });
    });
    const response = await fetch("http://[::]:3000");
    const data = await response.json();

    expect(data.health).toBe(true);
  });
});
