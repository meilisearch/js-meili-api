import { IndexResponse, ErrorStatusCode } from '../src/types'
import { Index } from '../src/'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  badHostClient,
  BAD_HOST,
  MeiliSearch,
} from './meilisearch-test-utils'

const indexNoPk = {
  uid: 'movies_test',
}
const indexPk = {
  uid: 'movies_test2',
  primaryKey: 'id',
}

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on indexes w/ master and private key', ({ client, permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })
  test.only(`${permission} key: create with no primary key`, async () => {
    const newIndex = await client.createIndex(indexNoPk.uid)
    expect(newIndex).toHaveProperty('uid', indexNoPk.uid)
    expect(newIndex).toHaveProperty('primaryKey', null)

    const rawIndex: IndexResponse = await client
      .index(indexNoPk.uid)
      .getRawInfo()
    expect(rawIndex).toHaveProperty('uid', indexNoPk.uid)
    expect(rawIndex).toHaveProperty('primaryKey', null)
    expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
    expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))

    const response = await client.index(indexNoPk.uid).fetchInfo()
    expect(response.primaryKey).toBe(null)
    expect(response.uid).toBe(indexNoPk.uid)
  })

  test(`${permission} key: create with primary key`, async () => {
    const newIndex = await client.createIndex(indexPk.uid)
    expect(newIndex).toHaveProperty('uid', indexPk.uid)
    expect(newIndex).toHaveProperty('primaryKey', null)

    const rawIndex: IndexResponse = await client.index(indexPk.uid).getRawInfo()
    expect(rawIndex).toHaveProperty('uid', indexPk.uid)
    expect(rawIndex).toHaveProperty('primaryKey', null)
    expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
    expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))

    const response = await client.index(indexPk.uid).fetchInfo()
    expect(response.primaryKey).toBe(null)
    expect(response.uid).toBe(indexPk.uid)
  })

  test(`${permission} key: Get index that exists`, async () => {
    await client.createIndex(indexPk.uid)
    const response = await client.index(indexPk.uid).getRawInfo()
    expect(response).toHaveProperty('uid', indexPk.uid)
  })

  test(`${permission} key: Get raw index that exists`, async () => {
    await client.createIndex(indexPk.uid)
    const response = await client.getRawIndex(indexPk.uid)
    expect(response).toHaveProperty('uid', indexPk.uid)
  })

  test(`${permission} key: Get index that does not exist`, async () => {
    await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: Get raw index that does not exist`, async () => {
    await expect(client.getRawIndex('does_not_exist')).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: Get index info with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    const response: IndexResponse = await index.getRawInfo()
    expect(response).toHaveProperty('uid', indexPk.uid)
    expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
  })

  test(`${permission} key: Get raw index info with primary key`, async () => {
    await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    const response = await client.getRawIndex(indexPk.uid)
    expect(response).toHaveProperty('uid', indexPk.uid)
    expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
  })

  test(`${permission} key: Get index info with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    const response: IndexResponse = await index.getRawInfo()
    expect(response).toHaveProperty('uid', indexNoPk.uid)
    expect(response).toHaveProperty('primaryKey', null)
  })

  test(`${permission} key: Get raw index info with NO primary key`, async () => {
    await client.createIndex(indexNoPk.uid)
    const response = await client.getRawIndex(indexNoPk.uid)
    expect(response).toHaveProperty('uid', indexNoPk.uid)
    expect(response).toHaveProperty('primaryKey', null)
  })

  test(`${permission} key: fetch index with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    const response: Index<any> = await index.fetchInfo()
    expect(response).toHaveProperty('uid', indexPk.uid)
    expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
  })

  test(`${permission} key: fetch primary key on an index with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    const response: string | undefined = await index.fetchPrimaryKey()
    expect(response).toBe(null)
  })

  test(`${permission} key: fetch primary key on an index with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    const response: string | undefined = await index.fetchPrimaryKey()
    expect(response).toBe(indexPk.primaryKey)
  })

  test(`${permission} key: fetch index with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    const response: Index<any> = await index.fetchInfo()
    expect(response).toHaveProperty('uid', indexNoPk.uid)
    expect(response).toHaveProperty('primaryKey', null)
  })

  test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    const response: Index<any> = await index.update({
      primaryKey: 'newPrimaryKey',
    })
    expect(response).toHaveProperty('uid', indexNoPk.uid)
    expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
  })

  test(`${permission} key: update primary key on an index that has no primary key already using client`, async () => {
    await client.createIndex(indexPk.uid)
    const response: Index<any> = await client.updateIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    expect(response).toHaveProperty('uid', indexPk.uid)
    expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
  })

  test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    const response: Index<any> = await index.update({
      primaryKey: 'newPrimaryKey',
    })

    expect(response).toHaveProperty('uid', indexPk.uid)
    expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
  })

  test(`${permission} key: delete index`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    const response: void = await index.delete()
    expect(response).toBe(undefined)
    await expect(client.getIndexes()).resolves.toHaveLength(0)
  })

  test(`${permission} key: fetch deleted index should fail`, async () => {
    const index = client.index(indexNoPk.uid)
    await expect(index.getRawInfo()).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: get deleted raw index should fail`, async () => {
    await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
    const index = client.index(indexNoPk.uid)
    await expect(index.delete()).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: get stats of an index`, async () => {
    const index = await client.createIndex(indexNoPk.uid)

    const response = await index.getStats()
    expect(response).toHaveProperty('numberOfDocuments', 0)
    expect(response).toHaveProperty('isIndexing', false)
    expect(response).toHaveProperty('fieldDistribution', {})
  })

  test(`${permission} key: delete if exists when index is present`, async () => {
    const index = await client.createIndex(indexPk.uid)
    const response: boolean = await index.deleteIfExists()
    expect(response).toBe(true)
    await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: delete if exists when index is not present`, async () => {
    const indexes = await client.getIndexes()
    const index = client.index('badIndex')
    const response: boolean = await index.deleteIfExists()
    expect(response).toBe(false)
    await expect(client.getIndex('badIndex')).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INDEX_NOT_FOUND
    )
    await expect(client.getIndexes()).resolves.toHaveLength(indexes.length)
  })

  test(`${permission} key: delete if exists error`, async () => {
    const index = badHostClient.index(indexPk.uid)
    await expect(index.deleteIfExists()).rejects.toThrow()
  })

  test(`${permission} key: delete index using client`, async () => {
    await client.createIndex(indexPk.uid)
    const response: void = await client.deleteIndex(indexPk.uid)
    expect(response).toBe(undefined)
    await expect(client.getIndexes()).resolves.toHaveLength(0)
  })
})

describe.skip.each([{ client: publicClient, permission: 'Public' }])(
  'Test on routes with public key',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to get raw index and be denied`, async () => {
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to get stats and be denied`, async () => {
      await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })
  }
)

describe.skip.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on routes without an API key',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get all indexes and be denied`, async () => {
      await expect(client.getIndexes()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get raw index and be denied`, async () => {
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.skip.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getStats route`, async () => {
    const route = `indexes/${indexPk.uid}/stats`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getRawInfo route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'type',
      'MeiliSearchCommunicationError'
    )
  })

  test(`Test getRawIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      'type',
      'MeiliSearchCommunicationError'
    )
  })

  test(`Test updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test delete index route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
