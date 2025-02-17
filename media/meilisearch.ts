import { Index, Meilisearch } from "../../../src/index.js";

const client = new Meilisearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});
const indexUid = "movies";
const index = client.index<{ id: number; title: string; genres: string[] }>(
  indexUid,
);

export async function addDocuments(): Promise<void> {
  await client.deleteIndexIfExists(indexUid);

  const task1 = await client.createIndex(indexUid);
  await client.waitForTask(task1.taskUid);

  const task2 = await index.addDocuments([
    { id: 1, title: "Carol", genres: ["Romance", "Drama"] },
    { id: 2, title: "Wonder Woman", genres: ["Action", "Adventure"] },
    { id: 3, title: "Life of Pi", genres: ["Adventure", "Drama"] },
    {
      id: 4,
      title: "Mad Max: Fury Road",
      genres: ["Adventure", "Science Fiction"],
    },
    { id: 5, title: "Moana", genres: ["Fantasy", "Action"] },
    { id: 6, title: "Philadelphia", genres: ["Drama"] },
  ]);

  await client.index(indexUid).waitForTask(task2.taskUid);
}

export async function getAllHits(element: HTMLDivElement): Promise<void> {
  const documents = await index.getDocuments();

  element.innerText = JSON.stringify(documents, null, 4);
}

export async function getSearchResponse(element: HTMLDivElement) {
  const params: Parameters<Index["search"]> = [
    "philoudelphia",
    { attributesToHighlight: ["title"] },
  ];

  const response = await client.index(indexUid).search(...params);

  element.innerText =
    `PARAMETERS: ${JSON.stringify(params, null, 4)}` +
    `\nRESPONSE: ${JSON.stringify(response, null, 4)}`;
}
