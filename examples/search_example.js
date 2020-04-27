const MeiliSearch = require('../')
const dataset = require('./small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const meili = new MeiliSearch(config)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const index = {
  uid: 'movies',
}

const addDataset = async () => {
  const indexes = await meili.listIndexes()
  const indexFound = indexes.find((i) => i.uid === index.uid)
  console.log({ indexes, indexFound })

  if (!indexFound) {
    await meili.createIndex(index)
  }
  const documents = await meili.getIndex(index.uid).getDocuments()
  if (documents.length === 0) {
    await meili.getIndex(index.uid).addDocuments(dataset)
    await sleep(1000) // This is to give time to MeiliSearch to index the dataset
    // If you have no results it means it took more than 1 second to index.
  }
}

;(async () => {
  await addDataset()
  const index = await meili.getIndex('movies')
  const resp = await index.search('Avengers', {
    limit: 1,
    attributesToHighlight: 'title',
  })
  console.log({ resp })
  console.log({ r: resp.hits[0]._formatted })
})()
