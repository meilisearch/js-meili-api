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
])('Test on synonyms', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default synonyms`, async () => {
    await client
      .index(index.uid)
      .getSynonyms()
      .then((response: object) => {
        expect(response).toEqual({})
      })
  })
  test(`${permission} key: Update synonyms`, async () => {
    const newSynonyms = {
      hp: ['harry potter'],
    }
    const { updateId } = await client
      .index(index.uid)
      .updateSynonyms(newSynonyms)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getSynonyms()
      .then((response: object) => {
        expect(response).toEqual(newSynonyms)
      })
  })
  test(`${permission} key: Reset synonyms`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetSynonyms()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getSynonyms()
      .then((response: object) => {
        expect(response).toEqual({})
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on synonyms',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).getSynonyms()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSynonyms({})
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSynonyms()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on synonyms',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).getSynonyms()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSynonyms({})
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSynonyms()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).getSynonyms()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).updateSynonyms([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Reset request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).resetSynonyms()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/synonyms/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
