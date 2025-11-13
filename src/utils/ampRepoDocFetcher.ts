import { Effect, pipe } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");
const ampRepoRoot = join(projectRoot, "../amp");

/**
 * Documentation map for the amp repository docs
 * Maps doc IDs to file paths relative to the amp repo root
 */
const ampRepoDocs = {
  // Main README
  "amp-repo": "README.md",

  // References
  "amp-repo/references/concepts": "src/content/docs/References/concepts.md",
  "amp-repo/references/operational-mode": "src/content/docs/References/operational-mode.md",

  // How-to Guides
  "amp-repo/how-to/single-node": "src/content/docs/How-to Guides/single-node.md",
  "amp-repo/how-to/serverless-mode": "src/content/docs/How-to Guides/serverless-mode.md",
  "amp-repo/how-to/battleship": "src/content/docs/How-to Guides/batteship.md",

  // Quick Starts
  "amp-repo/quick-start/local": "src/content/docs/Quick Starts/quick-start-local.md",
  "amp-repo/quick-start/ampup": "src/content/docs/Quick Starts/quick-start-ampup.md",

  // Main docs index
  "amp-repo/docs": "src/content/docs/docs.md",
} as const;

export type AmpRepoDocId = keyof typeof ampRepoDocs;

/**
 * Fetch a single document from the amp repository
 */
export const fetchAmpRepoDocumentation = (docId: AmpRepoDocId) => {
  const relPath = ampRepoDocs[docId];
  if (!relPath) {
    return Effect.succeed(`Error: Unknown amp repo documentation ID: ${docId}`);
  }

  const fullPath = join(ampRepoRoot, relPath);

  return pipe(
    FileSystem.FileSystem,
    Effect.flatMap((fs) => fs.readFileString(fullPath)),
    Effect.map((content) => {
      // Strip frontmatter if present (common in Astro docs)
      const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n\n?/, "");
      return withoutFrontmatter;
    }),
    Effect.catchAll((error) =>
      Effect.succeed(
        `Error reading amp repo documentation for ${docId}: ${String(error)}`
      )
    ),
    Effect.provide(NodeFileSystem.layer)
  );
};

/**
 * Fetch all documentation from the amp repository
 */
export const fetchAllAmpRepoDocumentation = () => {
  const allDocIds = Object.keys(ampRepoDocs) as AmpRepoDocId[];

  return pipe(
    Effect.all(
      allDocIds.map((docId) =>
        Effect.map(
          fetchAmpRepoDocumentation(docId),
          (content) => `# ${docId}\n\n${content}`
        )
      ),
      { concurrency: "unbounded" }
    ),
    Effect.map((docsArray) => docsArray.join("\n\n---\n\n")),
    Effect.catchAll((error) =>
      Effect.succeed(
        `Error reading all amp repo documentation: ${String(error)}`
      )
    )
  );
};

/**
 * Get all available amp repo doc IDs
 */
export function getAllAmpRepoDocIds(): AmpRepoDocId[] {
  return Object.keys(ampRepoDocs) as AmpRepoDocId[];
}

/**
 * Get display name for a doc ID
 */
export function getDocDisplayName(docId: AmpRepoDocId): string {
  const names: Record<AmpRepoDocId, string> = {
    "amp-repo": "Amp Main README",
    "amp-repo/references/concepts": "Core Concepts",
    "amp-repo/references/operational-mode": "Operational Mode",
    "amp-repo/how-to/single-node": "Single Node Setup",
    "amp-repo/how-to/serverless-mode": "Serverless Mode",
    "amp-repo/how-to/battleship": "Battleship Deployment",
    "amp-repo/quick-start/local": "Local Quick Start",
    "amp-repo/quick-start/ampup": "Ampup Quick Start",
    "amp-repo/docs": "Documentation Index",
  };
  return names[docId] || docId;
}

/**
 * Get description for a doc ID
 */
export function getDocDescription(docId: AmpRepoDocId): string {
  const descriptions: Record<AmpRepoDocId, string> = {
    "amp-repo": "Main installation and setup guide for Amp",
    "amp-repo/references/concepts": "Technical overview and core concepts of Amp architecture",
    "amp-repo/references/operational-mode": "Understanding Amp's operational modes",
    "amp-repo/how-to/single-node": "Guide to running Amp in single-node development mode",
    "amp-repo/how-to/serverless-mode": "Guide to deploying Amp in serverless mode",
    "amp-repo/how-to/battleship": "Guide to battleship deployment pattern",
    "amp-repo/quick-start/local": "Quick start guide for local development with Docker",
    "amp-repo/quick-start/ampup": "Quick start guide using ampup installer",
    "amp-repo/docs": "Main documentation index and overview",
  };
  return descriptions[docId] || `Documentation for ${docId}`;
}
