import { expect, test, describe, beforeEach, afterAll } from "vitest";
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
  "Test on non separator tokens",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default non separator tokens`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getNonSeparatorTokens();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Update non separator tokens`, async () => {
      const client = await getClient(permission);
      const newNonSeparatorTokens = ["&sep", "/", "|"];
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateNonSeparatorTokens(newNonSeparatorTokens);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getNonSeparatorTokens();

      expect(response).toEqual(newNonSeparatorTokens);
    });

    test(`${permission} key: Update non separator tokens with null value`, async () => {
      const client = await getClient(permission);
      const newNonSeparatorTokens = null;
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateNonSeparatorTokens(newNonSeparatorTokens);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getNonSeparatorTokens();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Reset NonSeparator tokens`, async () => {
      const client = await getClient(permission);
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetNonSeparatorTokens();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getNonSeparatorTokens();

      expect(response).toEqual([]);
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getNonSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/non-separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getNonSeparatorTokens(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateNonSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/non-separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateNonSeparatorTokens([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetNonSeparatorTokens route`, async () => {
    const route = `indexes/${index.uid}/settings/non-separator-tokens`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetNonSeparatorTokens(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
