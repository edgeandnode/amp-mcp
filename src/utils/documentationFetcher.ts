import { Effect, pipe } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");
const docsDir = join(projectRoot, "docs");

const ampDocs = {
  "amp": "README.md",
  "amp/getting-started": "getting-started.md",
  "amp/config": "config.md",
  "amp/glossary": "glossary.md",
  "amp/examples": "examples.md",
  "amp/querying-data": "querying-data.md",
  "amp/troubleshooting": "troubleshooting.md",
  "amp/udfs": "udfs.md",
  "amp/schemas/evm-rpc": "schemas/evm-rpc.md",
  "amp/schemas/firehose-evm": "schemas/firehose-evm.md",
  "amp/schemas/eth-beacon": "schemas/eth-beacon.md",
  "amp/manifest-schemas": "manifest-schemas/README.md",
  "amp/reorgs": "reorgs.md",
} as const;

export type AmpDocId = keyof typeof ampDocs;

export const fetchAmpDocumentation = (docId: AmpDocId) => {
  const relPath = ampDocs[docId];
  if (!relPath) {
    return Effect.succeed(`Error: Unknown documentation ID: ${docId}`);
  }

  const fullPath = join(docsDir, relPath);

  return pipe(
    FileSystem.FileSystem,
    Effect.flatMap((fs) => fs.readFileString(fullPath)),
    Effect.catchAll((error) =>
      Effect.succeed(
        `Error reading documentation for ${docId}: ${String(error)}`
      )
    ),
    Effect.provide(NodeFileSystem.layer)
  );
};

export const fetchAllAmpDocumentation = () => {
  const allDocIds = Object.keys(ampDocs) as AmpDocId[];

  return pipe(
    Effect.all(
      allDocIds.map((docId) =>
        Effect.map(
          fetchAmpDocumentation(docId),
          (content) => `# ${docId}\n\n${content}`
        )
      ),
      { concurrency: "unbounded" }
    ),
    Effect.map((docsArray) => docsArray.join("\n\n---\n\n")),
    Effect.catchAll((error) =>
      Effect.succeed(`Error reading all documentation: ${String(error)}`)
    )
  );
};
