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

const defaultRankingRules = [
  "words",
  "typo",
  "proximity",
  "attribute",
  "sort",
  "exactness",
];

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on ranking rules",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("master");
      await client.index(index.uid).addDocuments(dataset).waitTask();
    });

    test(`${permission} key: Get default ranking rules`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getRankingRules();
      expect(response).toEqual(defaultRankingRules);
    });

    test(`${permission} key: Update ranking rules`, async () => {
      const client = await getClient(permission);
      const newRankingRules = ["title:asc", "typo", "description:desc"];
      await client
        .index(index.uid)
        .updateRankingRules(newRankingRules)
        .waitTask();

      const response = await client.index(index.uid).getRankingRules();

      expect(response).toEqual(newRankingRules);
    });

    test(`${permission} key: Update ranking rules at null`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).updateRankingRules(null).waitTask();

      const response = await client.index(index.uid).getRankingRules();

      expect(response).toEqual(defaultRankingRules);
    });

    test(`${permission} key: Reset ranking rules`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).resetRankingRules().waitTask();

      const response = await client.index(index.uid).getRankingRules();

      expect(response).toEqual(defaultRankingRules);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on ranking rules",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getRankingRules(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateRankingRules([]),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetRankingRules(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on ranking rules",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getRankingRules(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateRankingRules([]),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetRankingRules(),
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
  test(`getRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getRankingRules(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateRankingRules([]),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetRankingRules(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
