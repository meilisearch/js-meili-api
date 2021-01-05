import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  waitForDumpProcessing,
  badHostClient,
  BAD_HOST,
} from './meilisearch-test-utils'

beforeAll(async () => {
  await clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on dump', ({ client, permission }) => {
  test(`${permission} key: create a new dump`, async () => {
    const response = await client.createDump()
    expect(response.uid).toBeDefined()
    expect(response.status).toEqual('in_progress')
    await waitForDumpProcessing(response.uid, client)
  })

  test(`${permission} key: get dump status`, async () => {
    const enqueuedDump = await client.createDump()
    await waitForDumpProcessing(enqueuedDump.uid, client)
    const response = await client.getDumpStatus(enqueuedDump.uid)
    expect(response.uid).toEqual(enqueuedDump.uid)
    expect(response.status).toBeDefined()
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on dump with public api key should not have access',
  ({ client, permission }) => {
    test(`${permission} key: try to create dump with public key and be denied`, async () => {
      await expect(client.createDump()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })

    test(`${permission} key: try to get dump status with public key and be denied`, async () => {
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on dump without api key should not have access',
  ({ client, permission }) => {
    test(`${permission} key: try to create dump with no key and be denied`, async () => {
      await expect(client.createDump()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get dump status with no key and be denied`, async () => {
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Post request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.createDump()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/dumps`)
    expect(e.message).not.toMatch(`${BAD_HOST}/dumps/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Get status request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.getDumpStatus('1')
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/dumps/1/status`)
    expect(e.message).not.toMatch(`${BAD_HOST}/dumps/1/status/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
