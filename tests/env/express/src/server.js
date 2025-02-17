const express = require("express");
const app = express();
const router = express.Router();

console.log(process.cwd());
router.get("/meilisearch", function (req, res) {
  res.sendFile(`${process.cwd()}/public/index.html`);
});

router.get("/headers", function (req, res) {
  res.sendFile(`${process.cwd()}/public/headers.html`);
});
app.use(express.static("public"));

// add the router
app.use("/", router);
app.listen(process.env.port || 3000);

console.log("Running at Port 3000");
