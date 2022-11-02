import { ErrorStatusCode, TaskTypes, TaskStatus } from '../src/types'
import { sleep } from '../src/utils'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

const index2 = {
  uid: 'movies_test2',
}

const index3 = {
  uid: 'movies_test2',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Tests on tasks',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { taskUid } = await client.createIndex(index.uid)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get one enqueued task`, async () => {
      const client = await getClient(permission)

      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)

      expect(enqueuedTask.taskUid).toBeDefined()
      expect(enqueuedTask.indexUid).toEqual(index.uid)
      expect(enqueuedTask.status).toBeDefined()
      expect(enqueuedTask.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
      expect(enqueuedTask.enqueuedAt).toBeDefined()
      expect(enqueuedTask.enqueuedAt).toBeInstanceOf(Date)
    })

    test(`${permission} key: Get one task`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(enqueuedTask.taskUid)

      const task = await client.getTask(enqueuedTask.taskUid)

      expect(task.indexUid).toEqual(index.uid)
      expect(task.status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(task.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
      expect(task.uid).toEqual(enqueuedTask.taskUid)
      expect(task).toHaveProperty('details')
      expect(task.details.indexedDocuments).toEqual(7)
      expect(task.details.receivedDocuments).toEqual(7)
      expect(task.duration).toBeDefined()
      expect(task.enqueuedAt).toBeDefined()
      expect(task.enqueuedAt).toBeInstanceOf(Date)
      expect(task.finishedAt).toBeDefined()
      expect(task.finishedAt).toBeInstanceOf(Date)
      expect(task.startedAt).toBeDefined()
      expect(task.startedAt).toBeInstanceOf(Date)
    })

    test(`${permission} key: Get one task with index instance`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(enqueuedTask.taskUid)

      const task = await client.index(index.uid).getTask(enqueuedTask.taskUid)

      expect(task.indexUid).toEqual(index.uid)
      expect(task.uid).toEqual(enqueuedTask.taskUid)
    })

    test(`${permission} key: Get all tasks`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await client.waitForTask(enqueuedTask.taskUid)

      const tasks = await client.getTasks()

      expect(tasks.results).toBeInstanceOf(Array)
      expect(tasks.results[0].uid).toEqual(enqueuedTask.taskUid)
    })

    test(`${permission} key: Get all tasks with type filter`, async () => {
      const client = await getClient(permission)
      await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.index(index.uid).deleteDocument(1)
      await client.createIndex(index2.uid)

      const tasks = await client.getTasks({
        type: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      })
      const onlyDocumentAddition = new Set(
        tasks.results.map((task) => task.type)
      )

      expect(onlyDocumentAddition.size).toEqual(2)
    })

    test(`${permission} key: Get all tasks with type filter on an index`, async () => {
      const client = await getClient(permission)
      await client.deleteIndex(index2.uid)
      await client.createIndex(index2.uid)
      await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.index(index2.uid).addDocuments([{ id: 1 }])
      await client.index(index2.uid).deleteDocument(1)

      const tasks = await client.index(index.uid).getTasks({
        type: [
          TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE,
          TaskTypes.DOCUMENT_DELETION,
        ],
      })
      const onlyDocumentAddition = new Set(
        tasks.results.map((task) => task.type)
      )

      expect(onlyDocumentAddition.size).toEqual(2)
    })

    test(`${permission} key: Get all tasks with pagination`, async () => {
      const client = await getClient(permission)
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }])
      const task2 = await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.waitForTask(task1.taskUid)
      await client.waitForTask(task2.taskUid)

      const tasks = await client.getTasks({ from: 1, limit: 1 })

      expect(tasks.results.length).toEqual(1)
      expect(tasks.from).toEqual(1)
      expect(tasks.limit).toEqual(1)
      expect(tasks.next).toEqual(0)
    })

    test(`${permission} key: Get all tasks with status filter`, async () => {
      const client = await getClient(permission)
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }])
      const task2 = await client.index(index.uid).addDocuments([{}])
      await client.waitForTask(task1.taskUid)
      await client.waitForTask(task2.taskUid)

      const tasks = await client.getTasks({
        status: [TaskStatus.TASK_SUCCEEDED, TaskStatus.TASK_FAILED],
      })
      const onlySuccesfullTasks = new Set(
        tasks.results.map((task) => task.status)
      )

      expect(onlySuccesfullTasks.size).toEqual(2)
    })

    test(`${permission} key: Get all tasks with status filter on an index`, async () => {
      const client = await getClient(permission)
      const task1 = await client.index(index.uid).addDocuments([{ id: 1 }])
      const task2 = await client.index(index.uid).addDocuments([{}])
      const task3 = await client.index(index2.uid).addDocuments([{}])
      await client.waitForTask(task1.taskUid)
      await client.waitForTask(task2.taskUid)
      await client.waitForTask(task3.taskUid)

      const tasks = await client.index(index.uid).getTasks({
        status: [TaskStatus.TASK_SUCCEEDED, TaskStatus.TASK_FAILED],
      })
      const onlySuccesfullTasks = new Set(
        tasks.results.map((task) => task.status)
      )
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid)
      )

      expect(onlySuccesfullTasks.size).toEqual(2)
      expect(onlyTaskWithSameUid.size).toEqual(1)
    })

    test(`${permission} key: Get all tasks with indexUid filter`, async () => {
      const client = await getClient(permission)
      await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.index(index2.uid).addDocuments([{ id: 1 }])
      await client.index(index3.uid).addDocuments([{ id: 1 }])

      const tasks = await client.getTasks({
        indexUid: [index.uid, index2.uid],
      })
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid)
      )

      expect(onlyTaskWithSameUid.size).toEqual(2)
    })

    // uid
    test(`${permission} key: Get all tasks with indexUid filter`, async () => {
      const client = await getClient(permission)
      await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.index(index2.uid).addDocuments([{ id: 1 }])
      await client.index(index3.uid).addDocuments([{ id: 1 }])

      const tasks = await client.getTasks({
        indexUid: [index.uid, index2.uid],
      })
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid)
      )

      expect(onlyTaskWithSameUid.size).toEqual(2)
    })

    // beforeEnqueuedAt
    test.only(`${permission} key: Get all tasks with beforeEnqueuedAt filter`, async () => {
      const client = await getClient(permission)
      const currentTimeStamp = Date.now()
      const currentTime = new Date(currentTimeStamp)
      await sleep(1) // in ms

      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])

      const tasks = await client.getTasks({
        beforeEnqueuedAt: currentTime,
      })
      const tasksUids = tasks.results.map((t) => t.uid)

      expect(tasksUids.includes(taskUid)).toBeFalsy()
    })

    // afterEnqueuedAt
    test.only(`${permission} key: Get all tasks with afterEnqueuedAt filter`, async () => {
      const client = await getClient(permission)
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await sleep(1) // in ms

      const currentTimeStamp = Date.now()
      const currentTime = new Date(currentTimeStamp)

      const tasks = await client.getTasks({
        afterEnqueuedAt: currentTime,
      })
      const tasksUids = tasks.results.map((t) => t.uid)

      expect(tasksUids.includes(taskUid)).toBeFalsy()
    })

    // beforeStartedAt
    test.only(`${permission} key: Get all tasks with beforeStartedAt filter`, async () => {
      const client = await getClient(permission)
      const currentTimeStamp = Date.now()
      const currentTime = new Date(currentTimeStamp)
      await sleep(1) // in ms

      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])

      await client.index(index.uid).waitForTask(taskUid) // ensures the tasks has a `startedAt` value

      const tasks = await client.getTasks({
        beforeStartedAt: currentTime,
      })
      const tasksUids = tasks.results.map((t) => t.uid)

      expect(tasksUids.includes(taskUid)).toBeFalsy()
    })

    // afterStartedAt
    test.only(`${permission} key: Get all tasks with afterStartedAt filter`, async () => {
      const client = await getClient(permission)
      const { taskUid } = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await client.index(index.uid).waitForTask(taskUid) // ensures the tasks has a `startedAt` value
      await sleep(1) // in ms

      const currentTimeStamp = Date.now()
      const currentTime = new Date(currentTimeStamp)

      const tasks = await client.getTasks({
        afterStartedAt: currentTime,
      })
      const tasksUids = tasks.results.map((t) => t.uid)

      expect(tasksUids.includes(taskUid)).toBeFalsy()
    })

    test(`${permission} key: Get all indexes tasks with index instance`, async () => {
      const client = await getClient(permission)
      await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.index(index2.uid).addDocuments([{ id: 1 }])

      const tasks = await client.index(index.uid).getTasks()
      const onlyTaskWithSameUid = new Set(
        tasks.results.map((task) => task.indexUid)
      )

      expect(onlyTaskWithSameUid.size).toEqual(1)
    })

    test(`${permission} key: Try to get a task that does not exist`, async () => {
      const client = await getClient(permission)

      await expect(client.getTask(254500)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.TASK_NOT_FOUND
      )
    })
  }
)

describe.each([{ permission: 'Search' }])('Test on tasks', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: Try to get a task and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.getTask(0)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INVALID_API_KEY
    )
  })
})

describe.each([{ permission: 'No' }])('Test on tasks', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: Try to get an task and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.getTask(0)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on task url construction', ({ host, trailing }) => {
  test(`Test on getTask route`, async () => {
    const route = `tasks/1`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host

    await expect(client.index(index.uid).getTask(1)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test on getTasks route`, async () => {
    const route = `tasks?indexUid=movies_test`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host

    await expect(client.index(index.uid).getTasks()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
