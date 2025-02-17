import { expect, test, describe, beforeEach, afterAll } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
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
  "Test on searchable attributes",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default attributes for filtering`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getFilterableAttributes();

      expect(response?.sort()).toEqual([]);
    });

    test(`${permission} key: Update attributes for filtering`, async () => {
      const client = await getClient(permission);
      const newFilterableAttributes = ["genre"];
      const task = await client
        .index(index.uid)
        .updateFilterableAttributes(newFilterableAttributes);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getFilterableAttributes();
      expect(response).toEqual(newFilterableAttributes);
    });

    test(`${permission} key: Update attributes for filtering at null`, async () => {
      const client = await getClient(permission);
      const task = await client
        .index(index.uid)
        .updateFilterableAttributes(null);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getFilterableAttributes();

      expect(response?.sort()).toEqual([]);
    });

    test(`${permission} key: Reset attributes for filtering`, async () => {
      const client = await getClient(permission);
      const task = await client.index(index.uid).resetFilterableAttributes();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getFilterableAttributes();

      expect(response?.sort()).toEqual([]);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on attributes for filtering",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getFilterableAttributes(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateFilterableAttributes([]),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetFilterableAttributes(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on attributes for filtering",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getFilterableAttributes(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateFilterableAttributes([]),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetFilterableAttributes(),
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
  test(`getFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getFilterableAttributes(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateFilterableAttributes([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetFilterableAttributes(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
