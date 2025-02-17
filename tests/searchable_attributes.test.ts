import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
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

    test(`${permission} key: Get default searchable attributes`, async () => {
      const client = await getClient(permission);

      const response = await client.index(index.uid).getSearchableAttributes();

      expect(response).toEqual(["*"]);
    });

    test(`${permission} key: Update searchable attributes`, async () => {
      const client = await getClient(permission);
      const newSearchableAttributes = ["title"];
      const task = await client
        .index(index.uid)
        .updateSearchableAttributes(newSearchableAttributes);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchableAttributes();

      expect(response).toEqual(newSearchableAttributes);
    });

    test(`${permission} key: Update searchable attributes at null`, async () => {
      const client = await getClient(permission);
      const task = await client
        .index(index.uid)
        .updateSearchableAttributes(null);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchableAttributes();

      expect(response).toEqual(["*"]);
    });

    test(`${permission} key: Reset searchable attributes`, async () => {
      const client = await getClient(permission);
      const task = await client.index(index.uid).resetSearchableAttributes();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchableAttributes();

      expect(response).toEqual(["*"]);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on searchable attributes",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getSearchableAttributes(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateSearchableAttributes([]),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetSearchableAttributes(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on searchable attributes",
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getSearchableAttributes(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateSearchableAttributes([]),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetSearchableAttributes(),
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
  test(`getSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getSearchableAttributes(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateSearchableAttributes([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetSearchableAttributes(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
