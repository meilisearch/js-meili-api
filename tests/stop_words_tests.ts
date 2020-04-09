import * as Types from '../src/types'
import {
  clearAllIndexes,
  sleep,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
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

beforeAll(async () => {
  await clearAllIndexes(config)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on stop words', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index)
    await masterClient.getIndex(index.uid).addDocuments(dataset)
    await sleep(500)
  })
  test(`${permission} key: Get default stop words`, async () => {
    await client
      .getIndex(index.uid)
      .getStopWords()
      .then((response: String[]) => {
        expect(response).toEqual([])
      })
  })
  test(`${permission} key: Update stop words`, async () => {
    const new_sw = ['the']
    await client
      .getIndex(index.uid)
      .updateStopWords(new_sw)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response.updateId
      })
    await sleep(500)
    await client
      .getIndex(index.uid)
      .getStopWords()
      .then((response: String[]) => {
        expect(response).toEqual(new_sw)
      })
  })
  test(`${permission} key: Reset stop words`, async () => {
    await client
      .getIndex(index.uid)
      .resetStopWords()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response.updateId
      })
    await sleep(500)
    await client
      .getIndex(index.uid)
      .getStopWords()
      .then((response: String[]) => {
        expect(response).toEqual([])
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getStopWords()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateStopWords([])
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetStopWords()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getStopWords()
      ).rejects.toThrowError(`Invalid API key: Need a token`)
    })
    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateStopWords([])
      ).rejects.toThrowError(`Invalid API key: Need a token`)
    })
    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetStopWords()
      ).rejects.toThrowError(`Invalid API key: Need a token`)
    })
  }
)
