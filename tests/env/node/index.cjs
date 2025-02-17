const {
  MeiliSearch,
  default: DefaultMeiliSearch,
} = require("../../../dist/cjs/index.cjs");
const { generateTenantToken } = require("../../../dist/cjs/token.cjs");

const CJStest = new MeiliSearch({
  host: "http://localhost:7700",
  apiKey: "masterKey",
});
const DefaultCJSTest = new DefaultMeiliSearch({
  host: "http://localhost:7700",
  apiKey: "masterKey",
});

generateTenantToken({
  apiKey: "masterKey",
  apiKeyUid: "e489fe16-3381-431b-bee3-00430192915d",
})
  .then((token) => console.log({ CJStest, DefaultCJSTest, token }))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
