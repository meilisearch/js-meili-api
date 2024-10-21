import { MeiliSearchTimeOutError } from "./errors";
import {
  Config,
  WaitOptions,
  TaskStatus,
  TasksQuery,
  TasksResults,
  TaskObject,
  CancelTasksQuery,
  TasksResultsObject,
  DeleteTasksQuery,
  EnqueuedTaskObject,
} from "./types";
import { HttpRequests } from "./http-requests";
import { sleep } from "./utils";
import { EnqueuedTask } from "./enqueued-task";

class Task {
  indexUid: TaskObject["indexUid"];
  status: TaskObject["status"];
  type: TaskObject["type"];
  uid: TaskObject["uid"];
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
    const taskItem = (await this.httpRequest.get({
      relativeURL: `tasks/${uid}`,
    })) as TaskObject;
    return new Task(taskItem);
  }

  /**
   * Get tasks
   *
   * @param params - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getTasks(params?: TasksQuery): Promise<TasksResults> {
    const tasks = (await this.httpRequest.get({
      relativeURL: "tasks",
      params,
    })) as TasksResultsObject;

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
   * @param params - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async cancelTasks(params?: CancelTasksQuery): Promise<EnqueuedTask> {
    const task = (await this.httpRequest.post({
      relativeURL: "tasks/cancel",
      params,
    })) as EnqueuedTaskObject;

    return new EnqueuedTask(task);
  }

  /**
   * Delete a list tasks.
   *
   * @param params - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async deleteTasks(params?: DeleteTasksQuery): Promise<EnqueuedTask> {
    const task = (await this.httpRequest.delete({
      relativeURL: "tasks",
      params,
    })) as EnqueuedTaskObject;
    return new EnqueuedTask(task);
  }
}

export { TaskClient, Task };
