import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}
const emptyIndex = {
  uid: 'empty_test',
}

const dataset = [
  {
    id: 123,
    title: 'Pride and Prejudice',
    comment: 'A great book',
    genre: 'romance',
  },
  {
    id: 456,
    title: 'Le Petit Prince',
    comment: 'A french book about a prince that walks on little cute planets',
    genre: 'adventure',
  },
  {
    id: 2,
    title: 'Le Rouge et le Noir',
    comment: 'Another french book',
    genre: 'romance',
  },
  {
    id: 1,
    title: 'Alice In Wonderland',
    comment: 'A weird book',
    genre: 'adventure',
  },
  {
    id: 1344,
    title: 'The Hobbit',
    comment: 'An awesome book',
    genre: 'adventure',
  },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
    genre: 'fantasy',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy", genre: 'fantasy' },
]

jest.setTimeout(100 * 1000)

beforeAll(async () => {
  await clearAllIndexes(config)
  await masterClient.createIndex(index)
  const new_attributes_for_faceting = ['genre']
  const { updateId: settingUpdateId } = await masterClient
    .getIndex(index.uid)
    .updateAttributesForFaceting(new_attributes_for_faceting)
    .then((response: Types.EnqueuedUpdate) => {
      expect(response).toHaveProperty('updateId', expect.any(Number))
      return response
    })
  const { updateId } = await masterClient
    .getIndex(index.uid)
    .addDocuments(dataset)
  await masterClient.getIndex(index.uid).waitForPendingUpdate(updateId)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
])('Test on search', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index)
    await masterClient.createIndex(emptyIndex)
    const new_attributes_for_faceting = ['genre']
    const { updateId: settingUpdateId } = await masterClient
      .getIndex(index.uid)
      .updateAttributesForFaceting(new_attributes_for_faceting)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await masterClient.getIndex(index.uid).waitForPendingUpdate(settingUpdateId)
    const { updateId } = await masterClient
      .getIndex(index.uid)
      .addDocuments(dataset)
    await masterClient.getIndex(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Basic search`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince')
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: Search with options`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', { limit: 1 })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: Search with options`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', { limit: 1 })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })
  test(`${permission} key: Search with limit and offset`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 1,
        offset: 1,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', [
          {
            id: 4,
            title: 'Harry Potter and the Half-Blood Prince',
            comment: 'The best book',
          },
        ])
        expect(response).toHaveProperty('offset', 1)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: Search with matches parameter and small croplength`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        filters: 'title = "Le Petit Prince"',
        attributesToCrop: '*',
        cropLength: 5,
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty('_matchesInfo', {
          comment: [{ start: 3, length: 6 }],
          title: [{ start: 1, length: 6 }],
        })
      })
  })

  test(`${permission} key: Search with all options but not all fields`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: '*',
        cropLength: 6,
        attributesToHighlight: '*',
        filters: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits[0]._formatted).toHaveProperty('title')
        expect(response.hits[0]._formatted).toHaveProperty('id')
        expect(response.hits[0]).not.toHaveProperty('comment')
        expect(response.hits[0]).not.toHaveProperty('description')
        expect(response.hits[0]._formatted).not.toHaveProperty('comment')
        expect(response.hits[0]._formatted).not.toHaveProperty('description')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty(
          '_formatted',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).toHaveProperty(
          'title',
          'Petit <em>Prince</em>'
        )
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search with all options and all fields`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: '*',
        attributesToCrop: '*',
        cropLength: 6,
        attributesToHighlight: '*',
        filters: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty(
          '_formatted',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).toHaveProperty(
          'title',
          'Petit <em>Prince</em>'
        )
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search with all options but specific fields`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['id', 'title'],
        cropLength: 6,
        attributesToHighlight: ['id', 'title'],
        filters: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty('id', 456)
        expect(response.hits[0]).toHaveProperty('title', 'Le Petit Prince')
        expect(response.hits[0]).not.toHaveProperty('comment')
        expect(response.hits[0]).toHaveProperty(
          '_formatted',
          expect.any(Object)
        )
        expect(response.hits[0]).not.toHaveProperty(
          'description',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).toHaveProperty(
          'title',
          'Petit <em>Prince</em>'
        )
        expect(response.hits[0]._formatted).not.toHaveProperty('comment')
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search with facetFilters and facetDistribution`, async () => {
    await client
      .getIndex(index.uid)
      .search('a', {
        facetFilters: ['genre:romance'],
        facetsDistribution: ['genre'],
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { adventure: 0, fantasy: 0, romance: 2 },
  })
        expect(response).toHaveProperty('exhaustiveFacetsCount', true)
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length).toEqual(2)
      })
  })
})

describe.each([{ client: anonymousClient, permission: 'Client' }])(
  'Test failing test on search',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: Try Basic search and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).search('prince')
      ).rejects.toThrowError(`Invalid API key: Need a token`)
    })
  }
)
