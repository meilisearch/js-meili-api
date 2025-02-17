import { afterAll, expect, test, describe, beforeEach } from "vitest";
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
  "Test on distinct attribute",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("master");

      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default distinct attribute`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getDistinctAttribute();
      expect(response).toEqual(null);
    });

    test(`${permission} key: Update distinct attribute`, async () => {
      const client = await getClient(permission);
      const newDistinctAttribute = "title";
      const task = await client
        .index(index.uid)
        .updateDistinctAttribute(newDistinctAttribute);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getDistinctAttribute();

      expect(response).toEqual(newDistinctAttribute);
    });

    test(`${permission} key: Update distinct attribute at null`, async () => {
      const client = await getClient(permission);
      const task = await client.index(index.uid).updateDistinctAttribute(null);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getDistinctAttribute();

      expect(response).toEqual(null);
    });

    test(`${permission} key: Reset distinct attribute`, async () => {
      const client = await getClient(permission);
      const task = await client.index(index.uid).resetDistinctAttribute();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getDistinctAttribute();

      expect(response).toEqual(null);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on distinct attribute",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getDistinctAttribute(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateDistinctAttribute("title"),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetDistinctAttribute(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on distinct attribute",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getDistinctAttribute(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateDistinctAttribute("title"),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetDistinctAttribute(),
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
  test(`getDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getDistinctAttribute(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateDistinctAttribute("a"),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetDistinctAttribute(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
