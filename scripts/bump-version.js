import { argv, stdout } from "node:process";
import { writeFileSync } from "node:fs";

if (argv.length !== 3) {
  throw new Error("expected one command line argument", {
    cause: argv.slice(2),
  });
}

/** @type {string | { isDraft: boolean; tagName: string }[]} */
const arrayWithLastReleaseOrVersion = JSON.parse(argv[2]);

const pkgVersion = (function () {
  if (typeof arrayWithLastReleaseOrVersion === "string") {
    return arrayWithLastReleaseOrVersion;
  }

  if (
    !Array.isArray(arrayWithLastReleaseOrVersion) ||
    arrayWithLastReleaseOrVersion.length !== 1
  ) {
    throw new Error("expected an array with one element", {
      cause: arrayWithLastReleaseOrVersion,
    });
  }

  const lastRelease = arrayWithLastReleaseOrVersion[0];
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

  // remove the "v" from "vX.X.X"
  return tagName.substring(1);
})();

const pkgVersionFileContents = `export const PACKAGE_VERSION = "${pkgVersion}";\n`;

const pkgVersionFilePath = new URL(
  "../src/package-version.ts",
  import.meta.url,
);

writeFileSync(pkgVersionFilePath, pkgVersionFileContents);

stdout.write(pkgVersion);
