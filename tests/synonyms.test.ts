import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { ErrorStatusCode } from "../src/types.js";
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
  "Test on synonyms",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default synonyms`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getSynonyms();

      expect(response).toEqual({});
    });

    test(`${permission} key: Update synonyms`, async () => {
      const client = await getClient(permission);
      const newSynonyms = {
        hp: ["harry potter"],
      };
      const task = await client.index(index.uid).updateSynonyms(newSynonyms);
      await client.waitForTask(task.taskUid);

      const response: object = await client.index(index.uid).getSynonyms();

      expect(response).toEqual(newSynonyms);
    });

    test(`${permission} key: Update synonyms with null value`, async () => {
      const client = await getClient(permission);
      const newSynonyms = null;
      const task = await client.index(index.uid).updateSynonyms(newSynonyms);
      await client.waitForTask(task.taskUid);

      const response: object = await client.index(index.uid).getSynonyms();

      expect(response).toEqual({});
    });

    test(`${permission} key: Reset synonyms`, async () => {
      const client = await getClient(permission);
      const task = await client.index(index.uid).resetSynonyms();
      await client.waitForTask(task.taskUid);

      const response: object = await client.index(index.uid).getSynonyms();

      expect(response).toEqual({});
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on synonyms",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get synonyms and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getSynonyms(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update synonyms and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateSynonyms({}),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetSynonyms(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])("Test on synonyms", ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config);
  });

  test(`${permission} key: try to get synonyms and be denied`, async () => {
    const client = await getClient(permission);
    await expect(client.index(index.uid).getSynonyms()).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });

  test(`${permission} key: try to update synonyms and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).updateSynonyms({}),
    ).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });

  test(`${permission} key: try to reset synonyms and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).resetSynonyms(),
    ).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });
});

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getSynonyms()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateSynonyms({}),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetSynonyms(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
