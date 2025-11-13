import { Effect } from "effect";
import { z } from "zod";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  fetchAmpDocumentation,
  fetchAllAmpDocumentation,
  type AmpDocId,
} from "./utils/documentationFetcher.js";
import {
  fetchAdminApiErrors,
  searchErrorByCode,
  searchErrorByEndpoint,
} from "./utils/errorDocFetcher.js";
import {
  fetchAmpRepoDocumentation,
  fetchAllAmpRepoDocumentation,
  getAllAmpRepoDocIds,
  getDocDisplayName,
  getDocDescription,
  type AmpRepoDocId,
} from "./utils/ampRepoDocFetcher.js";

const ampDocSections = [
  "amp",
  "amp/getting-started",
  "amp/config",
  "amp/glossary",
  "amp/examples",
  "amp/querying-data",
  "amp/troubleshooting",
  "amp/udfs",
  "amp/schemas/evm-rpc",
  "amp/schemas/firehose-evm",
  "amp/schemas/eth-beacon",
  "amp/manifest-schemas",
  "amp/reorgs",
] as const;

const server = new McpServer(
  {
    name: "amp-mcp",
    version: "1.0.0",
  },
  {
    instructions: [
      "Use @mention or pick resources to include Amp docs as context:",
      "- amp-docs://{docId} (completion supported for docId)",
      "- Examples: amp-docs://amp, amp-docs://amp-config, amp-docs://amp-udfs",
      "- amp-docs://admin-api-errors - Admin API error codes reference",
      "",
      "Documentation Tools:",
      "- amp-documentation: fetch concatenated docs text for selected documentation sections",
      "- amp-doc-links: list URIs to open via resources/read",
      "",
      "Admin API Error Tools:",
      "- admin-api-error-lookup: lookup details for a specific error code",
      "- admin-api-errors-by-endpoint: get all errors for an endpoint",
      "- admin-api-all-errors: get complete error code reference",
      "",
      "Amp Repository Documentation:",
      "- amp-repo-docs://{docId} - Core amp repository documentation",
      "- Examples: amp-repo-docs://amp-repo, amp-repo-docs://amp-repo-references-concepts",
      "- amp-repo-documentation: fetch docs from the amp repository",
    ].join("\n"),
  }
);

const toId = (doc: string) => doc.replace(/\//g, "-");
const fromId = (id: string) =>
  (ampDocSections.find(
    (d) => toId(d) === id
  ) as (typeof ampDocSections)[number]) ?? "amp";

server.registerResource(
  "amp-docs",
  new ResourceTemplate("amp-docs://{docId}", {
    complete: {
      docId: (value: string) =>
        ampDocSections
          .map((d) => toId(d))
          .filter((id) => id.toLowerCase().startsWith(value.toLowerCase())),
    },
    list: async () => ({
      resources: ampDocSections.map((doc) => ({
        uri: `amp-docs://${toId(doc)}`,
        name: doc,
        title: `${doc} Documentation`,
        description: `Documentation for ${doc}`,
        mimeType: "text/markdown",
        annotations: {
          audience: ["assistant", "user"],
          priority: 0.8,
        },
      })),
    }),
  }),
  {
    title: "Amp Docs",
    description:
      "Read the documentation for Amp - a high-performance ETL system for blockchain data.",
  },
  async (uri: URL, variables: Record<string, string | string[]>) => {
    const raw = variables["docId"];
    const docId = Array.isArray(raw)
      ? String(raw[0] ?? "amp")
      : String(raw ?? "amp");
    return Effect.runPromise(
      Effect.map(fetchAmpDocumentation(fromId(docId) as AmpDocId), (text) => ({
        contents: [
          {
            uri: uri.href,
            name: fromId(docId),
            title: `${fromId(docId)} Documentation`,
            mimeType: "text/markdown",
            text,
            annotations: {
              audience: ["assistant", "user"],
              priority: 0.8,
            },
          },
        ],
      }))
    );
  }
);

ampDocSections.forEach((doc) => {
  const displayName = toId(doc);
  server.registerResource(
    displayName,
    `amp-docs://${displayName}`,
    {
      title: `${doc} Docs`,
      description: `Documentation for ${doc}`,
      mimeType: "text/markdown",
      annotations: {
        audience: ["assistant", "user"],
        priority: 0.8,
      },
    },
    async (uri: URL) =>
      Effect.runPromise(
        Effect.map(fetchAmpDocumentation(doc as AmpDocId), (text) => ({
          contents: [
            {
              uri: uri.href,
              name: doc,
              title: `${doc} Documentation`,
              mimeType: "text/markdown",
              text,
              annotations: {
                audience: ["assistant", "user"],
                priority: 0.8,
              },
            },
          ],
        }))
      )
  );
});

server.registerTool(
  "amp-documentation",
  {
    description:
      "Fetches and concatenates the Amp documentation for the specified sections.",
    inputSchema: {
      sections: z
        .array(z.string())
        .describe(
          "List of Amp documentation sections. E.g. amp, amp/config, amp/udfs, amp/schemas/evm-rpc"
        ),
    },
  },
  async ({ sections }: { sections: string[] }) =>
    Effect.runPromise(
      Effect.map(
        Effect.all(
          sections.map((section) => fetchAmpDocumentation(section as AmpDocId))
        ),
        (docsArray: string[]) => ({
          content: [
            {
              type: "text" as const,
              text: docsArray.join("\n\n\n"),
            },
          ],
        })
      )
    )
);

server.registerTool(
  "amp-all-documentation",
  {
    description: "Fetches all Amp documentation at once.",
  },
  async () =>
    Effect.runPromise(
      Effect.map(fetchAllAmpDocumentation(), (text) => ({
        content: [
          {
            type: "text" as const,
            text,
          },
        ],
      }))
    )
);

server.registerTool(
  "amp-doc-links",
  {
    description:
      "Returns resource links for the specified documentation sections so the client can load only what's needed.",
    inputSchema: {
      sections: z
        .array(z.string())
        .describe(
          "Amp documentation sections to reference. E.g. amp, amp/config, amp/udfs"
        ),
    },
  },
  async ({ sections }: { sections: string[] }) => {
    const lines = sections.map((section: string) => {
      const display = toId(section);
      const uri = `amp-docs://${display}`;
      return `- ${section} Documentation -> ${uri}`;
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Resource links (open these URIs via MCP readResource):\n\n${lines.join(
            "\n"
          )}`,
        },
      ],
    };
  }
);

// Admin API Error Documentation Resource
server.resource(
  "admin-api-errors",
  "amp-docs://admin-api-errors",
  {
    title: "Admin API Error Codes",
    description: "Comprehensive error code documentation for the Amp Admin API",
    mimeType: "application/json",
    annotations: {
      audience: ["assistant", "user"],
      priority: 0.9,
    },
  },
  async (uri: URL) =>
    Effect.runPromise(
      Effect.map(fetchAdminApiErrors(), (errorData) => ({
        contents: [
          {
            uri: uri.href,
            name: "admin-api-errors",
            title: "Admin API Error Codes",
            mimeType: "application/json",
            text: JSON.stringify(errorData, null, 2),
            annotations: {
              audience: ["assistant", "user"],
              priority: 0.9,
            },
          },
        ],
      }))
    )
);

// Admin API Error Search Tools
server.registerTool(
  "admin-api-error-lookup",
  {
    description:
      "Lookup detailed information about a specific Admin API error code",
    inputSchema: {
      errorCode: z
        .string()
        .describe(
          "The error code to lookup (e.g., 'DATASET_NOT_FOUND', 'INVALID_MANIFEST')"
        ),
    },
  },
  async ({ errorCode }: { errorCode: string }) => {
    const results = await Effect.runPromise(searchErrorByCode(errorCode));

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No error code found matching: ${errorCode}`,
          },
        ],
      };
    }

    const { formatErrorAsMarkdown } = await import(
      "./utils/errorDocFetcher.js"
    );
    const formatted = results
      .map(({ error, variant }) => formatErrorAsMarkdown(error, variant))
      .join("\n\n---\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: formatted,
        },
      ],
    };
  }
);

server.registerTool(
  "admin-api-errors-by-endpoint",
  {
    description:
      "Get all possible error codes for a specific Admin API endpoint",
    inputSchema: {
      endpoint: z
        .string()
        .describe(
          "The endpoint path (e.g., '/datasets', '/jobs/{id}', '/providers')"
        ),
    },
  },
  async ({ endpoint }: { endpoint: string }) => {
    const results = await Effect.runPromise(searchErrorByEndpoint(endpoint));

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No errors found for endpoint: ${endpoint}`,
          },
        ],
      };
    }

    const { formatEndpointErrors } = await import("./utils/errorDocFetcher.js");
    const formatted = formatEndpointErrors(results);

    return {
      content: [
        {
          type: "text" as const,
          text: formatted,
        },
      ],
    };
  }
);

server.registerTool(
  "admin-api-all-errors",
  {
    description: "Get all Admin API error codes and their documentation",
  },
  async () => {
    const errorData = await Effect.runPromise(fetchAdminApiErrors());

    // Create a summary markdown
    const lines: string[] = [
      "# Admin API Error Codes Reference",
      "",
      `Generated: ${errorData.generatedAt}`,
      "",
      `Total error codes: ${errorData.errors.reduce(
        (sum, e) => sum + e.variants.length,
        0
      )}`,
      "",
      "## Quick Reference",
      "",
      "| Error Code | HTTP Status | Endpoint |",
      "|------------|-------------|----------|",
    ];

    errorData.errors.forEach((error) => {
      error.variants.forEach((variant) => {
        lines.push(
          `| \`${variant.errorCode}\` | ${variant.httpStatusCode} | ${error.endpoint} |`
        );
      });
    });

    lines.push("");
    lines.push(
      "Use `admin-api-error-lookup` with a specific error code for detailed information."
    );
    lines.push(
      "Use `admin-api-errors-by-endpoint` to see all errors for a specific endpoint."
    );

    return {
      content: [
        {
          type: "text" as const,
          text: lines.join("\n"),
        },
      ],
    };
  }
);

// Amp Repository Documentation Resources
const ampRepoDocIds = getAllAmpRepoDocIds();
const toRepoId = (doc: string) => doc.replace(/\//g, "-");
const fromRepoId = (id: string) =>
  (ampRepoDocIds.find((d) => toRepoId(d) === id) as AmpRepoDocId) ?? "amp-repo";

server.resource(
  "amp-repo-docs",
  new ResourceTemplate("amp-repo-docs://{docId}", {
    complete: {
      docId: (value: string) =>
        ampRepoDocIds
          .map((d) => toRepoId(d))
          .filter((id) => id.toLowerCase().startsWith(value.toLowerCase())),
    },
    list: async () => ({
      resources: ampRepoDocIds.map((doc) => ({
        uri: `amp-repo-docs://${toRepoId(doc)}`,
        name: doc,
        title: getDocDisplayName(doc),
        description: getDocDescription(doc),
        mimeType: "text/markdown",
        annotations: {
          audience: ["assistant", "user"],
          priority: 0.7,
        },
      })),
    }),
  }),
  {
    title: "Amp Repository Docs",
    description:
      "Documentation from the amp repository including operational guides and quick starts.",
  },
  async (uri: URL, variables: Record<string, string | string[]>) => {
    const raw = variables["docId"];
    const docId = Array.isArray(raw)
      ? String(raw[0] ?? "amp-repo")
      : String(raw ?? "amp-repo");
    return Effect.runPromise(
      Effect.map(
        fetchAmpRepoDocumentation(fromRepoId(docId) as AmpRepoDocId),
        (text) => ({
          contents: [
            {
              uri: uri.href,
              name: fromRepoId(docId),
              title: getDocDisplayName(fromRepoId(docId) as AmpRepoDocId),
              mimeType: "text/markdown",
              text,
              annotations: {
                audience: ["assistant", "user"],
                priority: 0.7,
              },
            },
          ],
        })
      )
    );
  }
);

// Register individual amp repo doc resources
ampRepoDocIds.forEach((doc) => {
  const displayName = toRepoId(doc);
  server.registerResource(
    `repo-${displayName}`,
    `amp-repo-docs://${displayName}`,
    {
      title: getDocDisplayName(doc),
      description: getDocDescription(doc),
      mimeType: "text/markdown",
      annotations: {
        audience: ["assistant", "user"],
        priority: 0.7,
      },
    },
    async (uri: URL) =>
      Effect.runPromise(
        Effect.map(fetchAmpRepoDocumentation(doc), (text) => ({
          contents: [
            {
              uri: uri.href,
              name: doc,
              title: getDocDisplayName(doc),
              mimeType: "text/markdown",
              text,
              annotations: {
                audience: ["assistant", "user"],
                priority: 0.7,
              },
            },
          ],
        }))
      )
  );
});

// Amp Repo Documentation Tool
server.registerTool(
  "amp-repo-documentation",
  {
    description:
      "Fetches documentation from the amp repository (operational guides, quick starts, and references).",
    inputSchema: {
      docIds: z
        .array(z.string())
        .describe(
          "List of amp repo doc IDs. E.g. amp-repo, amp-repo/references/concepts, amp-repo/quick-start/local"
        ),
    },
  },
  async ({ docIds }: { docIds: string[] }) =>
    Effect.runPromise(
      Effect.map(
        Effect.all(
          docIds.map((docId) =>
            fetchAmpRepoDocumentation(docId as AmpRepoDocId)
          )
        ),
        (docsArray: string[]) => ({
          content: [
            {
              type: "text" as const,
              text: docsArray.join("\n\n\n"),
            },
          ],
        })
      )
    )
);

server.registerTool(
  "amp-repo-all-documentation",
  {
    description: "Fetches all documentation from the amp repository at once.",
  },
  async () =>
    Effect.runPromise(
      Effect.map(fetchAllAmpRepoDocumentation(), (text) => ({
        content: [
          {
            type: "text" as const,
            text,
          },
        ],
      }))
    )
);

const transport = new StdioServerTransport();
await server.connect(transport);
