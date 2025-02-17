import { afterAll, expect, test, describe, beforeEach } from "vitest";
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
  "Test on dictionary",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get default dictionary`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getDictionary();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Update dictionary`, async () => {
      const client = await getClient(permission);
      const newDictionary = ["J. K.", "J. R. R."];
      await client.index(index.uid).updateDictionary(newDictionary).waitTask();

      const response = await client.index(index.uid).getDictionary();

      expect(response).toEqual(newDictionary);
    });

    test(`${permission} key: Update dictionary with null value`, async () => {
      const client = await getClient(permission);
      const newDictionary = null;
      await client.index(index.uid).updateDictionary(newDictionary).waitTask();

      const response = await client.index(index.uid).getDictionary();

      expect(response).toEqual([]);
    });

    test(`${permission} key: Reset dictionary`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).resetDictionary().waitTask();

      const response = await client.index(index.uid).getDictionary();

      expect(response).toEqual([]);
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getDictionary(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateDictionary([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetDictionary(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
