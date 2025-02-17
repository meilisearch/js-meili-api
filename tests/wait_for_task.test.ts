import { afterAll, beforeEach, describe, expect, test, assert } from "vitest";
import {
  clearAllIndexes,
  config,
  getClient,
  dataset,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on wait for task",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    // Client Wait for task
    test(`${permission} key: Tests wait for task in client until done and resolved`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask();

      assert.strictEqual(update.status, "succeeded");
    });

    test(`${permission} key: Tests wait for task in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask({
          timeout: 6000,
          interval: 100,
        });

      assert.strictEqual(update.status, "succeeded");
    });

    test(`${permission} key: Tests wait for task in client with custom timeout and interval at 0 done and resolved`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask({
          timeout: 6000,
          interval: 0,
        });

      assert.strictEqual(update.status, "succeeded");
    });

    test(`${permission} key: Try to wait for task in client with small timeout and raise an error`, async () => {
      const client = await getClient(permission);

      await expect(
        client.index(index.uid).addDocuments(dataset).waitTask({ timeout: 1 }),
      ).rejects.toHaveProperty("name", "MeiliSearchTimeOutError");
    });

    // Index Wait for task
    test(`${permission} key: Tests wait for task with an index instance`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask();

      assert.strictEqual(update.status, "succeeded");
    });

    // Client Wait for tasks
    test(`${permission} key: Tests wait for tasks in client until done and resolved`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      const tasks = await client.tasks.waitForTasks([task1, task2]);
      const [update1, update2] = tasks;

      assert.strictEqual(update1.status, "succeeded");
      assert.strictEqual(update2.status, "succeeded");
    });

    test(`${permission} key: Tests wait for tasks in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      const tasks = await client.tasks.waitForTasks([task1, task2], {
        timeout: 6000,
        interval: 100,
      });
      const [update1, update2] = tasks;

      assert.strictEqual(update1.status, "succeeded");
      assert.strictEqual(update2.status, "succeeded");
    });

    test(`${permission} key: Tests wait for tasks in client with custom timeout and interval at 0 done and resolved`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      const tasks = await client.tasks.waitForTasks([task1, task2], {
        timeout: 6000,
        interval: 0,
      });
      const [update1, update2] = tasks;

      assert.strictEqual(update1.status, "succeeded");
      assert.strictEqual(update2.status, "succeeded");
    });

    test(`${permission} key: Tests to wait for tasks in client with small timeout and raise an error`, async () => {
      const client = await getClient(permission);

      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      await expect(
        client.tasks.waitForTasks([task1, task2], { timeout: 1 }),
      ).rejects.toHaveProperty("name", "MeiliSearchTimeOutError");
    });

    test(`${permission} key: Tests to wait for task that doesn't exist`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.waitForTask(424242424242),
      ).rejects.toHaveProperty("name", "MeiliSearchApiError");
    });
  },
);
