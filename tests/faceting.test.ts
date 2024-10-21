import {
  expect,
  test,
  describe,
  beforeEach,
  afterAll,
  beforeAll,
} from "vitest";
import { ErrorStatusCode } from "../src/types";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from "./utils/meilisearch-test-utils";

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
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);

      const { taskUid: docTask } = await client
        .index(index.uid)
        .addDocuments(dataset);
      await client.waitForTask(docTask);
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
        sortFacetValuesBy: { test: "count" as const },
      };
      const task = await client.index(index.uid).updateFaceting(newFaceting);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Update faceting at null`, async () => {
      const client = await getClient(permission);
      const task = await client
        .index(index.uid)
        .updateFaceting({ maxValuesPerFacet: null });
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getFaceting();

      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Reset faceting`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .waitForTask(
          (
            await client
              .index(index.uid)
              .updateFaceting({ maxValuesPerFacet: 12 })
          ).taskUid,
        );
      const task = await client.index(index.uid).resetFaceting();
      await client.index(index.uid).waitForTask(task.taskUid);

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
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
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
    const { taskUid } = await client.createIndex(index.uid);
    await client.waitForTask(taskUid);
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
      client.index(index.uid).updateFaceting({ maxValuesPerFacet: null }),
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
