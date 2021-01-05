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
])('Test on stop words', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default stop words`, async () => {
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual([])
      })
  })
  test(`${permission} key: Update stop words`, async () => {
    const newStopWords = ['the']
    const { updateId } = await client
      .index(index.uid)
      .updateStopWords(newStopWords)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual(newStopWords)
      })
  })
  test(`${permission} key: Reset stop words`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetStopWords()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual([])
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).resetStopWords()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).resetStopWords()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).getStopWords()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).updateStopWords([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Reset request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).resetStopWords()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/stop-words/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
