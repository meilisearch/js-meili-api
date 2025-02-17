import type { Settings } from "./types.js";
import type { CursorResults } from "./shared.js";
import type { MeiliSearchErrorResponse } from "./types.js";

/** Options for awaiting {@link EnqueuedTask}. */
export type WaitOptions = {
  /**
   * Milliseconds until timeout error will be thrown for each awaited task. A
   * value of less than `1` disables it.
   *
   * @defaultValue `5000`
   */
  timeout?: number;
  /**
   * Task polling interval in milliseconds. A value of less than `1` disables
   * it.
   *
   * @defaultValue `50`
   */
  interval?: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#status} */
export type TaskStatus =
  | "enqueued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#type} */
export type TaskType =
  | "documentAdditionOrUpdate"
  | "documentEdition"
  | "documentDeletion"
  | "settingsUpdate"
  | "indexCreation"
  | "indexDeletion"
  | "indexUpdate"
  | "indexSwap"
  | "taskCancelation"
  | "taskDeletion"
  | "dumpCreation"
  | "snapshotCreation";

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters}
 *
 * @see `meilisearch::routes::tasks::TasksFilterQuery` at {@link https://github.com/meilisearch/meilisearch}
 */
export type TasksOrBatchesQuery = {
  indexUids?: string[];
  uids?: number[];
  types?: TaskType[];
  statuses?: TaskStatus[];
  canceledBy?: number[];
  beforeEnqueuedAt?: string;
  afterEnqueuedAt?: string;
  beforeStartedAt?: string;
  afterStartedAt?: string;
  beforeFinishedAt?: string;
  afterFinishedAt?: string;
  limit?: number;
  from?: number;
  reverse?: boolean;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters-1}
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters-2}
 *
 * @see `meilisearch::routes::tasks::TaskDeletionOrCancelationQuery` at {@link https://github.com/meilisearch/meilisearch}
 */
export type DeleteOrCancelTasksQuery = Omit<
  TasksOrBatchesQuery,
  "limit" | "from"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#summarized-task-object}
 *
 * @see `meilisearch::routes::SummarizedTaskView` at {@link https://github.com/meilisearch/meilisearch}
 */
export type EnqueuedTask = {
  taskUid: number;
  indexUid: string | null;
  status: TaskStatus;
  type: TaskType;
  enqueuedAt: string;
};

/** Either a number or an {@link EnqueuedTask}. */
export type TaskUidOrEnqueuedTask = number | EnqueuedTask;

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#indexswap} */
export type IndexSwap = { indexes: [string, string] };

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#details} */
export type TaskDetails = Settings & {
  receivedDocuments?: number;
  indexedDocuments?: number;
  editedDocuments?: number;
  primaryKey?: string;
  providedIds?: number;
  deletedDocuments?: number;
  matchedTasks?: number;
  canceledTasks?: number;
  deletedTasks?: number;
  originalFilter?: string | null;
  dumpUid?: string | null;
  context?: Record<string, unknown> | null;
  function?: string;
  swaps?: IndexSwap[];
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#task-object}
 *
 * @see `meilisearch_types::task_view::TaskView` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Task = Omit<EnqueuedTask, "taskUid"> & {
  uid: number;
  batchUid: number | null;
  canceledBy: number | null;
  details?: TaskDetails;
  error: MeiliSearchErrorResponse | null;
  duration: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

/**
 * A {@link Promise} resolving to an {@link EnqueuedTask} with an extra function
 * that returns a Promise that resolves to a {@link Task}.
 */
export type EnqueuedTaskPromise = Promise<EnqueuedTask> & {
  /**
   * Function that, through polling, awaits the {@link EnqueuedTask} resolved by
   * {@link EnqueuedTaskPromise}.
   */
  waitTask: (waitOptions?: WaitOptions) => Promise<Task>;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#response}
 *
 * @see `meilisearch::routes::tasks::AllTasks` at {@link https://github.com/meilisearch/meilisearch}
 */
export type TasksResults = CursorResults<Task>;

/** {@link https://www.meilisearch.com/docs/reference/api/batches#steps} */
type BatchProgressStep = {
  currentStep: string;
  finished: number;
  total: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/batches#progress} */
type BatchProgress = {
  steps: BatchProgressStep[];
  percentage: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/batches#stats} */
type BatchStats = {
  totalNbTasks: number;
  status: Record<TaskStatus, number>;
  types: Record<TaskType, number>;
  indexUids: Record<string, number>;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#batch-object}
 *
 * @see `meilisearch_types::batch_view::BatchView` at {@link https://github.com/meilisearch/meilisearch}
 */
export type Batch = {
  uid: number;
  progress: BatchProgress | null;
  details: TaskDetails;
  stats: BatchStats;
  duration: string | null;
  startedAt: string;
  finishedAt: string | null;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#response}
 *
 * @see `meilisearch::routes::batches::AllBatches` at {@link https://github.com/meilisearch/meilisearch}
 */
export type BatchesResults = CursorResults<Batch>;
