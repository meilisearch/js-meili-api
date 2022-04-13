import { EnqueuedTask, ErrorStatusCode } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on displayed attributes',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
    })

    test(`${permission} key: Get default displayed attributes`, async () => {
      const client = await getClient(permission)

      const response = await client.index(index.uid).getDisplayedAttributes()
      expect(response).toEqual(['*'])
    })

    test(`${permission} key: Update displayed attributes`, async () => {
      const client = await getClient(permission)

      const newDisplayedAttribute = ['title']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDisplayedAttributes(newDisplayedAttribute)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getDisplayedAttributes()
      expect(response).toEqual(newDisplayedAttribute)
    })

    test(`${permission} key: Update displayed attributes at null`, async () => {
      const client = await getClient(permission)

      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDisplayedAttributes(null)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getDisplayedAttributes()
      expect(response).toEqual(['*'])
    })

    test(`${permission} key: Reset displayed attributes`, async () => {
      const client = await getClient(permission)

      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetDisplayedAttributes()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getDisplayedAttributes()
      expect(response).toEqual(['*'])
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on displayed attributes',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getDisplayedAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateDisplayedAttributes([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetDisplayedAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on displayed attributes',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getDisplayedAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateDisplayedAttributes([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset displayed attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetDisplayedAttributes()
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
  test(`Test getDisplayedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/displayed-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getDisplayedAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateDisplayedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/displayed-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateDisplayedAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetDisplayedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/displayed-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetDisplayedAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
