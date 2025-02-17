import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { ErrorStatusCode, TaskTypes, TaskStatus } from "../src/types/index.js";
import { sleep } from "../src/utils.js";
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

const index2 = {
  uid: "movies_test2",
};

const index3 = {
  uid: "movies_test2",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Tests on tasks",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get one enqueued task`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.index(index.uid).addDocuments(dataset);

      expect(enqueuedTask.taskUid).toBeDefined();
      expect(enqueuedTask.indexUid).toEqual(index.uid);
      expect(enqueuedTask.status).toBeDefined();
      expect(enqueuedTask.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE);
      expect(enqueuedTask.enqueuedAt).toBeDefined();
      expect(enqueuedTask.enqueuedAt).toBeInstanceOf(Date);
    });

    test(`${permission} key: Get one task`, async () => {
      const client = await getClient(permission);
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(enqueuedTask.taskUid);

      const task = await client.getTask(enqueuedTask.taskUid);

      expect(task.indexUid).toEqual(index.uid);
      expect(task.batchUid).toBeDefined();
      expect(task.status).toEqual(TaskStatus.TASK_SUCCEEDED);
      expect(task.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE);
      expect(task.uid).toEqual(enqueuedTask.taskUid);
      expect(task).toHaveProperty("details");
      expect(task.details.indexedDocuments).toEqual(7);
      expect(task.details.receivedDocuments).toEqual(7);
      expect(task.duration).toBeDefined();
      expect(task.enqueuedAt).toBeDefined();
      expect(task.enqueuedAt).toBeInstanceOf(Date);
      expect(task.finishedAt).toBeDefined();
      expect(task.finishedAt).toBeInstanceOf(Date);
      expect(task.startedAt).toBeDefined();
      expect(task.startedAt).toBeInstanceOf(Date);
      expect(task.error).toBeNull();
    });

    test(`${permission} key: Get one task with index instance`, async () => {
      const client = await getClient(permission);
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(enqueuedTask.taskUid);

      const task = await client.index(index.uid).getTask(enqueuedTask.taskUid);

      expect(task.indexUid).toEqual(index.uid);
      expect(task.uid).toEqual(enqueuedTask.taskUid);
    });

    // get tasks
    test(`${permission} key: Get all tasks`, async () => {
      const client = await getClient(permission);
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.waitForTask(enqueuedTask.taskUid);

      const tasks = await client.getTasks();

      expect(tasks.results).toBeInstanceOf(Array);
      expect(tasks.total).toBeDefined();
      expect(tasks.results[0].uid).toEqual(enqueuedTask.taskUid);
    });

    // get tasks: type
    test(`${permission} key: Get all tasks with type filter`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.index(index.uid).deleteDocument(1);
      await client.createIndex(index2.uid);

      const tasks = await client.getTasks({
        types: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      });
      const onlyDocumentAddition = new Set(
        tasks.results.map((task) => task.type),
      );

      expect(onlyDocumentAddition.size).toEqual(2);
    });

    // get tasks: type
    test(`${permission} key: Get all tasks with type filter on an index`, async () => {
      const client = await getClient(permission);
      await client.deleteIndex(index2.uid);
      await client.createIndex(index2.uid);
      await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.index(index2.uid).addDocuments([{ id: 1 }]);
      await client.index(index2.uid).deleteDocument(1);

      const tasks = await client.index(index.uid).getTasks({
        types: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      });
      const onlyDocumentAddition = new Set(
        tasks.results.map((task) => task.type),
      );

      expect(onlyDocumentAddition.size).toEqual(2);
    });

    // get tasks: pagination
    test(`${permission} key: Get all tasks with pagination`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }]);
      const task2 = await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.waitForTask(task1.taskUid);
      await client.waitForTask(task2.taskUid);

      const tasks = await client.getTasks({ from: task1.taskUid, limit: 1 });

      expect(tasks.results.length).toEqual(1);
      expect(tasks.from).toEqual(task1.taskUid);
      expect(tasks.limit).toEqual(1);
      expect(tasks.next).toEqual(task1.taskUid - 1);
    });

    // get tasks: status
    test(`${permission} key: Get all tasks with status filter`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }]);
      const task2 = await client.index(index.uid).addDocuments([{}]);
      await client.waitForTask(task1.taskUid);
      await client.waitForTask(task2.taskUid);

      const tasks = await client.getTasks({
        statuses: [TaskStatus.TASK_SUCCEEDED, TaskStatus.TASK_FAILED],
      });
      const onlySuccesfullTasks = new Set(
        tasks.results.map((task) => task.status),
      );

      expect(onlySuccesfullTasks.size).toEqual(2);
    });

    // get tasks: status
    test(`${permission} key: Get all tasks with status filter on an index`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }]);
      const task2 = await client.index(index.uid).addDocuments([{}]);
      const task3 = await client.index(index2.uid).addDocuments([{}]);
      await client.waitForTask(task1.taskUid);
      await client.waitForTask(task2.taskUid);
      await client.waitForTask(task3.taskUid);

      const tasks = await client.index(index.uid).getTasks({
        statuses: [TaskStatus.TASK_SUCCEEDED, TaskStatus.TASK_FAILED],
      });
      const onlySuccesfullTasks = new Set(
        tasks.results.map((task) => task.status),
      );
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid),
      );

      expect(onlySuccesfullTasks.size).toEqual(2);
      expect(onlyTaskWithSameUid.size).toEqual(1);
    });

    // get tasks: indexUid
    test(`${permission} key: Get all tasks with indexUid filter`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.index(index2.uid).addDocuments([{ id: 1 }]);
      await client.index(index3.uid).addDocuments([{ id: 1 }]);

      const tasks = await client.getTasks({
        indexUids: [index.uid, index2.uid],
      });
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid),
      );

      expect(onlyTaskWithSameUid.size).toEqual(2);
    });

    // get tasks: uid
    test(`${permission} key: Get all tasks with uid filter`, async () => {
      const client = await getClient(permission);
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const tasks = await client.getTasks({
        uids: [taskUid],
      });

      expect(tasks.results[0].uid).toEqual(taskUid);
    });

    // get tasks: beforeEnqueuedAt
    test(`${permission} key: Get all tasks with beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission);
      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      await sleep(1); // in ms

      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const tasks = await client.getTasks({
        beforeEnqueuedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: afterEnqueuedAt
    test(`${permission} key: Get all tasks with afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission);
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await sleep(1000); // in ms

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const tasks = await client.getTasks({
        afterEnqueuedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: beforeStartedAt
    test(`${permission} key: Get all tasks with beforeStartedAt filter`, async () => {
      const client = await getClient(permission);
      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      await sleep(1); // in ms

      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.index(index.uid).waitForTask(taskUid); // ensures the tasks has a `startedAt` value

      const tasks = await client.getTasks({
        beforeStartedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: afterStartedAt
    test(`${permission} key: Get all tasks with afterStartedAt filter`, async () => {
      const client = await getClient(permission);
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.index(index.uid).waitForTask(taskUid); // ensures the tasks has a `startedAt` value
      await sleep(1); // in ms

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const tasks = await client.getTasks({
        afterStartedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: beforeFinishedAt
    test(`${permission} key: Get all tasks with beforeFinishedAt filter`, async () => {
      const client = await getClient(permission);
      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      await sleep(1); // in ms

      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.index(index.uid).waitForTask(taskUid); // ensures the tasks has a `finishedAt` value

      const tasks = await client.getTasks({
        beforeFinishedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: afterFinishedAt
    test(`${permission} key: Get all tasks with afterFinishedAt filter`, async () => {
      const client = await getClient(permission);
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.index(index.uid).waitForTask(taskUid); // ensures the tasks has a `finishedAt` value
      await sleep(1); // in ms

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const tasks = await client.getTasks({
        afterFinishedAt: currentTime,
      });
      const tasksUids = tasks.results.map((t) => t.uid);

      expect(tasksUids.includes(taskUid)).toBeFalsy();
    });

    // get tasks: canceledBy
    test(`${permission} key: Get all tasks with canceledBy filter`, async () => {
      const client = await getClient(permission);
      const addDocumentsTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      // Cancel the task
      const enqueuedCancelationTask = await client.cancelTasks({
        uids: [addDocumentsTask.taskUid],
      });
      // wait for the task to be fully canceled
      const cancelationTask = await client.waitForTask(
        enqueuedCancelationTask.taskUid,
      );

      expect(cancelationTask.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(cancelationTask.details.originalFilter).toEqual(
        `?uids=${addDocumentsTask.taskUid}`,
      );
    });

    test(`${permission} key: Get all tasks in reverse order`, async () => {
      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const client = await getClient(permission);
      const taskA = await client.index(index.uid).addDocuments([{ id: 1 }]);
      const taskB = await client.index(index.uid).addDocuments([{ id: 2 }]);

      await client.waitForTask(taskA.taskUid);
      await client.waitForTask(taskB.taskUid);

      const tasks = await client.getTasks({ afterEnqueuedAt: currentTime });
      const reversedTasks = await client.getTasks({
        afterEnqueuedAt: currentTime,
        reverse: true,
      });
      expect(tasks.results.map((t) => t.uid)).toEqual([
        taskB.taskUid,
        taskA.taskUid,
      ]);
      expect(reversedTasks.results.map((t) => t.uid)).toEqual([
        taskA.taskUid,
        taskB.taskUid,
      ]);
    });

    // filters error code: INVALID_TASK_TYPES_FILTER
    test(`${permission} key: Try to filter on task types with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong argument type
        client.getTasks({ types: ["wrong"] }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_TYPES,
      );
    });

    // filters error code: INVALID_TASK_STATUSES_FILTER
    test(`${permission} key: Try to filter on statuses with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong argument type
        client.getTasks({ statuses: ["wrong"] }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_STATUSES,
      );
    });

    // filters error code: INVALID_TASK_UIDS_FILTER
    test(`${permission} key: Try to filter on uids with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong argument type
        client.getTasks({ uids: ["wrong"] }),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_TASK_UIDS);
    });

    // filters error code: INVALID_TASK_CANCELED_BY_FILTER
    test(`${permission} key: Try to filter on canceledBy filter with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong canceledBy type
        client.getTasks({ canceledBy: ["wrong"] }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_CANCELED_BY,
      );
    });

    // filters error code: INVALID_TASK_DATE_FILTER
    test(`${permission} key: Try to filter on dates with invalid date format`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong date format
        client.getTasks({ beforeEnqueuedAt: "wrong" }),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_BEFORE_ENQUEUED_AT,
      );
    });

    // cancel: uid
    test(`${permission} key: Cancel a task using the uid filter`, async () => {
      const client = await getClient(permission);
      const addDocuments = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const enqueuedTask = await client.cancelTasks({
        uids: [addDocuments.taskUid],
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("uids=");
      expect(task.details?.matchedTasks).toBeDefined();
      expect(task.details?.canceledTasks).toBeDefined();
    });

    // cancel: indexUid
    test(`${permission} key: Cancel a task using the indexUid filter`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.cancelTasks({
        indexUids: [index.uid],
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toEqual("?indexUids=movies_test");
    });

    // cancel: type
    test(`${permission} key: Cancel a task using the type filter`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.cancelTasks({
        types: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toEqual(
        "?types=documentAdditionOrUpdate%2CdocumentDeletion",
      );
    });

    // cancel: status
    test(`${permission} key: Cancel a task using the status filter`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.cancelTasks({
        statuses: [TaskStatus.TASK_ENQUEUED, TaskStatus.TASK_PROCESSING],
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toEqual(
        "?statuses=enqueued%2Cprocessing",
      );
    });

    // cancel: beforeEnqueuedAt
    test(`${permission} key: Cancel a task using beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        beforeEnqueuedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("beforeEnqueuedAt");
    });

    // cancel: afterEnqueuedAt
    test(`${permission} key: Cancel a task using afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        afterEnqueuedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("afterEnqueuedAt");
    });

    // cancel: beforeStartedAt
    test(`${permission} key: Cancel a task using beforeStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        beforeStartedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("beforeStartedAt");
    });

    // cancel: afterStartedAt
    test(`${permission} key: Cancel a task using afterStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        afterStartedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("afterStartedAt");
    });

    // cancel: beforeFinishedAt
    test(`${permission} key: Cancel a task using beforeFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        beforeFinishedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("beforeFinishedAt");
    });

    // cancel: afterFinishedAt
    test(`${permission} key: Cancel a task using afterFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.cancelTasks({
        afterFinishedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_CANCELATION);
      expect(task.details?.originalFilter).toContain("afterFinishedAt");
    });

    // cancel error code: MISSING_TASK_FILTER
    test(`${permission} key: Try to cancel without filters and fail`, async () => {
      const client = await getClient(permission);

      await expect(
        // @ts-expect-error testing wrong argument type
        client.cancelTasks(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_TASK_FILTERS,
      );
    });

    // delete: uid
    test(`${permission} key: Delete a task using the uid filter`, async () => {
      const client = await getClient(permission);
      const addDocuments = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const deleteTask = await client.deleteTasks({
        uids: [addDocuments.taskUid],
      });
      const task = await client.waitForTask(deleteTask.taskUid);

      expect(deleteTask.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.deletedTasks).toBeDefined();
      await expect(client.getTask(addDocuments.taskUid)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.TASK_NOT_FOUND,
      );
    });

    // delete: indexUid
    test(`${permission} key: Delete a task using the indexUid filter`, async () => {
      const client = await getClient(permission);
      const addDocuments = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const enqueuedTask = await client.deleteTasks({
        indexUids: [index.uid],
      });
      const deleteTask = await client.waitForTask(enqueuedTask.taskUid);

      expect(deleteTask.type).toEqual(TaskTypes.TASK_DELETION);
      await expect(client.getTask(addDocuments.taskUid)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.TASK_NOT_FOUND,
      );
    });

    // delete: type
    test(`${permission} key: Delete a task using the type filter`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.deleteTasks({
        types: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      });
      const deleteTask = await client.waitForTask(enqueuedTask.taskUid);

      expect(deleteTask.type).toEqual(TaskTypes.TASK_DELETION);
      expect(deleteTask.details?.originalFilter).toEqual(
        "?types=documentAdditionOrUpdate%2CdocumentDeletion",
      );
    });

    // delete: status
    test(`${permission} key: Delete a task using the status filter`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.deleteTasks({
        statuses: [TaskStatus.TASK_ENQUEUED, TaskStatus.TASK_PROCESSING],
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toEqual(
        "?statuses=enqueued%2Cprocessing",
      );
    });

    // delete: beforeEnqueuedAt
    test(`${permission} key: Delete a task using beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        beforeEnqueuedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("beforeEnqueuedAt");
    });

    // delete: afterEnqueuedAt
    test(`${permission} key: Delete a task using afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        afterEnqueuedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("afterEnqueuedAt");
    });

    // delete: beforeStartedAt
    test(`${permission} key: Delete a task using beforeStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        beforeStartedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("beforeStartedAt");
    });

    // delete: afterStartedAt
    test(`${permission} key: Delete a task using afterStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        afterStartedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("afterStartedAt");
    });

    // delete: beforeFinishedAt
    test(`${permission} key: Delete a task using beforeFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        beforeFinishedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("beforeFinishedAt");
    });

    // delete: afterFinishedAt
    test(`${permission} key: Delete a task using afterFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const enqueuedTask = await client.deleteTasks({
        afterFinishedAt: currentTime,
      });
      const task = await client.waitForTask(enqueuedTask.taskUid);

      expect(task.type).toEqual(TaskTypes.TASK_DELETION);
      expect(task.details?.originalFilter).toContain("afterFinishedAt");
    });

    test(`${permission} key: Get all indexes tasks with index instance`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.index(index2.uid).addDocuments([{ id: 1 }]);

      const tasks = await client.index(index.uid).getTasks();
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid),
      );

      expect(onlyTaskWithSameUid.size).toEqual(1);
    });

    test(`${permission} key: Try to get a task that does not exist`, async () => {
      const client = await getClient(permission);

      await expect(client.getTask(254500)).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.TASK_NOT_FOUND,
      );
    });
  },
);

describe.each([{ permission: "Search" }])("Test on tasks", ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config);
  });

  test(`${permission} key: Try to get a task and be denied`, async () => {
    const client = await getClient(permission);
    await expect(client.getTask(0)).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.INVALID_API_KEY,
    );
  });
});

describe.each([{ permission: "No" }])("Test on tasks", ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config);
  });

  test(`${permission} key: Try to get an task and be denied`, async () => {
    const client = await getClient(permission);
    await expect(client.getTask(0)).rejects.toHaveProperty(
      "cause.code",
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
    );
  });
});

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on task url construction", ({ host, trailing }) => {
  test(`on getTask route`, async () => {
    const route = `tasks/1`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(client.index(index.uid).getTask(1)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`on getTasks route`, async () => {
    const route = `tasks?indexUids=movies_test`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(client.index(index.uid).getTasks()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
