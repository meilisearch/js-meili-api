import { writeFileSync } from "node:fs";
import pkg from "../package.json" with { type: "json" };

const { name, version, exports, files } = pkg;

writeFileSync(
  new URL("../jsr.json", import.meta.url),
  JSON.stringify(
    {
      name: `@meilisearch/${name}`,
      version,
      exports: Object.fromEntries(
        Object.entries(exports).map(([key, val]) => [
          key,
          val.import.replace("dist/esm", "src").replace(".js", ".ts"),
        ]),
      ),
      publish: { include: files.filter((v) => v !== "dist") },
    },
    null,
    2,
  ),
);
