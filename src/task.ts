import { MeiliSearchTimeOutError } from "./errors/index.js";
import type {
  Config,
  WaitOptions,
  TasksQuery,
  TasksResults,
  TaskObject,
  CancelTasksQuery,
  TasksResultsObject,
  DeleteTasksQuery,
} from "./types/index.js";
import { TaskStatus } from "./types/index.js";
import { HttpRequests, toQueryParams } from "./http-requests.js";
import { sleep } from "./utils.js";
import { EnqueuedTask } from "./enqueued-task.js";

class Task {
  indexUid: TaskObject["indexUid"];
  status: TaskObject["status"];
  type: TaskObject["type"];
  uid: TaskObject["uid"];
  batchUid: TaskObject["batchUid"];
  canceledBy: TaskObject["canceledBy"];
  details: TaskObject["details"];
  error: TaskObject["error"];
  duration: TaskObject["duration"];
  startedAt: Date;
  enqueuedAt: Date;
  finishedAt: Date;

  constructor(task: TaskObject) {
    this.indexUid = task.indexUid;
    this.status = task.status;
    this.type = task.type;
    this.uid = task.uid;
    this.batchUid = task.batchUid;
    this.details = task.details;
    this.canceledBy = task.canceledBy;
    this.error = task.error;
    this.duration = task.duration;

    this.startedAt = new Date(task.startedAt);
    this.enqueuedAt = new Date(task.enqueuedAt);
    this.finishedAt = new Date(task.finishedAt);
  }
}

class TaskClient {
  httpRequest: HttpRequests;

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config);
  }

  /**
   * Get one task
   *
   * @param uid - Unique identifier of the task
   * @returns
   */
  async getTask(uid: number): Promise<Task> {
    const url = `tasks/${uid}`;
    const taskItem = await this.httpRequest.get<TaskObject>(url);
    return new Task(taskItem);
  }

  /**
   * Get tasks
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getTasks(parameters: TasksQuery = {}): Promise<TasksResults> {
    const url = `tasks`;

    const tasks = await this.httpRequest.get<Promise<TasksResultsObject>>(
      url,
      toQueryParams<TasksQuery>(parameters),
    );

    return {
      ...tasks,
      results: tasks.results.map((task) => new Task(task)),
    };
  }

  /**
   * Wait for a task to be processed.
   *
   * @param taskUid - Task identifier
   * @param options - Additional configuration options
   * @returns Promise returning a task after it has been processed
   */
  async waitForTask(
    taskUid: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {},
  ): Promise<Task> {
    const startingTime = Date.now();
    while (Date.now() - startingTime < timeOutMs) {
      const response = await this.getTask(taskUid);
      if (
        !(
          [
            TaskStatus.TASK_ENQUEUED,
            TaskStatus.TASK_PROCESSING,
          ] as readonly string[]
        ).includes(response.status)
      )
        return response;
      await sleep(intervalMs);
    }
    throw new MeiliSearchTimeOutError(
      `timeout of ${timeOutMs}ms has exceeded on process ${taskUid} when waiting a task to be resolved.`,
    );
  }

  /**
   * Waits for multiple tasks to be processed
   *
   * @param taskUids - Tasks identifier list
   * @param options - Wait options
   * @returns Promise returning a list of tasks after they have been processed
   */
  async waitForTasks(
    taskUids: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {},
  ): Promise<Task[]> {
    const tasks: Task[] = [];
    for (const taskUid of taskUids) {
      const task = await this.waitForTask(taskUid, {
        timeOutMs,
        intervalMs,
      });
      tasks.push(task);
    }
    return tasks;
  }

  /**
   * Cancel a list of enqueued or processing tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async cancelTasks(parameters: CancelTasksQuery = {}): Promise<EnqueuedTask> {
    const url = `tasks/cancel`;

    const task = await this.httpRequest.post(
      url,
      {},
      toQueryParams<CancelTasksQuery>(parameters),
    );

    return new EnqueuedTask(task);
  }

  /**
   * Delete a list tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async deleteTasks(parameters: DeleteTasksQuery = {}): Promise<EnqueuedTask> {
    const url = `tasks`;

    const task = await this.httpRequest.delete(
      url,
      {},
      toQueryParams<DeleteTasksQuery>(parameters),
    );
    return new EnqueuedTask(task);
  }
}

export { TaskClient, Task };
