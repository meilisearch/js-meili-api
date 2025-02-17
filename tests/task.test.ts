import { afterAll, assert, beforeEach, describe, expect, test } from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import { sleep } from "../src/utils.js";
import {
  BAD_HOST,
  clearAllIndexes,
  config,
  dataset,
  getClient,
  MeiliSearch,
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
      await client.createIndex(index.uid).waitTask();
    });

    test(`${permission} key: Get one enqueued task`, async () => {
      const client = await getClient(permission);

      const enqueuedTask = await client.index(index.uid).addDocuments(dataset);

      expect(enqueuedTask.taskUid).toBeDefined();
      expect(enqueuedTask.indexUid).toEqual(index.uid);
      expect(enqueuedTask.status).toBeDefined();
      assert.strictEqual(enqueuedTask.type, "documentAdditionOrUpdate");
      expect(enqueuedTask.enqueuedAt).toBeDefined();
      expect(enqueuedTask.enqueuedAt).toBeTypeOf("string");
    });

    test(`${permission} key: Get one task`, async () => {
      const client = await getClient(permission);
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset);
      await client.tasks.waitForTask(enqueuedTask.taskUid);

      const task = await client.tasks.getTask(enqueuedTask.taskUid);

      expect(task.indexUid).toEqual(index.uid);
      expect(task.batchUid).toBeDefined();
      assert.strictEqual(task.status, "succeeded");
      assert.strictEqual(task.type, "documentAdditionOrUpdate");
      expect(task.uid).toEqual(enqueuedTask.taskUid);
      expect(task).toHaveProperty("details");
      expect(task.details?.indexedDocuments).toEqual(7);
      expect(task.details?.receivedDocuments).toEqual(7);
      expect(task.duration).toBeDefined();
      expect(task.enqueuedAt).toBeDefined();
      expect(task.enqueuedAt).toBeTypeOf("string");
      expect(task.finishedAt).toBeDefined();
      expect(task.finishedAt).toBeTypeOf("string");
      expect(task.startedAt).toBeDefined();
      expect(task.startedAt).toBeTypeOf("string");
      expect(task.error).toBeNull();
    });

    // get tasks
    test(`${permission} key: Get all tasks`, async () => {
      const client = await getClient(permission);
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);
      await client.tasks.waitForTask(enqueuedTask.taskUid);

      const tasks = await client.tasks.getTasks();

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

      const tasks = await client.tasks.getTasks({
        types: ["documentAdditionOrUpdate", "documentDeletion"],
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
      await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
        .waitTask();
      await client.tasks.waitForTask(task1.taskUid);

      const tasks = await client.tasks.getTasks({
        from: task1.taskUid,
        limit: 1,
      });

      expect(tasks.results.length).toEqual(1);
      expect(tasks.from).toEqual(task1.taskUid);
      expect(tasks.limit).toEqual(1);
      expect(tasks.next).toEqual(task1.taskUid - 1);
    });

    // get tasks: status
    test(`${permission} key: Get all tasks with status filter`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
        .waitTask();
      await client.index(index.uid).addDocuments([{}]).waitTask();

      const tasks = await client.tasks.getTasks({
        statuses: ["succeeded", "failed"],
      });
      const onlySuccesfullTasks = new Set(
        tasks.results.map((task) => task.status),
      );

      expect(onlySuccesfullTasks.size).toEqual(2);
    });

    // get tasks: indexUid
    test(`${permission} key: Get all tasks with indexUid filter`, async () => {
      const client = await getClient(permission);
      await client.index(index.uid).addDocuments([{ id: 1 }]);
      await client.index(index2.uid).addDocuments([{ id: 1 }]);
      await client.index(index3.uid).addDocuments([{ id: 1 }]);

      const tasks = await client.tasks.getTasks({
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

      const tasks = await client.tasks.getTasks({
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

      const tasks = await client.tasks.getTasks({
        beforeEnqueuedAt: currentTime.toISOString(),
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

      const tasks = await client.tasks.getTasks({
        afterEnqueuedAt: currentTime.toISOString(),
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
      await client.tasks.waitForTask(taskUid); // ensures the tasks has a `startedAt` value

      const tasks = await client.tasks.getTasks({
        beforeStartedAt: currentTime.toISOString(),
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
      await client.tasks.waitForTask(taskUid); // ensures the tasks has a `startedAt` value
      await sleep(1); // in ms

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const tasks = await client.tasks.getTasks({
        afterStartedAt: currentTime.toISOString(),
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
      await client.tasks.waitForTask(taskUid); // ensures the tasks has a `finishedAt` value

      const tasks = await client.tasks.getTasks({
        beforeFinishedAt: currentTime.toISOString(),
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
      await client.tasks.waitForTask(taskUid); // ensures the tasks has a `finishedAt` value
      await sleep(1); // in ms

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const tasks = await client.tasks.getTasks({
        afterFinishedAt: currentTime.toISOString(),
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
      const cancelationTask = await client.tasks
        .cancelTasks({ uids: [addDocumentsTask.taskUid] })
        .waitTask();

      assert.strictEqual(cancelationTask.type, "taskCancelation");
      expect(cancelationTask.details?.originalFilter).toEqual(
        `?uids=${addDocumentsTask.taskUid}`,
      );
    });

    test(`${permission} key: Get all tasks in reverse order`, async () => {
      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);

      const client = await getClient(permission);
      const taskA = await client.index(index.uid).addDocuments([{ id: 1 }]);
      const taskB = await client.index(index.uid).addDocuments([{ id: 2 }]);

      await client.tasks.waitForTask(taskA.taskUid);
      await client.tasks.waitForTask(taskB.taskUid);

      const tasks = await client.tasks.getTasks({
        afterEnqueuedAt: currentTime.toISOString(),
      });
      const reversedTasks = await client.tasks.getTasks({
        afterEnqueuedAt: currentTime.toISOString(),
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
        client.tasks.getTasks(
          // @ts-expect-error testing wrong argument type
          { types: ["wrong"] },
        ),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_TYPES,
      );
    });

    // filters error code: INVALID_TASK_STATUSES_FILTER
    test(`${permission} key: Try to filter on statuses with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.getTasks(
          // @ts-expect-error testing wrong argument type
          { statuses: ["wrong"] },
        ),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_STATUSES,
      );
    });

    // filters error code: INVALID_TASK_UIDS_FILTER
    test(`${permission} key: Try to filter on uids with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.getTasks(
          // @ts-expect-error testing wrong argument type
          { uids: ["wrong"] },
        ),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_TASK_UIDS);
    });

    // filters error code: INVALID_TASK_CANCELED_BY_FILTER
    test(`${permission} key: Try to filter on canceledBy filter with wrong type`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.getTasks(
          // @ts-expect-error testing wrong canceledBy type
          { canceledBy: ["wrong"] },
        ),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_TASK_CANCELED_BY,
      );
    });

    // filters error code: INVALID_TASK_DATE_FILTER
    test(`${permission} key: Try to filter on dates with invalid date format`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.getTasks({ beforeEnqueuedAt: "wrong" }),
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

      const task = await client.tasks
        .cancelTasks({ uids: [addDocuments.taskUid] })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("uids=");
      expect(task.details?.matchedTasks).toBeDefined();
      expect(task.details?.canceledTasks).toBeDefined();
    });

    // cancel: indexUid
    test(`${permission} key: Cancel a task using the indexUid filter`, async () => {
      const client = await getClient(permission);

      const task = await client.tasks
        .cancelTasks({ indexUids: [index.uid] })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toEqual("?indexUids=movies_test");
    });

    // cancel: type
    test(`${permission} key: Cancel a task using the type filter`, async () => {
      const client = await getClient(permission);

      const task = await client.tasks
        .cancelTasks({
          types: ["documentAdditionOrUpdate", "documentDeletion"],
        })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toEqual(
        "?types=documentAdditionOrUpdate%2CdocumentDeletion",
      );
    });

    // cancel: status
    test(`${permission} key: Cancel a task using the status filter`, async () => {
      const client = await getClient(permission);

      const task = await client.tasks
        .cancelTasks({ statuses: ["enqueued", "processing"] })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toEqual(
        "?statuses=enqueued%2Cprocessing",
      );
    });

    // cancel: beforeEnqueuedAt
    test(`${permission} key: Cancel a task using beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ beforeEnqueuedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("beforeEnqueuedAt");
    });

    // cancel: afterEnqueuedAt
    test(`${permission} key: Cancel a task using afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ afterEnqueuedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("afterEnqueuedAt");
    });

    // cancel: beforeStartedAt
    test(`${permission} key: Cancel a task using beforeStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ beforeStartedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("beforeStartedAt");
    });

    // cancel: afterStartedAt
    test(`${permission} key: Cancel a task using afterStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ afterStartedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("afterStartedAt");
    });

    // cancel: beforeFinishedAt
    test(`${permission} key: Cancel a task using beforeFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ beforeFinishedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("beforeFinishedAt");
    });

    // cancel: afterFinishedAt
    test(`${permission} key: Cancel a task using afterFinishedAt filter with no timeout`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .cancelTasks({ afterFinishedAt: currentTime.toISOString() })
        .waitTask({ timeout: 0 });

      assert.strictEqual(task.type, "taskCancelation");
      expect(task.details?.originalFilter).toContain("afterFinishedAt");
    });

    // delete: uid
    test(`${permission} key: Delete a task using the uid filter`, async () => {
      const client = await getClient(permission);
      const addDocuments = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const task = await client.tasks
        .deleteTasks({ uids: [addDocuments.taskUid] })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.deletedTasks).toBeDefined();
      await expect(
        client.tasks.getTask(addDocuments.taskUid),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.TASK_NOT_FOUND);
    });

    // delete: indexUid
    test(`${permission} key: Delete a task using the indexUid filter`, async () => {
      const client = await getClient(permission);
      const addDocuments = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }]);

      const deleteTask = await client.tasks
        .deleteTasks({ indexUids: [index.uid] })
        .waitTask();

      assert.strictEqual(deleteTask.type, "taskDeletion");
      await expect(
        client.tasks.getTask(addDocuments.taskUid),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.TASK_NOT_FOUND);
    });

    // delete: type
    test(`${permission} key: Delete a task using the type filter`, async () => {
      const client = await getClient(permission);

      const deleteTask = await client.tasks
        .deleteTasks({
          types: ["documentAdditionOrUpdate", "documentDeletion"],
        })
        .waitTask();

      assert.strictEqual(deleteTask.type, "taskDeletion");
      expect(deleteTask.details?.originalFilter).toEqual(
        "?types=documentAdditionOrUpdate%2CdocumentDeletion",
      );
    });

    // delete: status
    test(`${permission} key: Delete a task using the status filter`, async () => {
      const client = await getClient(permission);

      const task = await client.tasks
        .deleteTasks({ statuses: ["enqueued", "processing"] })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toEqual(
        "?statuses=enqueued%2Cprocessing",
      );
    });

    // delete: beforeEnqueuedAt
    test(`${permission} key: Delete a task using beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ beforeEnqueuedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("beforeEnqueuedAt");
    });

    // delete: afterEnqueuedAt
    test(`${permission} key: Delete a task using afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ afterEnqueuedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("afterEnqueuedAt");
    });

    // delete: beforeStartedAt
    test(`${permission} key: Delete a task using beforeStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ beforeStartedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("beforeStartedAt");
    });

    // delete: afterStartedAt
    test(`${permission} key: Delete a task using afterStartedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ afterStartedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("afterStartedAt");
    });

    // delete: beforeFinishedAt
    test(`${permission} key: Delete a task using beforeFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ beforeFinishedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("beforeFinishedAt");
    });

    // delete: afterFinishedAt
    test(`${permission} key: Delete a task using afterFinishedAt filter`, async () => {
      const client = await getClient(permission);

      const currentTimeStamp = Date.now();
      const currentTime = new Date(currentTimeStamp);
      const task = await client.tasks
        .deleteTasks({ afterFinishedAt: currentTime.toISOString() })
        .waitTask();

      assert.strictEqual(task.type, "taskDeletion");
      expect(task.details?.originalFilter).toContain("afterFinishedAt");
    });

    test(`${permission} key: Try to get a task that does not exist`, async () => {
      const client = await getClient(permission);

      await expect(client.tasks.getTask(254500)).rejects.toHaveProperty(
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
    await expect(client.tasks.getTask(0)).rejects.toHaveProperty(
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
    await expect(client.tasks.getTask(0)).rejects.toHaveProperty(
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

    await expect(client.tasks.getTask(1)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`on getTasks route`, async () => {
    const route = `tasks?indexUids=movies_test`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;

    await expect(
      client.tasks.getTasks({ indexUids: ["movies_test"] }),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
