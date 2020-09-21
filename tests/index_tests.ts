import MeiliSearch, * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
} from './meilisearch-test-utils'

const uidNoPrimaryKey = {
  uid: 'movies_test',
}
const uidAndPrimaryKey = {
  uid: 'movies_test2',
  primaryKey: 'id',
}

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on indexes', ({ client, permission }) => {
  describe('Test on indexes', () => {
    beforeAll(() => {
      return clearAllIndexes(config)
    })
    test(`${permission} key: get all indexes when empty`, async () => {
      const expected: Types.IndexResponse[] = []
      await client.listIndexes().then((response: Types.IndexResponse[]) => {
        expect(response).toEqual(expected)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(0)
    })
    test(`${permission} key: create with no primary key`, async () => {
      await client.createIndex(uidNoPrimaryKey.uid).then((response) => {
        expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
      })

      await client
        .getIndex(uidNoPrimaryKey.uid)
        .show()
        .then((response: Types.IndexResponse) => {
          expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
          expect(response).toHaveProperty('primaryKey', null)
          expect(response).toHaveProperty('createdAt', expect.any(String))
          expect(response).toHaveProperty('updatedAt', expect.any(String))
        })
    })
    test(`${permission} key: create with primary key`, async () => {
      await client
        .createIndex(uidAndPrimaryKey.uid, {
          primaryKey: uidAndPrimaryKey.primaryKey,
        })
        .then((response) => {
          expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
        })
      await client
        .getIndex(uidAndPrimaryKey.uid)
        .show()
        .then((response: Types.IndexResponse) => {
          expect(response).toHaveProperty(
            'primaryKey',
            uidAndPrimaryKey.primaryKey
          )
          expect(response).toHaveProperty('createdAt', expect.any(String))
          expect(response).toHaveProperty('updatedAt', expect.any(String))
        })
    })
    test(`${permission} key: get all indexes when not empty`, async () => {
      await client.listIndexes().then((response: Types.IndexResponse[]) => {
        const indexes = response.map((index) => index.uid)
        expect(indexes).toEqual(expect.arrayContaining([uidAndPrimaryKey.uid]))
        expect(indexes).toEqual(expect.arrayContaining([uidNoPrimaryKey.uid]))
        expect(indexes.length).toEqual(2)
      })
    })
    test(`${permission} key: show index with primary key`, async () => {
      const index = client.getIndex(uidAndPrimaryKey.uid)
      await index.show().then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
        expect(response).toHaveProperty(
          'primaryKey',
          uidAndPrimaryKey.primaryKey
        )
      })
    })

    test(`${permission} key: show index with NO primary key`, async () => {
      const index = client.getIndex(uidNoPrimaryKey.uid)
      await index.show().then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
        expect(response).toHaveProperty('primaryKey', null)
      })
    })

    test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
      const index = client.getIndex(uidNoPrimaryKey.uid)
      await index
        .updateIndex({ primaryKey: 'newPrimaryKey' })
        .then((response: Types.IndexResponse) => {
          expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
          expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
        })
    })

    test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
      const index = client.getIndex(uidAndPrimaryKey.uid)
      await expect(
        index.updateIndex({ primaryKey: 'newPrimaryKey' })
      ).rejects.toThrowError(
        `A primary key is already present. It's impossible to update it`
      )
    })

    test(`${permission} key: delete index`, async () => {
      const index = client.getIndex(uidNoPrimaryKey.uid)
      await index.deleteIndex().then((response: void) => {
        expect(response).toBe(undefined)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(1)
    })
    test(`${permission} key: bad host should raise CommunicationError`, async () => {
      const client = new MeiliSearch({ host: 'http://localhost:9345' })
      try {
        await client.version()
      } catch (e) {
        expect(e.type).toEqual('MeiliSearchCommunicationError')
      }
    })
    test(`${permission} key: show deleted index should fail`, async () => {
      const index = client.getIndex(uidNoPrimaryKey.uid)
      await expect(index.show()).rejects.toThrowError(
        `Index ${uidNoPrimaryKey.uid} not found`
      )
    })

    test(`${permission} key: create index with already existing uid should fail`, async () => {
      await expect(
        client.createIndex(uidAndPrimaryKey.uid, {
          primaryKey: uidAndPrimaryKey.primaryKey,
        })
      ).rejects.toThrowError(`index already exists`)
    })

    test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
      const index = client.getIndex(uidNoPrimaryKey.uid)
      await expect(index.deleteIndex()).rejects.toThrowError(
        `Index ${uidNoPrimaryKey.uid} not found`
      )
    })
  })
  describe('Test on base routes', () => {
    test(`${permission} key: get health`, async () => {
      await client.isHealthy().then((response: boolean) => {
        expect(response).toBe(true)
      })
    })
    test(`${permission} key: get version`, async () => {
      await client.version().then((response: Types.Version) => {
        expect(response).toHaveProperty('commitSha', expect.any(String))
        expect(response).toHaveProperty('buildDate', expect.any(String))
        expect(response).toHaveProperty('pkgVersion', expect.any(String))
      })
    })
    test(`${permission} key: get /stats information`, async () => {
      await client.stats().then((response: Types.Stats) => {
        expect(response).toHaveProperty('databaseSize', expect.any(Number))
        expect(response).toHaveProperty('lastUpdate') // TODO: Could be null, find out why
        expect(response).toHaveProperty('indexes', expect.any(Object))
      })
    })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on routes where public key should not have access',
  ({ client, permission }) => {
    describe('Test on indexes', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toThrowError(
          `Invalid API key: ${PUBLIC_KEY}`
        )
      })
      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidAndPrimaryKey.uid, {
            primaryKey: uidAndPrimaryKey.primaryKey,
          })
        ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
      })
      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidNoPrimaryKey.uid)
        ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
      })
      test(`${permission} key: try to get index info and be denied`, async () => {
        await expect(
          client.getIndex(uidNoPrimaryKey.uid).show()
        ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
      })
      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(
          client.getIndex(uidAndPrimaryKey.uid).deleteIndex()
        ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
      })
      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client
            .getIndex(uidAndPrimaryKey.uid)
            .updateIndex({ primaryKey: uidAndPrimaryKey.primaryKey })
        ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
      })
    })
    describe('Test on base routes', () => {
      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.version()).rejects.toThrowError(
          `Invalid API key: ${PUBLIC_KEY}`
        )
      })
      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.stats()).rejects.toThrowError(
          `Invalid API key: ${PUBLIC_KEY}`
        )
      })
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on routes where client without api key should not have access',
  ({ client, permission }) => {
    describe('Test on indexes', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toThrowError(
          `You must have an authorization token`
        )
      })
      test(`${permission} key: try to create an index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidAndPrimaryKey.uid, {
            primaryKey: uidAndPrimaryKey.primaryKey,
          })
        ).rejects.toThrowError(`You must have an authorization token`)
      })
      test(`${permission} key: try to create an index with NO primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidNoPrimaryKey.uid)
        ).rejects.toThrowError(`You must have an authorization token`)
      })
      test(`${permission} key: try to get index info and be denied`, async () => {
        await expect(
          client.getIndex(uidNoPrimaryKey.uid).show()
        ).rejects.toThrowError(`You must have an authorization token`)
      })
      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(
          client.getIndex(uidAndPrimaryKey.uid).deleteIndex()
        ).rejects.toThrowError(`You must have an authorization token`)
      })
      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client
            .getIndex(uidAndPrimaryKey.uid)
            .updateIndex({ primaryKey: uidAndPrimaryKey.primaryKey })
        ).rejects.toThrowError(`You must have an authorization token`)
      })
    })
    describe('Test on base routes', () => {
      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.version()).rejects.toThrowError(
          `You must have an authorization token`
        )
      })
      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.stats()).rejects.toThrowError(
          `You must have an authorization token`
        )
      })
    })
  }
)
