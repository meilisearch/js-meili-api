import * as Types from '../src/types'
import {
  clearAllIndexes,
  sleep,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)


beforeAll(async () => {
  await clearAllIndexes(config)
  await masterClient.createIndex(index)
  await sleep(500)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on accept-new-fields', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index)
  })
  test(`${permission} key: Get accept new fields to be true`, async () => {
    await client.getIndex(index.uid).getAcceptNewFields()
      .then((response: Boolean) => {
        expect(response).toEqual(true)
      })
  })
  test(`${permission} key: Update accept new fields to false`, async () => {
    await client.getIndex(index.uid).updateAcceptNewFields(false)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response.updateId
      })
    await sleep(500)
    await client.getIndex(index.uid).getAcceptNewFields()
    .then((response: Boolean) => {
      expect(response).toEqual(false)
    })
  })
})

describe.each([
  { client: publicClient, permission: 'Public' }
])('Test on accept-new-fields', ({ client, permission }) => {
  test(`${permission} key: try to get accept-new-fields and be denied`, async () => {
    await expect(client.getIndex(index.uid).getAcceptNewFields()).rejects.toThrowError(
      `Invalid API key: ${PUBLIC_KEY}`
    )
  })
})

describe.each([
  { client: anonymousClient, permission: 'No' }
])('Test on accept-new-fields', ({ client, permission }) => {
  test(`${permission} key: try to get accept-new-fields and be denied`, async () => {
    await expect(client.getIndex(index.uid).getAcceptNewFields()).rejects.toThrowError(
      `Invalid API key: Need a token`
    )
  })
})
