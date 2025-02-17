const { MeiliSearch } = require('../../../dist/bundles/meilisearch.umd.js')
const dataset = require('../../../assets/small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const indexUid = 'movies'

const addDataset = async () => {
  await client.deleteIndex(indexUid)
  await client.createIndex(indexUid).waitTask()

  const index = client.index(indexUid)

  const documents = await index.getDocuments()
  if (documents.results.length === 0) {
    await index.addDocuments(dataset).waitTask()
  }
}

;(async () => {
  await addDataset()
  const index = await client.index('movies')
  const resp = await index.search('Avengers', {
    limit: 1,
    attributesToHighlight: ['title'],
  })
  console.log({ resp })
  console.log({ hit: resp.hits[0] })
})()
