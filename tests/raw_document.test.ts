import { expect, test, describe, beforeEach } from "vitest";
import {
  clearAllIndexes,
  config,
  getClient,
} from "./utils/meilisearch-test-utils.js";
import { TaskStatus, ContentTypeEnum } from "../src/types/index.js";

beforeEach(async () => {
  await clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on raw documents addition using `addDocumentsFromString`",
  ({ permission }) => {
    test(`${permission} key: Add documents in CSV format`, async () => {
      const client = await getClient(permission);
      const data = `id,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV);
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in CSV format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `name,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in CSV format with custom delimiter`, async () => {
      const client = await getClient(permission);
      const data = `name;title;comment
123;Pride and Prejudice; A great book
546;Le Petit Prince;a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .addDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
          csvDelimiter: ";",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in JSON lines format`, async () => {
      const client = await getClient(permission);
      const data = `{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const { taskUid } = await client
        .index("jsonl_index")
        .addDocumentsFromString(data, ContentTypeEnum.NDJSON, {});
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in JSON lines with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const { taskUid } = await client
        .index("jsonl_index")
        .addDocumentsFromString(data, ContentTypeEnum.NDJSON, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in JSON format`, async () => {
      const client = await getClient(permission);
      const data = `[{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const { taskUid } = await client
        .index("json_index")
        .addDocumentsFromString(data, ContentTypeEnum.JSON);
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Add documents in JSON format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `[{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const { taskUid } = await client
        .index("json_index")
        .addDocumentsFromString(data, ContentTypeEnum.JSON, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });
  },
);

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on raw documents update using `updateDocumentsFromString`",
  ({ permission }) => {
    test(`${permission} key: Update documents in CSV format`, async () => {
      const client = await getClient(permission);
      const data = `id,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV);
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in CSV format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `name,title,comment
123,Pride and Prejudice, A great book
546,Le Petit Prince,a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in CSV format with custom delimiter`, async () => {
      const client = await getClient(permission);
      const data = `name;title;comment
123;Pride and Prejudice; A great book
546;Le Petit Prince;a french book`;

      const { taskUid } = await client
        .index("csv_index")
        .updateDocumentsFromString(data, ContentTypeEnum.CSV, {
          primaryKey: "name",
          csvDelimiter: ";",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in JSON lines format`, async () => {
      const client = await getClient(permission);
      const data = `{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const { taskUid } = await client
        .index("jsonl_index")
        .updateDocumentsFromString(data, ContentTypeEnum.NDJSON);
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in JSON lines with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" }
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }`;

      const { taskUid } = await client
        .index("jsonl_index")
        .updateDocumentsFromString(data, ContentTypeEnum.NDJSON, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in JSON format`, async () => {
      const client = await getClient(permission);
      const data = `[{ "id": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "id": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const { taskUid } = await client
        .index("json_index")
        .updateDocumentsFromString(data, ContentTypeEnum.JSON, {});
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });

    test(`${permission} key: Update documents in JSON format with custom primary key`, async () => {
      const client = await getClient(permission);
      const data = `[{ "name": 123, "title": "Pride and Prejudice", "comment": "A great book" },
{ "name": 456, "title": "Le Petit Prince", "comment": "A french book" }]`;

      const { taskUid } = await client
        .index("json_index")
        .updateDocumentsFromString(data, ContentTypeEnum.JSON, {
          primaryKey: "name",
        });
      const task = await client.waitForTask(taskUid);

      expect(task.details.receivedDocuments).toBe(2);
      expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED);
    });
  },
);
