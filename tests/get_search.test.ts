import { ErrorStatusCode } from '../src/types'
import { EnqueuedTask } from '../src/enqueued-task'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  HOST,
  getKey,
} from './utils/meilisearch-test-utils'

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
  { permission: 'Master' },
  { permission: 'Admin' },
  { permission: 'Search' },
])('Test on GET search', ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    const client = await getClient('Master')
    const { taskUid: task1 } = await client.createIndex(index.uid)
    await client.waitForTask(task1)
    const { taskUid: task2 } = await client.createIndex(emptyIndex.uid)
    await client.waitForTask(task2)

    const newFilterableAttributes = ['genre', 'title', 'id']
    const { taskUid: task3 }: EnqueuedTask = await client
      .index(index.uid)
      .updateSettings({
        filterableAttributes: newFilterableAttributes,
        sortableAttributes: ['id'],
      })
    await client.waitForTask(task3)

    const { taskUid: task4 } = await client
      .index(index.uid)
      .addDocuments(dataset)
    await client.waitForTask(task4)
  })

  test(`${permission} key: Basic search`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).searchGet('prince', {})

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with sortable`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('', { sort: ['id:asc'] })
    expect(response).toHaveProperty('hits', expect.any(Array))
    const hit = response.hits[0]
    expect(hit.id).toEqual(1)
  })

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToRetrieve: ['*'],
    })
    const hit = response.hits[0]

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('query', 'prince')
    expect(Object.keys(hit).join(',')).toEqual(
      Object.keys(dataset[1]).join(',')
    )
  })

  test(`${permission} key: search on attributesToSearchOn`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).searchGet('prince', {
      attributesToSearchOn: ['id'],
    })

    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search on attributesToSearchOn set to null`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).searchGet('prince', {
      attributesToSearchOn: null,
    })

    expect(response).toMatchSnapshot()
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with limit and offset`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      limit: 1,
      offset: 1,
    })
    expect(response).toHaveProperty('hits', [
      {
        id: 4,
        title: 'Harry Potter and the Half-Blood Prince',
        comment: 'The best book',
        genre: 'fantasy',
      },
    ])
    expect(response).toHaveProperty('offset', 1)
    expect(response).toHaveProperty('limit', 1)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      filter: 'title = "Le Petit Prince"',
      attributesToCrop: ['*'],
      cropLength: 5,
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits[0]).toHaveProperty('_matchesPosition', {
      comment: [{ start: 22, length: 6 }],
      title: [{ start: 9, length: 6 }],
    })
  })

  test(`${permission} key: search with all options but not all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['id', 'title'],
      attributesToCrop: ['*'],
      cropLength: 6,
      attributesToHighlight: ['*'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 5)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits[0]._formatted).toHaveProperty('title')
    expect(response.hits[0]._formatted).toHaveProperty('id')
    expect(response.hits[0]).not.toHaveProperty('comment')
    expect(response.hits[0]).not.toHaveProperty('description')
    expect(response.hits.length).toEqual(1)
    expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
    expect(response.hits[0]._formatted).toHaveProperty(
      'title',
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: search on default cropping parameters`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToCrop: ['*'],
      cropLength: 6,
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      '…book about a prince that walks…'
    )
  })

  test(`${permission} key: search on customized cropMarker`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToCrop: ['*'],
      cropLength: 6,
      cropMarker: '(ꈍᴗꈍ)',
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      '(ꈍᴗꈍ)book about a prince that walks(ꈍᴗꈍ)'
    )
  })

  test(`${permission} key: search on customized highlight tags`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToHighlight: ['*'],
      highlightPreTag: '(⊃｡•́‿•̀｡)⊃ ',
      highlightPostTag: ' ⊂(´• ω •`⊂)',
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      'A french book about a (⊃｡•́‿•̀｡)⊃ prince ⊂(´• ω •`⊂) that walks on little cute planets'
    )
  })

  test(`${permission} key: search with all options and all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['*'],
      attributesToCrop: ['*'],
      cropLength: 6,
      attributesToHighlight: ['*'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 5)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
    expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
    expect(response.hits[0]._formatted).toHaveProperty(
      'title',
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: search with all options but specific fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['id', 'title'],
      attributesToCrop: ['id', 'title'],
      cropLength: 6,
      attributesToHighlight: ['id', 'title'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 5)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
    expect(response.hits[0]).toHaveProperty('id', 456)
    expect(response.hits[0]).toHaveProperty('title', 'Le Petit Prince')
    expect(response.hits[0]).not.toHaveProperty('comment')
    expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
    expect(response.hits[0]).not.toHaveProperty(
      'description',
      expect.any(Object)
    )
    expect(response.hits[0]._formatted).toHaveProperty(
      'title',
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]._formatted).not.toHaveProperty('comment')
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: search with filter and facetDistribution`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'genre = romance',
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { romance: 2 },
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with filter on number`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'id < 0',
      facets: ['genre'],
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search with filter with spaces`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('h', {
      filter: 'genre = "sci fi"',
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with multiple filter`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'genre = romance AND (genre = romance OR genre = romance)',
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { romance: 2 },
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet(undefined, {
      filter: 'genre = fantasy',
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet(null, {
      filter: 'genre = fantasy',
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
    expect(response.estimatedTotalHits).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('', {
      filter: 'genre = fantasy',
      facets: ['genre'],
    })

    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: Try to search with wrong format filter`, async () => {
    const client = await getClient(permission)
    await expect(
      client.index(index.uid).searchGet('prince', {
        filter: ['hello'],
      })
    ).rejects.toHaveProperty(
      'message',
      'The filter query parameter should be in string format when using searchGet'
    )
  })
  test(`${permission} key: search with vectors`, async () => {
    const client = await getClient(permission)
    const adminClient = await getClient('Admin')
    const adminKey = await getKey('Admin')

    await fetch(`${HOST}/experimental-features`, {
      body: JSON.stringify({ vectorStore: true }),
      headers: {
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    const { taskUid } = await adminClient
      .index(emptyIndex.uid)
      .updateEmbedders({
        default: {
          source: 'userProvided',
          dimensions: 1,
        },
      })
    await adminClient.waitForTask(taskUid)

    const response = await client
      .index(emptyIndex.uid)
      .searchGet('', { vector: [1], hybridSemanticRatio: 1.0 })

    expect(response).toHaveProperty('hits')
    expect(response).toHaveProperty('semanticHitCount')
    // Those fields are no longer returned by the search response
    // We want to ensure that they don't appear in it anymore
    expect(response).not.toHaveProperty('vector')
    expect(response).not.toHaveProperty('_semanticScore')
  })

  test(`${permission} key: search without vectors`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {})

    expect(response).not.toHaveProperty('semanticHitCount')
  })

  test(`${permission} key: Try to search on deleted index and fail`, async () => {
    const client = await getClient(permission)
    const masterClient = await getClient('Master')
    const { taskUid } = await masterClient.index(index.uid).delete()
    await masterClient.waitForTask(taskUid)
    await expect(
      client.index(index.uid).searchGet('prince')
    ).rejects.toHaveProperty('code', ErrorStatusCode.INDEX_NOT_FOUND)
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test get search route`, async () => {
    const route = `indexes/${index.uid}/search`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
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
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
