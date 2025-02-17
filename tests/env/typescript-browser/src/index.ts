import { MeiliSearch, type IndexObject } from "../../../../src/index.js";
import { generateTenantToken } from "../../../../src/token.js";

const config = {
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
};

const client = new MeiliSearch(config);
const user = "MeiliSearch User";

function greeter(person: string) {
  return "Hello, " + person;
}

(async () => {
  const indexes = await client.getRawIndexes();
  console.log({ indexes }, "hello");
  const uids = indexes.results.map((index: IndexObject) => index.uid);
  document.body.innerHTML = `${greeter(
    user,
  )} this is the list of all your indexes: \n ${uids.join(", ")}`;

  console.log(
    await generateTenantToken({
      apiKey: config.apiKey,
      apiKeyUid: "e489fe16-3381-431b-bee3-00430192915d",
    }),
  ); // Resolved using the `browser` field
})();
