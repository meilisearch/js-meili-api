import {
  expect,
  test,
  describe,
  beforeEach,
  afterAll,
  beforeAll,
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
  "Test on pagination",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get default pagination settings`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getPagination();

      expect(response).toEqual({ maxTotalHits: 1000 });
    });

    test(`${permission} key: Update pagination`, async () => {
      const client = await getClient(permission);
      const newPagination = {
        maxTotalHits: 100,
      };
      await client.index(index.uid).updatePagination(newPagination).waitTask();

      const response = await client.index(index.uid).getPagination();

      expect(response).toEqual(newPagination);
    });

    test(`${permission} key: Update pagination at null`, async () => {
      const client = await getClient(permission);
      const newPagination = {
        maxTotalHits: null,
      };
      await client.index(index.uid).updatePagination(newPagination).waitTask();

      const response = await client.index(index.uid).getPagination();

      expect(response).toEqual({ maxTotalHits: 1000 });
    });

    test(`${permission} key: Reset pagination`, async () => {
      const client = await getClient(permission);
      const newPagination = {
        maxTotalHits: 100,
      };
      await client.index(index.uid).updatePagination(newPagination).waitTask();
      await client.index(index.uid).resetPagination().waitTask();

      const response = await client.index(index.uid).getPagination();

      expect(response).toEqual({ maxTotalHits: 1000 });
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on pagination",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getPagination(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updatePagination({ maxTotalHits: 10 }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetPagination(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on pagination",
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getPagination(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updatePagination({ maxTotalHits: 10 }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset pagination and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetPagination(),
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
  test(`getPagination route`, async () => {
    const route = `indexes/${index.uid}/settings/pagination`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getPagination(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updatePagination route`, async () => {
    const route = `indexes/${index.uid}/settings/pagination`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updatePagination({ maxTotalHits: null }),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetPagination route`, async () => {
    const route = `indexes/${index.uid}/settings/pagination`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetPagination(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
