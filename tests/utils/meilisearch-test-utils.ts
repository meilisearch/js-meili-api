import { MeiliSearch, Index } from "../../src";
import { Config, Key } from "../../src/types";

// testing
const MASTER_KEY = "masterKey";
const HOST = process.env.MEILISEARCH_URL || "http://127.0.0.1:7700";
const BAD_HOST = "http://127.0.0.1:7701";

const config = {
  host: HOST,
  apiKey: MASTER_KEY,
};
const badHostClient = new MeiliSearch({
  host: BAD_HOST,
  apiKey: MASTER_KEY,
});
const masterClient = new MeiliSearch({
  host: HOST,
  apiKey: MASTER_KEY,
});

const anonymousClient = new MeiliSearch({
  host: HOST,
});

async function getKey(permission: string): Promise<string> {
  if (permission === "No") {
    return "";
  }
  const { results: keys } = await masterClient.getKeys();

  if (permission === "Search") {
    const key = keys.find(
      (key: Key) => key.name === "Default Search API Key",
    )?.key;
    return key || "";
  }

  if (permission === "Admin") {
    const key = keys.find(
      (key: Key) => key.name === "Default Admin API Key",
    )?.key;
    return key || "";
  }
  return MASTER_KEY;
}

async function getClient(permission: string): Promise<MeiliSearch> {
  if (permission === "No") {
    const anonymousClient = new MeiliSearch({
      host: HOST,
    });
    return anonymousClient;
  }

  if (permission === "Search") {
    const searchKey = await getKey(permission);
    const searchClient = new MeiliSearch({
      host: HOST,
      apiKey: searchKey,
    });
    return searchClient;
  }

  if (permission === "Admin") {
    const adminKey = await getKey(permission);
    const adminClient = new MeiliSearch({
      host: HOST,
      apiKey: adminKey,
    });
    return adminClient;
  }

  return masterClient;
}

const clearAllIndexes = async (config: Config): Promise<void> => {
  const client = new MeiliSearch(config);

  const { results } = await client.getRawIndexes();
  const indexes = results.map(({ uid }) => uid);

  const taskIds: number[] = [];
  for (const indexUid of indexes) {
    const { taskUid } = await client.index(indexUid).delete();
    taskIds.push(taskUid);
  }
  await client.waitForTasks(taskIds, { timeOutMs: 60_000 });
};

function decode64(buff: string) {
  return Buffer.from(buff, "base64").toString();
}

const datasetWithNests = [
  {
    id: 1,
    title: "Pride and Prejudice",
    info: {
      comment: "A great book",
      reviewNb: 500,
    },
  },
  {
    id: 2,
    title: "Le Petit Prince",
    info: {
      comment: "A french book",
      reviewNb: 600,
    },
  },
  {
    id: 3,
    title: "Le Rouge et le Noir",
    info: {
      comment: "Another french book",
      reviewNb: 700,
    },
  },
  {
    id: 4,
    title: "Alice In Wonderland",
    info: {
      comment: "A weird book",
      reviewNb: 800,
    },
  },
  {
    id: 5,
    title: "The Hobbit",
    info: {
      comment: "An awesome book",
      reviewNb: 900,
    },
  },
  {
    id: 6,
    title: "Harry Potter and the Half-Blood Prince",
    info: {
      comment: "The best book",
      reviewNb: 1000,
    },
  },
  { id: 7, title: "The Hitchhiker's Guide to the Galaxy" },
];

const dataset: Array<{ id: number; title: string; comment?: string }> = [
  { id: 123, title: "Pride and Prejudice", comment: "A great book" },
  { id: 456, title: "Le Petit Prince", comment: "A french book" },
  { id: 2, title: "Le Rouge et le Noir", comment: "Another french book" },
  { id: 1, title: "Alice In Wonderland", comment: "A weird book" },
  { id: 1344, title: "The Hobbit", comment: "An awesome book" },
  {
    id: 4,
    title: "Harry Potter and the Half-Blood Prince",
    comment: "The best book",
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
];

export type Book = {
  id: number;
  title: string;
  comment: string;
};

export {
  clearAllIndexes,
  config,
  masterClient,
  badHostClient,
  anonymousClient,
  BAD_HOST,
  HOST,
  MASTER_KEY,
  MeiliSearch,
  Index,
  getClient,
  getKey,
  decode64,
  dataset,
  datasetWithNests,
};
