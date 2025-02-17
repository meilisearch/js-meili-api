const { MeiliSearch } = require("../../../dist/cjs/index.cjs");

(async () => {
  const client = new MeiliSearch({
    host: "http://127.0.0.1:7700",
    apiKey: "masterKey",
  });

  // An index is where the documents are stored.
  const index = client.index("movies");

  const dataset = [
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
  ];

  // If the index 'movies' does not exist, MeiliSearch creates it when you first add the documents.
  await index.updateFilterableAttributes(["director", "genres", "id"]);

  let response = await index.addDocuments(dataset);

  console.log(response); // => { "updateId": 0 }

  await client.waitForTask(response.taskUid);

  const search = await index.search("philoudelphia");
  console.log({ search, hit: search.hits });
  const filteredSearch = await index.search("Wonder", {
    attributesToHighlight: ["*"],
    filter: "id >= 1",
  });
  console.log({ filteredSearch, hit: filteredSearch.hits[0] });
  const facetedSearch = await index.search("", {
    filter: ["genres = action"],
    facets: ["genres"],
  });
  console.log(JSON.stringify(facetedSearch));
})();
