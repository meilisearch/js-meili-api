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
  "Test on prefix search settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get prefixSearch settings on empty index`, async () => {
      const client = await getClient(permission);

      const response = await client.index(index.uid).getPrefixSearch();
      expect(response).toMatchSnapshot();
    });

    test(`${permission} key: Set prefixSearch settings with dedicated endpoint on empty index`, async () => {
      const client = await getClient(permission);

      await client.index(index.uid).updatePrefixSearch("disabled").waitTask();

      const updatedSettings = await client.index(index.uid).getPrefixSearch();
      expect(updatedSettings).toBe("disabled");
    });

    test(`${permission} key: Reset prefixSearch settings on an empty index`, async () => {
      const client = await getClient(permission);

      await client.index(index.uid).resetPrefixSearch().waitTask();

      const response = await client.index(index.uid).getPrefixSearch();
      expect(response).toMatchSnapshot();
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on prefix search settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getPrefixSearch(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updatePrefixSearch("disabled"),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetPrefixSearch(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on prefix search settings",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: try to get prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getPrefixSearch(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updatePrefixSearch("disabled"),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset prefix search settings and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetPrefixSearch(),
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
  test(`getPrefixSearch route`, async () => {
    const route = `indexes/${index.uid}/settings/prefix-search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getPrefixSearch(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updatePrefixSearch route`, async () => {
    const route = `indexes/${index.uid}/settings/prefix-search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updatePrefixSearch("disabled"),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetPrefixSearch route`, async () => {
    const route = `indexes/${index.uid}/settings/prefix-search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetPrefixSearch(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
