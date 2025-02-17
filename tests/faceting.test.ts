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
  "Test on faceting",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();

      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get default faceting object`, async () => {
      const client = await getClient(permission);

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Update faceting settings`, async () => {
      const client = await getClient(permission);
      const newFaceting = {
        maxValuesPerFacet: 12,
        sortFacetValuesBy: { test: "count" as "count" },
      };
      await client.index(index.uid).updateFaceting(newFaceting).waitTask();

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Update faceting at null`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateFaceting({ maxValuesPerFacet: null })
        .waitTask();

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Reset faceting`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateFaceting({ maxValuesPerFacet: 12 })
        .waitTask();

      await client.index(index.uid).resetFaceting().waitTask();

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on faceting",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get faceting and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getFaceting(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update faceting and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateFaceting({ maxValuesPerFacet: 13 }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset faceting and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetFaceting(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])("Test on faceting", ({ permission }) => {
  beforeAll(async () => {
    const client = await getClient("Master");
    await client.createIndex(index.uid).waitTask();
  });

  test(`${permission} key: try to get faceting and be denied`, async () => {
    const client = await getClient(permission);
    await expect(client.index(index.uid).getFaceting()).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });

  test(`${permission} key: try to update faceting and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).updateFaceting({ maxValuesPerFacet: 13 }),
    ).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });

  test(`${permission} key: try to reset faceting and be denied`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).resetFaceting(),
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
  test(`getFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/faceting`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getFaceting()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/faceting`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateFaceting({ maxValuesPerFacet: undefined }),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/faceting`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetFaceting(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
