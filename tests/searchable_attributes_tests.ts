import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  BAD_HOST,
  MeiliSearch,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  { id: 456, title: 'Le Petit Prince', comment: 'A french book' },
  { id: 2, title: 'Le Rouge et le Noir', comment: 'Another french book' },
  { id: 1, title: 'Alice In Wonderland', comment: 'A weird book' },
  { id: 1344, title: 'The Hobbit', comment: 'An awesome book' },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on searchable attributes', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default searchable attributes`, async () => {
    const response: string[] = await client
      .index(index.uid)
      .getSearchableAttributes()
    expect(response).toEqual(['*'])
  })

  test(`${permission} key: Update searchable attributes`, async () => {
    const newSearchableAttributes = ['title']
    const attributes: EnqueuedTask = await client
      .index(index.uid)
      .updateSearchableAttributes(newSearchableAttributes)
    expect(attributes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attributes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getSearchableAttributes()
    expect(response).toEqual(newSearchableAttributes)
  })

  test(`${permission} key: Update searchable attributes at null`, async () => {
    const attributes: EnqueuedTask = await client
      .index(index.uid)
      .updateSearchableAttributes(null)
    expect(attributes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attributes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getSearchableAttributes()
    expect(response).toEqual(['*'])
  })

  test(`${permission} key: Reset searchable attributes`, async () => {
    const attributes: EnqueuedTask = await client
      .index(index.uid)
      .resetSearchableAttributes()
    expect(attributes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attributes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getSearchableAttributes()
    expect(response).toEqual(['*'])
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on searchable attributes',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getSearchableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSearchableAttributes([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSearchableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on searchable attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getSearchableAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSearchableAttributes([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSearchableAttributes()
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
  test(`Test getSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getSearchableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSearchableAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSearchableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
