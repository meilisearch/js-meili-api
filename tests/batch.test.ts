import { afterAll, beforeEach, describe, expect, test } from "vitest";
import {
  config,
  getClient,
  clearAllIndexes,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "batch-test",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Tests on batches",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: Get all batches`, async () => {
      const client = await getClient(permission);
      const batches = await client.batches.getBatches();
      expect(batches.results.length).toBeGreaterThan(0);
    });

    test(`${permission} key: Get one batch`, async () => {
      const client = await getClient(permission);

      const batches = await client.batches.getBatches();
      const batch = await client.batches.getBatch(batches.results[0].uid);
      expect(batch.uid).toEqual(batches.results[0].uid);
      expect(batch.details).toBeDefined();
      expect(batch.stats).toHaveProperty("totalNbTasks");
      expect(batch.stats).toHaveProperty("status");
      expect(batch.stats).toHaveProperty("types");
      expect(batch.stats).toHaveProperty("indexUids");
      expect(batch.duration).toBeDefined();
      expect(batch.startedAt).toBeDefined();
      expect(batch.finishedAt).toBeDefined();
      expect(batch.progress).toBeDefined();
    });
  },
);
