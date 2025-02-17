import {
  afterAll,
  assert,
  beforeAll,
  type MockInstance,
  test,
  vi,
} from "vitest";
import {
  clearAllIndexes,
  config,
  MeiliSearch,
} from "./utils/meilisearch-test-utils.js";

let fetchSpy: MockInstance<typeof fetch>;

beforeAll(() => {
  fetchSpy = vi.spyOn(globalThis, "fetch");
});

afterAll(async () => {
  fetchSpy.mockRestore();
  await clearAllIndexes(config);
});

test(`Client handles host URL with domain and path, and adds trailing slash`, async () => {
  const customHost = `${config.host}/api`;
  const client = new MeiliSearch({ host: customHost });

  assert.strictEqual(client.config.host, customHost);

  await client.isHealthy();

  assert.isDefined(fetchSpy.mock.lastCall);
  const [input] = fetchSpy.mock.lastCall!;

  assert.instanceOf(input, URL);
  assert.strictEqual((input as URL).href, `${customHost}/health`);
});
