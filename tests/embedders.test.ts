import { afterAll, expect, test, describe, beforeEach } from "vitest";
import { EnqueuedTask } from "../src/enqueued-task.js";
import type { Embedders } from "../src/types.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

const datasetSimilarSearch = [
  {
    title: "Shazam!",
    release_year: 2019,
    id: "287947",
    _vectors: { manual: [0.8, 0.4, -0.5] },
  },
  {
    title: "Captain Marvel",
    release_year: 2019,
    id: "299537",
    _vectors: { manual: [0.6, 0.8, -0.2] },
  },
  {
    title: "Escape Room",
    release_year: 2019,
    id: "522681",
    _vectors: { manual: [0.1, 0.6, 0.8] },
  },
  {
    title: "How to Train Your Dragon: The Hidden World",
    release_year: 2019,
    id: "166428",
    _vectors: { manual: [0.7, 0.7, -0.4] },
  },
  {
    title: "All Quiet on the Western Front",
    release_year: 1930,
    id: "143",
    _vectors: { manual: [-0.5, 0.3, 0.85] },
  },
];

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on embedders",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient(permission);

      const task = await client.createIndex(index.uid);
      await client.waitForTask(task.taskUid);
    });

    test(`${permission} key: Get default embedders`, async () => {
      const client = await getClient(permission);
      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({});
    });

    test(`${permission} key: Update embedders with 'userProvided' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "userProvided",
          dimensions: 1,
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          binaryQuantized: false,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);

      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
      expect(response).not.toHaveProperty("documentTemplateMaxBytes");
    });

    test(`${permission} key: Update embedders with 'openAi' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "openAi",
          apiKey: "<your-OpenAI-API-key>",
          model: "text-embedding-3-small",
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          dimensions: 1536,
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          url: "https://api.openai.com/v1/embeddings",
          documentTemplateMaxBytes: 500,
          binaryQuantized: false,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);
      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with 'huggingFace' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "huggingFace",
          model: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          documentTemplateMaxBytes: 500,
          binaryQuantized: false,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);
      await client.waitForTask(task.taskUid, { timeOutMs: 60_000 });

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
    });

    test(`${permission} key: Update embedders with 'rest' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "rest",
          url: "https://api.openai.com/v1/embeddings",
          apiKey: "<your-openai-api-key>",
          dimensions: 1536,
          documentTemplate:
            "A movie titled '{{doc.title}}' whose description starts with {{doc.overview|truncatewords: 20}}",
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          request: {
            model: "text-embedding-3-small",
            input: ["{{text}}", "{{..}}"],
          },
          response: {
            data: [
              {
                embedding: "{{embedding}}",
              },
              "{{..}}",
            ],
          },
          headers: {
            "Custom-Header": "CustomValue",
          },
          documentTemplateMaxBytes: 500,
          binaryQuantized: false,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);
      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with 'ollama' source`, async () => {
      const client = await getClient(permission);
      const newEmbedder: Embedders = {
        default: {
          source: "ollama",
          url: "http://localhost:11434/api/embeddings",
          apiKey: "<your-ollama-api-key>",
          model: "nomic-embed-text",
          documentTemplate: "blabla",
          distribution: {
            mean: 0.7,
            sigma: 0.3,
          },
          dimensions: 512,
          documentTemplateMaxBytes: 500,
          binaryQuantized: false,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);
      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({
        default: {
          ...newEmbedder.default,
          apiKey: "<yoXXXXX...",
        },
      });
    });

    test(`${permission} key: Update embedders with a specific name`, async () => {
      const client = await getClient(permission);

      const newEmbedder: Embedders = {
        image: {
          source: "userProvided",
          dimensions: 512,
        },
      };
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);

      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual(newEmbedder);
    });

    test(`${permission} key: Reset embedders`, async () => {
      const client = await getClient(permission);
      const task: EnqueuedTask = await client.index(index.uid).resetEmbedders();
      await client.waitForTask(task.taskUid);

      const response: Embedders = await client.index(index.uid).getEmbedders();

      expect(response).toEqual({});
    });

    test(`${permission} key: search (POST) with vectors`, async () => {
      const client = await getClient(permission);

      const { taskUid } = await client.index(index.uid).updateEmbedders({
        default: {
          source: "userProvided",
          dimensions: 1,
        },
      });
      await client.waitForTask(taskUid);

      const response = await client.index(index.uid).search("", {
        vector: [1],
        hybrid: {
          embedder: "default",
          semanticRatio: 1.0,
        },
      });

      expect(response).toHaveProperty("hits");
      expect(response).toHaveProperty("semanticHitCount");
      // Those fields are no longer returned by the search response
      // We want to ensure that they don't appear in it anymore
      expect(response).not.toHaveProperty("vector");
      expect(response).not.toHaveProperty("_semanticScore");
    });

    test(`${permission} key: search (GET) with vectors`, async () => {
      const client = await getClient(permission);

      const { taskUid } = await client.index(index.uid).updateEmbedders({
        default: {
          source: "userProvided",
          dimensions: 1,
        },
      });
      await client.waitForTask(taskUid);

      const response = await client.index(index.uid).searchGet("", {
        vector: [1],
        hybridEmbedder: "default",
        hybridSemanticRatio: 1.0,
      });

      expect(response).toHaveProperty("hits");
      expect(response).toHaveProperty("semanticHitCount");
      // Those fields are no longer returned by the search response
      // We want to ensure that they don't appear in it anymore
      expect(response).not.toHaveProperty("vector");
      expect(response).not.toHaveProperty("_semanticScore");
    });

    test(`${permission} key: search for similar documents`, async () => {
      const client = await getClient(permission);

      const newEmbedder: Embedders = {
        manual: {
          source: "userProvided",
          dimensions: 3,
        },
      };
      const { taskUid: updateEmbeddersTask }: EnqueuedTask = await client
        .index(index.uid)
        .updateEmbedders(newEmbedder);

      await client.waitForTask(updateEmbeddersTask);

      const { taskUid: documentAdditionTask } = await client
        .index(index.uid)
        .addDocuments(datasetSimilarSearch);

      await client.waitForTask(documentAdditionTask);

      const response = await client.index(index.uid).searchSimilarDocuments({
        embedder: "manual",
        id: "143",
      });

      expect(response).toHaveProperty("hits");
      expect(response.hits.length).toEqual(4);
      expect(response).toHaveProperty("offset", 0);
      expect(response).toHaveProperty("limit", 20);
      expect(response).toHaveProperty("estimatedTotalHits", 4);
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).getEmbedders()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateEmbedders({}),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetEmbedders route`, async () => {
    const route = `indexes/${index.uid}/settings/embedders`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetEmbedders(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
