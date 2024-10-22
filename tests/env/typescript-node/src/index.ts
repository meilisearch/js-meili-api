
// @ts-ignore
import {
  // @ts-ignore
  MeiliSearch,
  IndexObject,
  SearchResponse,
  Hits,
  Hit,
  SearchParams,
} from '../../../../'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

interface Movie {
  id: number
  title: string
  genre?: string
  comment?: string
  isNull?: null
  isTrue?: true
}

const client = new MeiliSearch(config)
const indexUid = "movies"

;(async () => {
  await client.deleteIndex(indexUid)
  const { taskUid } = await client.createIndex(indexUid)
  await client.waitForTask(taskUid)

  const index = client.index(indexUid)
  const indexes = await client.getRawIndexes()
  indexes.results.map((index: IndexObject) => {
    console.log(index.uid)
    // console.log(index.something) -> ERROR
  })

  const searchParams: SearchParams = {
    limit: 5,
    attributesToRetrieve: ['title', 'genre'],
    attributesToHighlight: ['title'],
    // test: true -> ERROR Test does not exist on type SearchParams
  }
  indexes.results.map((index: IndexObject) => index.uid)
  const res: SearchResponse<Movie> = await index.search(
    'avenger',
    searchParams
  ) as unknown as SearchResponse<Movie>

  // both work
  const { hits }: { hits: Hits<Movie> } = res

  hits.map((hit: Hit<Movie>) => {
    console.log(hit?.genre)
    console.log(hit.title)
    // console.log(hit._formatted.title) -> ERROR, _formatted could be undefined
    // console.log(hit?._formatted.title) -> ERROR, title could be undefined
    console.log(hit?._formatted?.title)
  })

  console.log(await client.generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', []))

  await index.delete()
})()
