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

const defaultRankingRules = [
  'typo',
  'words',
  'proximity',
  'attribute',
  'wordsPosition',
  'exactness',
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on ranking rules', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await client.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default ranking rules`, async () => {
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })
  test(`${permission} key: Update ranking rules`, async () => {
    const newRankingRules = ['asc(title)', 'typo', 'desc(description)']
    const { updateId } = await client
      .index(index.uid)
      .updateRankingRules(newRankingRules)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(newRankingRules)
      })
  })
  test(`${permission} key: Reset ranking rules`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetRankingRules()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).getRankingRules()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).updateRankingRules([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Reset request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).resetRankingRules()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/ranking-rules/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
