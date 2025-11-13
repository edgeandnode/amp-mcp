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
      "",
      "Tools:",
      "- amp-documentation: fetch concatenated docs text for selected documentation sections",
      "- amp-doc-links: list URIs to open via resources/read",
    ].join("\n"),
  }
);

const toId = (doc: string) => doc.replace(/\//g, "-");
const fromId = (id: string) =>
  (ampDocSections.find(
    (d) => toId(d) === id
  ) as (typeof ampDocSections)[number]) ?? "amp";

server.resource(
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
  server.resource(
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

server.tool(
  "amp-documentation",
  "Fetches and concatenates the Amp documentation for the specified sections.",
  {
    sections: z
      .array(z.string())
      .describe(
        "List of Amp documentation sections. E.g. amp, amp/config, amp/udfs, amp/schemas/evm-rpc"
      ),
  },
  async ({ sections }: { sections: string[] }) =>
    Effect.runPromise(
      Effect.map(
        Effect.all(
          sections.map((section) =>
            fetchAmpDocumentation(section as AmpDocId)
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

server.tool(
  "amp-all-documentation",
  "Fetches all Amp documentation at once.",
  {},
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

server.tool(
  "amp-doc-links",
  "Returns resource links for the specified documentation sections so the client can load only what's needed.",
  {
    sections: z
      .array(z.string())
      .describe(
        "Amp documentation sections to reference. E.g. amp, amp/config, amp/udfs"
      ),
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

const transport = new StdioServerTransport();
await server.connect(transport);
