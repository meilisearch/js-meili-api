import { ErrorStatusCode, EnqueuedTask } from '../src/types'
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

const defaultRankingRules = [
  'words',
  'typo',
  'proximity',
  'attribute',
  'sort',
  'exactness',
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on ranking rules',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('master')
      const { taskUid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get default ranking rules`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client.index(index.uid).getRankingRules()
      expect(response).toEqual(defaultRankingRules)
    })

    test(`${permission} key: Update ranking rules`, async () => {
      const client = await getClient(permission)
      const newRankingRules = ['title:asc', 'typo', 'description:desc']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateRankingRules(newRankingRules)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getRankingRules()

      expect(response).toEqual(newRankingRules)
    })

    test(`${permission} key: Update ranking rules at null`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateRankingRules(null)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getRankingRules()

      expect(response).toEqual(defaultRankingRules)
    })

    test(`${permission} key: Reset ranking rules`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetRankingRules()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getRankingRules()

      expect(response).toEqual(defaultRankingRules)
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on ranking rules',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on ranking rules',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateRankingRules([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
