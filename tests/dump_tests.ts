import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  waitForDumpProcessing,
  MeiliSearch,
  BAD_HOST,
} from './meilisearch-test-utils'

beforeEach(async () => {
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
    expect(response.startedAt).toBeDefined()
    expect(response.finishedAt).toBeDefined()
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

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test createDump route`, async () => {
    const route = `dumps`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host

    await expect(client.createDump()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getDumpStatus route`, async () => {
    const route = `dumps/1/status`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getDumpStatus('1')).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
