import { EnqueuedUpdate, ErrorStatusCode } from '../src/types'
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
const emptyIndex = {
  uid: 'empty_test',
}

interface Movie {
  id: number
  title: string
  comment?: string
  genre?: string
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
    genre: 'sci fi',
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
    await masterClient.createIndex(index.uid)
    await masterClient.createIndex(emptyIndex.uid)
    const newFilterableAttributes = ['genre', 'title']
    const { updateId: settingUpdateId } = await masterClient
      .index<Movie>(index.uid)
      .updateFilterableAttributes(newFilterableAttributes)
      .then((response: EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await masterClient
      .index<Movie>(index.uid)
      .waitForPendingUpdate(settingUpdateId)
    const { updateId } = await masterClient
      .index<Movie>(index.uid)
      .addDocuments(dataset)
    await masterClient.index<Movie>(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Basic search`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {})
      .then((response) => {
        expect(response.hits.length === 2).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 20).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
      })
  })

  test(`${permission} key: Search with options`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', { limit: 1 })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 1).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
      })
  })

  test(`${permission} key: Search with limit and offset`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {
        limit: 1,
        offset: 1,
      })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 1).toBeTruthy()
        // expect(response.bloub).toEqual(0) -> ERROR, bloub does not exist on type Response
        expect(response.limit === 1).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
        expect(response.hits[0].id).toEqual(4)
        expect(response.hits[0].title).toEqual(
          'Harry Potter and the Half-Blood Prince'
        )
        expect(response.hits[0].comment).toEqual('The best book')
        expect(response.hits[0].genre).toEqual('fantasy')
        expect(response.query === 'prince').toBeTruthy()
      })
  })

  test(`${permission} key: Search with matches parameter and small croplength`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {
        filter: 'title = "Le Petit Prince"',
        attributesToCrop: ['*'],
        cropLength: 5,
        matches: true,
      })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 20).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
        expect(response.hits[0]?._matchesInfo?.comment).toEqual([
          { start: 22, length: 6 },
        ])
        expect(response.hits[0]?._matchesInfo?.title).toEqual([
          { start: 9, length: 6 },
        ])
      })
  })

  test(`${permission} key: Search with all options but not all fields`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 5).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
        expect(
          response.hits[0]?._formatted?.title === 'Petit <em>Prince</em>'
        ).toBeTruthy()
        expect(response.hits[0]._formatted?.id).toEqual(456)
        expect(response.hits[0]).not.toHaveProperty('comment')
        expect(response.hits[0]).not.toHaveProperty('description')
        expect(response.hits[0]._formatted).toHaveProperty('comment')
        expect(response.hits[0]._formatted).not.toHaveProperty('description')
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search with all options and all fields`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['*'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 5).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
        expect(response.hits[0]?.title === 'Le Petit Prince').toBeTruthy()
        expect(
          response.hits[0]?._matchesInfo?.title?.[0]?.start === 9
        ).toBeTruthy()
        expect(
          response.hits[0]?._matchesInfo?.title?.[0]?.length === 6
        ).toBeTruthy()
        expect(
          response.hits[0]?._formatted?.title === 'Petit <em>Prince</em>'
        ).toBeTruthy()
      })
  })

  test(`${permission} key: Search with all options but specific fields`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['id', 'title'],
        cropLength: 6,
        attributesToHighlight: ['id', 'title'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
        expect(response.hits.length === 1).toBeTruthy()
        expect(response.offset === 0).toBeTruthy()
        expect(response.limit === 5).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()

        expect(response.hits[0].id).toEqual(456)
        expect(response.hits[0].title).toEqual('Le Petit Prince')
        // ERROR Property 'comment' does not exist on type 'Hit<Pick<Movie, "id" | "title">>'.
        // expect(response.hits[0].comment).toEqual('comment')

        expect(response.hits[0]?.title === 'Le Petit Prince').toBeTruthy()
        expect(response.hits[0]?._matchesInfo?.title).toEqual([
          { start: 9, length: 6 },
        ])
        expect(
          response.hits[0]?._formatted?.title === 'Petit <em>Prince</em>'
        ).toBeTruthy()
        expect(response.hits[0]).not.toHaveProperty(
          'description',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).not.toHaveProperty('comment')
      })
  })

  test(`${permission} key: Search with filter and facetsDistribution`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('a', {
        filter: ['genre=romance'],
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response.facetsDistribution?.genre?.romance === 2).toBeTruthy()
        expect(response.exhaustiveFacetsCount === false).toBeTruthy()
        expect(response.hits.length === 2).toBeTruthy()
      })
  })

  test(`${permission} key: Search with filter with spaces`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('h', {
        filter: ['genre="sci fi"'],
      })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length === 1).toBeTruthy()
      })
  })

  test(`${permission} key: Search with multiple filter`, async () => {
    await client
      .index<Movie>(index.uid)
      .search('a', {
        filter: ['genre=romance', ['genre=romance', 'genre=romance']],
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response.facetsDistribution?.genre?.romance === 2).toBeTruthy()
        expect(response.exhaustiveFacetsCount === false).toBeTruthy()
        expect(response.hits.length === 2).toBeTruthy()
      })
  })

  test(`${permission} key: Search with multiple filter and placeholder search using undefined`, async () => {
    await client
      .index<Movie>(index.uid)
      .search(undefined, {
        filter: ['genre = fantasy'],
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response.facetsDistribution?.genre?.fantasy === 2).toBeTruthy()
        expect(response.exhaustiveFacetsCount === false).toBeTruthy()
        expect(response.hits.length === 2).toBeTruthy()
      })
  })

  test(`${permission} key: Search with multiple filter and placeholder search using NULL`, async () => {
    await client
      .index<Movie>(index.uid)
      .search(null, {
        filter: ['genre = fantasy'],
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response.facetsDistribution?.genre?.fantasy === 2).toBeTruthy()
        expect(response.exhaustiveFacetsCount === false).toBeTruthy()
        expect(response.hits.length === 2).toBeTruthy()
      })
  })

  test(`${permission} key: Search on index with no documents and no primary key`, async () => {
    await client
      .index(emptyIndex.uid)
      .search('prince', {})
      .then((response) => {
        expect(response.limit === 20).toBeTruthy()
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response.query === 'prince').toBeTruthy()
      })
  })

  test(`${permission} key: Try to Search on deleted index and fail`, async () => {
    await masterClient.index<Movie>(index.uid).delete()
    await expect(
      client.index<Movie>(index.uid).search('prince')
    ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INDEX_NOT_FOUND)
  })
})

describe.each([{ client: anonymousClient, permission: 'Client' }])(
  'Test failing test on search',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })
    test(`${permission} key: Try Basic search and be denied`, async () => {
      await expect(
        client.index<Movie>(index.uid).search('prince')
      ).rejects.toHaveProperty(
        'errorCode',
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
  test(`Test get search route`, async () => {
    const route = `indexes/${index.uid}/search`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index<Movie>(index.uid).search()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test post search route`, async () => {
    const route = `indexes/${index.uid}/search`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index<Movie>(index.uid).search()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
