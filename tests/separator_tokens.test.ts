import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { EnqueuedTask } from "../src/enqueued-task.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
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
  "Test on separator tokens",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default separator tokens`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getSeparatorTokens();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Update separator tokens`, async () => {
      const client = await getClient(permission);
      const newSeparatorTokens = ["&sep", "/", "|"];
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSeparatorTokens(newSeparatorTokens);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSeparatorTokens();

      expect(response).toEqual(newSeparatorTokens);
    });

    test(`${permission} key: Update separator tokens with null value`, async () => {
      const client = await getClient(permission);
      const newSeparatorTokens = null;
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSeparatorTokens(newSeparatorTokens);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSeparatorTokens();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Reset separator tokens`, async () => {
      const client = await getClient(permission);
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetSeparatorTokens();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSeparatorTokens();

      expect(response).toEqual([]);
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getSeparatorTokens(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateSeparatorTokens([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetSeparatorTokens(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
