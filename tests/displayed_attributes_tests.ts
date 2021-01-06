import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  badHostClient,
  BAD_HOST,
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
])('Test on displayed attributes', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await client.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default displayed attributes`, async () => {
    await client
      .index(index.uid)
      .getDisplayedAttributes()
      .then((response: string[]) => {
        expect(response).toEqual(['*'])
      })
  })
  test(`${permission} key: Update displayed attributes`, async () => {
    const newDisplayedAttribute = ['title']
    const { updateId } = await client
      .index(index.uid)
      .updateDisplayedAttributes(newDisplayedAttribute)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getDisplayedAttributes()
      .then((response: string[]) => {
        expect(response).toEqual(newDisplayedAttribute)
      })
  })
  test(`${permission} key: Reset displayed attributes`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetDisplayedAttributes()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getDisplayedAttributes()
      .then((response: string[]) => {
        expect(response).toEqual(['*'])
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on displayed attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getDisplayedAttributes()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDisplayedAttributes([])
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDisplayedAttributes()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on displayed attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getDisplayedAttributes()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDisplayedAttributes([])
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset displayed attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDisplayedAttributes()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).getDisplayedAttributes()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient
      .index(index.uid)
      .updateDisplayedAttributes([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Reset request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).resetDisplayedAttributes()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/displayed-attributes/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
