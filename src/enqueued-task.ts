import type { EnqueuedTaskObject } from "./types/index.js";

class EnqueuedTask {
  taskUid: EnqueuedTaskObject["taskUid"];
  indexUid: EnqueuedTaskObject["indexUid"];
  status: EnqueuedTaskObject["status"];
  type: EnqueuedTaskObject["type"];
  enqueuedAt: Date;

  constructor(task: EnqueuedTaskObject) {
    this.taskUid = task.taskUid;
    this.indexUid = task.indexUid;
    this.status = task.status;
    this.type = task.type;
    this.enqueuedAt = new Date(task.enqueuedAt);
  }
}

export { EnqueuedTask };
