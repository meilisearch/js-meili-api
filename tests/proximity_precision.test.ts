import { afterAll, describe, test, beforeEach, expect } from "vitest";
import { EnqueuedTask } from "../src/enqueued-task.js";
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
  "Test on proximity precision",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default proximity precision`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getProximityPrecision();

      expect(response).toEqual("byWord");
    });

    test(`${permission} key: Update proximity precision with 'byAttribute' value`, async () => {
      const client = await getClient(permission);
      const newProximityPrecision = "byAttribute";
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateProximityPrecision(newProximityPrecision);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getProximityPrecision();

      expect(response).toEqual(newProximityPrecision);
    });

    test(`${permission} key: Update proximity precision with 'byWord' value`, async () => {
      const client = await getClient(permission);
      const newProximityPrecision = "byWord";
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateProximityPrecision(newProximityPrecision);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getProximityPrecision();

      expect(response).toEqual(newProximityPrecision);
    });

    test(`${permission} key: Reset proximity precision`, async () => {
      const client = await getClient(permission);
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetProximityPrecision();
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getProximityPrecision();

      expect(response).toEqual("byWord");
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getProximityPrecision(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateProximityPrecision("byAttribute"),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetProximityPrecision(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
