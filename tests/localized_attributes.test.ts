import { ErrorStatusCode, type LocalizedAttributes } from '../src/types';
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './utils/meilisearch-test-utils';

const index = {
  uid: 'movies_test',
};

const DEFAULT_LOCALIZED_ATTRIBUTES = null;

jest.setTimeout(100 * 1000);

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Test on localizedAttributes',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient('Master');
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default localizedAttributes settings`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getLocalizedAttributes();

      expect(response).toEqual(DEFAULT_LOCALIZED_ATTRIBUTES);
    });

    test(`${permission} key: Update localizedAttributes to valid value`, async () => {
      const client = await getClient(permission);
      const newLocalizedAttributes: LocalizedAttributes = [
        { attributePatterns: ['title'], locales: ['eng'] },
      ];
      const task = await client
        .index(index.uid)
        .updateLocalizedAttributes(newLocalizedAttributes);
      await client.waitForTask(task.taskUid);

      const response = await client.index(index.uid).getLocalizedAttributes();

      expect(response).toEqual(newLocalizedAttributes);
    });

    test(`${permission} key: Update localizedAttributes to null`, async () => {
      const client = await getClient(permission);
      const newLocalizedAttributes = null;
      const task = await client
        .index(index.uid)
        .updateLocalizedAttributes(newLocalizedAttributes);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getLocalizedAttributes();

      expect(response).toEqual(DEFAULT_LOCALIZED_ATTRIBUTES);
    });

    test(`${permission} key: Update localizedAttributes with invalid value`, async () => {
      const client = await getClient(permission);
      const newLocalizedAttributes = 'hello' as any; // bad localizedAttributes value

      await expect(
        client
          .index(index.uid)
          .updateLocalizedAttributes(newLocalizedAttributes),
      ).rejects.toHaveProperty(
        'cause.code',
        ErrorStatusCode.INVALID_SETTINGS_LOCALIZED_ATTRIBUTES,
      );
    });

    test(`${permission} key: Reset localizedAttributes`, async () => {
      const client = await getClient(permission);
      const newLocalizedAttributes: LocalizedAttributes = [];
      const updateTask = await client
        .index(index.uid)
        .updateLocalizedAttributes(newLocalizedAttributes);
      await client.waitForTask(updateTask.taskUid);
      const task = await client.index(index.uid).resetLocalizedAttributes();
      await client.waitForTask(task.taskUid);

      const response = await client.index(index.uid).getLocalizedAttributes();

      expect(response).toEqual(DEFAULT_LOCALIZED_ATTRIBUTES);
    });
  },
);

describe.each([{ permission: 'Search' }])(
  'Test on localizedAttributes',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master');
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getLocalizedAttributes(),
      ).rejects.toHaveProperty('cause.code', ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateLocalizedAttributes([]),
      ).rejects.toHaveProperty('cause.code', ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetLocalizedAttributes(),
      ).rejects.toHaveProperty('cause.code', ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: 'No' }])(
  'Test on localizedAttributes',
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient('Master');
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getLocalizedAttributes(),
      ).rejects.toHaveProperty(
        'cause.code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateLocalizedAttributes([]),
      ).rejects.toHaveProperty(
        'cause.code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset localizedAttributes and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetLocalizedAttributes(),
      ).rejects.toHaveProperty(
        'cause.code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getLocalizedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/localized-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getLocalizedAttributes(),
    ).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`Test updateLocalizedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/localized-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateLocalizedAttributes(null),
    ).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`Test resetLocalizedAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/localized-attributes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetLocalizedAttributes(),
    ).rejects.toHaveProperty(
      'message',
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
