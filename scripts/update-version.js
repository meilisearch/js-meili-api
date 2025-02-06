import { argv, stdout } from "node:process";
import { writeFileSync } from "node:fs";

if (argv.length !== 3) {
  throw new Error("expected one command line argument", {
    cause: argv.slice(2),
  });
}

/** @type {{ isDraft: boolean; tagName: string }[]} */
const arrayWithLastRelease = JSON.parse(argv[2]);

if (!Array.isArray(arrayWithLastRelease) || arrayWithLastRelease.length !== 1) {
  throw new Error("expected an array with one element", {
    cause: arrayWithLastRelease,
  });
}

const lastRelease = arrayWithLastRelease[0];
const { isDraft, tagName } = lastRelease;

if (
  Object.keys(lastRelease).length !== 2 ||
  typeof isDraft !== "boolean" ||
  typeof tagName !== "string"
) {
  throw new Error(
    'expected an object with keys "isDraft" as boolean and "tagName" as string',
    { cause: lastRelease },
  );
}

if (!isDraft) {
  throw new Error(
    "expected a draft release to be present as the first element in the releases list",
  );
}

// TODO: tagName might be prefixed with a "v" or god knows what else

const packageVersionFileContents = `export const PACKAGE_VERSION = "${tagName.replace('"', '\\"')}";\n`;

const packageVersionFilePath = new URL(
  "../src/package-version.ts",
  import.meta.url,
);

writeFileSync(packageVersionFilePath, packageVersionFileContents);

stdout.write(tagName);

// TODO: check https://docs.npmjs.com/cli/v10/commands/npm-version#sign-git-tag
// TODO: Call npm version for the output of this here script https://docs.npmjs.com/cli/v10/commands/npm-version
// `npm version --commit-hooks false`;
