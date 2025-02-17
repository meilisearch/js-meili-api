import { expect, test, describe, beforeEach, afterAll } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const indexNoPk = {
  uid: "movies_test",
};
const indexPk = {
  uid: "movies_test2",
  primaryKey: "id",
};

afterAll(() => clearAllIndexes(config));

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on indexes w/ master and admin key",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    test(`${permission} key: create index with NO primary key`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const newIndex = await client.getIndex(indexNoPk.uid);

      expect(newIndex).toHaveProperty("uid", indexNoPk.uid);
      expect(newIndex).toHaveProperty("primaryKey", null);

      const rawIndex = await client.index(indexNoPk.uid).getRawInfo();

      expect(rawIndex).toHaveProperty("uid", indexNoPk.uid);
      expect(rawIndex).toHaveProperty("primaryKey", null);
      expect(rawIndex).toHaveProperty("createdAt", expect.any(String));
      expect(rawIndex).toHaveProperty("updatedAt", expect.any(String));
    });

    test(`${permission} key: create index with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();

      const newIndex = await client.getIndex(indexPk.uid);

      expect(newIndex).toHaveProperty("uid", indexPk.uid);
      expect(newIndex).toHaveProperty("primaryKey", indexPk.primaryKey);

      const rawIndex = await client.index(indexPk.uid).getRawInfo();

      expect(rawIndex).toHaveProperty("uid", indexPk.uid);
      expect(rawIndex).toHaveProperty("primaryKey", indexPk.primaryKey);
      expect(rawIndex).toHaveProperty("createdAt", expect.any(String));
      expect(rawIndex).toHaveProperty("updatedAt", expect.any(String));
    });

    test(`${permission} key: Get raw index that exists`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexPk.uid).waitTask();

      const response = await client.getRawIndex(indexPk.uid);

      expect(response).toHaveProperty("uid", indexPk.uid);
    });

    test(`${permission} key: Get all indexes in Index instances`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexPk.uid).waitTask();

      const { results } = await client.getRawIndexes();

      expect(results.length).toEqual(1);
      expect(results[0].uid).toEqual(indexPk.uid);
    });

    test(`${permission} key: Get index that does not exist`, async () => {
      const client = await getClient(permission);
      await expect(client.getIndex("does_not_exist")).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INDEX_NOT_FOUND,
      );
    });

    test(`${permission} key: Get raw index that does not exist`, async () => {
      const client = await getClient(permission);
      await expect(client.getRawIndex("does_not_exist")).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INDEX_NOT_FOUND,
      );
    });

    test(`${permission} key: Get raw index info through client with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, { primaryKey: indexPk.primaryKey })
        .waitTask();

      const response = await client.getRawIndex(indexPk.uid);

      expect(response).toHaveProperty("uid", indexPk.uid);
      expect(response).toHaveProperty("primaryKey", indexPk.primaryKey);
    });

    test(`${permission} key: Get raw index info through client with NO primary key`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const response = await client.getRawIndex(indexNoPk.uid);

      expect(response).toHaveProperty("uid", indexNoPk.uid);
      expect(response).toHaveProperty("primaryKey", null);
    });

    test(`${permission} key: Get raw index info with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, { primaryKey: indexPk.primaryKey })
        .waitTask();

      const response = await client.index(indexPk.uid).getRawInfo();

      expect(response).toHaveProperty("uid", indexPk.uid);
      expect(response).toHaveProperty("primaryKey", indexPk.primaryKey);
    });

    test(`${permission} key: Get raw index info with NO primary key`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const response = await client.index(indexNoPk.uid).getRawInfo();

      expect(response).toHaveProperty("uid", indexNoPk.uid);
      expect(response).toHaveProperty("primaryKey", null);
    });

    test(`${permission} key: fetch index with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();

      const index = client.index(indexPk.uid);
      const response = await index.fetchInfo();

      expect(response).toHaveProperty("uid", indexPk.uid);
      expect(response).toHaveProperty("primaryKey", indexPk.primaryKey);
    });

    test(`${permission} key: fetch primary key on an index with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();

      const index = client.index(indexPk.uid);
      const response: string | undefined = await index.fetchPrimaryKey();

      expect(response).toBe(indexPk.primaryKey);
    });

    test(`${permission} key: fetch primary key on an index with NO primary key`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const index = client.index(indexNoPk.uid);
      const response: string | undefined = await index.fetchPrimaryKey();

      expect(response).toBe(null);
    });

    test(`${permission} key: fetch index with primary key`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();

      const index = client.index(indexPk.uid);
      const response = await index.fetchInfo();

      expect(response).toHaveProperty("uid", indexPk.uid);
      expect(response).toHaveProperty("primaryKey", indexPk.primaryKey);
    });

    test(`${permission} key: fetch index with NO primary key`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const index = client.index(indexNoPk.uid);
      const response = await index.fetchInfo();

      expect(response).toHaveProperty("uid", indexNoPk.uid);
      expect(response).toHaveProperty("primaryKey", null);
    });

    test(`${permission} key: get all indexes`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();
      await client.createIndex(indexPk.uid).waitTask();

      const indexes = await client.getIndexes();

      expect(indexes.results.length).toEqual(2);
    });

    test(`${permission} key: get all indexes with filters`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();
      await client.createIndex(indexPk.uid).waitTask();

      const indexes = await client.getIndexes({ limit: 1, offset: 1 });

      expect(indexes.results.length).toEqual(1);
      expect(indexes.results[0].uid).toEqual(indexPk.uid);
    });

    test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();
      await client
        .index(indexNoPk.uid)
        .update({ primaryKey: "newPrimaryKey" })
        .waitTask();

      const index = await client.getIndex(indexNoPk.uid);

      expect(index).toHaveProperty("uid", indexNoPk.uid);
      expect(index).toHaveProperty("primaryKey", "newPrimaryKey");
    });

    test(`${permission} key: update primary key on an index that has NO primary key already through client`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();
      await client
        .updateIndex(indexNoPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();

      const index = await client.getIndex(indexNoPk.uid);

      expect(index).toHaveProperty("uid", indexNoPk.uid);
      expect(index).toHaveProperty("primaryKey", indexPk.primaryKey);
    });

    test(`${permission} key: update primary key on an index that has already a primary key and fail through client`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        .waitTask();
      await client
        .updateIndex(indexPk.uid, {
          primaryKey: "newPrimaryKey",
        })
        .waitTask();

      const index = await client.getIndex(indexPk.uid);

      expect(index).toHaveProperty("uid", indexPk.uid);
      expect(index).toHaveProperty("primaryKey", "newPrimaryKey");
    });

    test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
      const client = await getClient(permission);
      await client
        .createIndex(indexPk.uid, { primaryKey: indexPk.primaryKey })
        .waitTask();
      await client
        .index(indexPk.uid)
        .update({ primaryKey: "newPrimaryKey" })
        .waitTask();

      const index = await client.getIndex(indexPk.uid);

      expect(index).toHaveProperty("uid", indexPk.uid);
      expect(index).toHaveProperty("primaryKey", "newPrimaryKey");
    });

    test(`${permission} key: delete index`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();
      await client.index(indexNoPk.uid).delete().waitTask();

      const { results } = await client.getIndexes();

      expect(results).toHaveLength(0);
    });

    test(`${permission} key: delete index using client`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexPk.uid);
      await client.deleteIndex(indexPk.uid).waitTask();

      const { results } = await client.getIndexes();

      expect(results).toHaveLength(0);
    });

    test(`${permission} key: fetch deleted index should fail`, async () => {
      const client = await getClient(permission);
      const index = client.index(indexNoPk.uid);
      await expect(index.getRawInfo()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INDEX_NOT_FOUND,
      );
    });

    test(`${permission} key: get deleted raw index should fail through client`, async () => {
      const client = await getClient(permission);
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INDEX_NOT_FOUND,
      );
    });

    test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
      const client = await getClient(permission);
      const index = client.index(indexNoPk.uid);
      const task = await index.delete().waitTask();

      expect(task.status).toBe("failed");
    });

    test(`${permission} key: get stats of an index`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexNoPk.uid).waitTask();

      const response = await client.index(indexNoPk.uid).getStats();

      expect(response).toHaveProperty("numberOfDocuments", 0);
      expect(response).toHaveProperty("isIndexing", false);
      expect(response).toHaveProperty("fieldDistribution", {});
    });

    test(`${permission} key: Get updatedAt and createdAt through fetch info`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexPk.uid).waitTask();

      const index = await client.index(indexPk.uid).fetchInfo();

      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
    });

    test(`${permission} key: Get updatedAt and createdAt index through getRawInfo`, async () => {
      const client = await getClient(permission);
      await client.createIndex(indexPk.uid).waitTask();

      const index = client.index(indexPk.uid);

      expect(index.createdAt).toBe(undefined);
      expect(index.updatedAt).toBe(undefined);

      await index.getRawInfo();

      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on routes with search key",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    test(`${permission} key: try to get index info and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(indexNoPk.uid).getRawInfo(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to get raw index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });

    test(`${permission} key: try to delete index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });

    test(`${permission} key: try to update index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to get stats and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_API_KEY,
      );
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on routes without an API key",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    test(`${permission} key: try to get all indexes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.getIndexes()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to get index info and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(indexNoPk.uid).getRawInfo(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to get raw index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to delete index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update index and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey }),
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
  test(`getStats route`, async () => {
    const route = `indexes/${indexPk.uid}/stats`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`getRawInfo route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      "name",
      "MeiliSearchRequestError",
    );
  });

  test(`getRawIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      "name",
      "MeiliSearchRequestError",
    );
  });

  test(`updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`delete index route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
