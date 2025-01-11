import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { ErrorStatusCode } from "../src/types.js";
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
  "Test on stop words",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default stop words`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getStopWords();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Update stop words`, async () => {
      const client = await getClient(permission);
      const newStopWords = ["the"];
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateStopWords(newStopWords);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response: string[] = await client.index(index.uid).getStopWords();

      expect(response).toEqual(newStopWords);
    });

    test(`${permission} key: Update stop words with null value`, async () => {
      const client = await getClient(permission);
      const newStopWords = null;
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateStopWords(newStopWords);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response: string[] = await client.index(index.uid).getStopWords();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Reset stop words`, async () => {
      const client = await getClient(permission);
      const task: EnqueuedTask = await client.index(index.uid).resetStopWords();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response: string[] = await client.index(index.uid).getStopWords();

      expect(response).toEqual([]);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on stop words",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getStopWords(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateStopWords([]),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetStopWords(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on stop words",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getStopWords(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateStopWords([]),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetStopWords(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getStopWords()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateStopWords([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetStopWords(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
