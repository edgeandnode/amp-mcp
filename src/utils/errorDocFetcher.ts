import { Effect, pipe } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");
const errorDocsPath = join(projectRoot, "docs/admin-api-errors.json");

export interface ErrorVariant {
  name: string;
  errorCode: string;
  httpStatusCode: number;
  statusCodeName: string;
  description: string;
  occursWhen: string[];
}

export interface ErrorEnum {
  enumName: string;
  modulePath: string;
  filePath: string;
  endpoint: string;
  description: string;
  variants: ErrorVariant[];
}

export interface AdminApiErrors {
  generatedAt: string;
  version: string;
  errors: ErrorEnum[];
}

/**
 * Fetches all Admin API error documentation
 */
export const fetchAdminApiErrors = () => {
  return pipe(
    FileSystem.FileSystem,
    Effect.flatMap((fs) => fs.readFileString(errorDocsPath)),
    Effect.flatMap((content) =>
      Effect.try({
        try: () => JSON.parse(content) as AdminApiErrors,
        catch: (error) =>
          new Error(`Failed to parse error docs: ${String(error)}`),
      })
    ),
    Effect.catchAll(() =>
      Effect.succeed({
        generatedAt: new Date().toISOString(),
        version: "1.0.0",
        errors: [],
      } as AdminApiErrors)
    ),
    Effect.provide(NodeFileSystem.layer)
  );
};

/**
 * Searches for errors by error code
 */
export const searchErrorByCode = (errorCode: string) => {
  return pipe(
    fetchAdminApiErrors(),
    Effect.map((errorData) => {
      const results: Array<{
        error: ErrorEnum;
        variant: ErrorVariant;
      }> = [];

      for (const error of errorData.errors) {
        for (const variant of error.variants) {
          if (
            variant.errorCode.toLowerCase() === errorCode.toLowerCase() ||
            variant.errorCode.toLowerCase().includes(errorCode.toLowerCase())
          ) {
            results.push({ error, variant });
          }
        }
      }

      return results;
    })
  );
};

/**
 * Searches for errors by endpoint
 */
export const searchErrorByEndpoint = (endpoint: string) => {
  return pipe(
    fetchAdminApiErrors(),
    Effect.map((errorData) => {
      return errorData.errors.filter((error) =>
        error.endpoint.toLowerCase().includes(endpoint.toLowerCase())
      );
    })
  );
};

/**
 * Formats error information as markdown
 */
export function formatErrorAsMarkdown(
  error: ErrorEnum,
  variant: ErrorVariant
): string {
  const lines: string[] = [];

  lines.push(`# ${variant.errorCode}`);
  lines.push("");
  lines.push(`**HTTP Status:** ${variant.httpStatusCode} (${variant.statusCodeName})`);
  lines.push(`**Endpoint:** ${error.endpoint}`);
  lines.push(`**Module:** ${error.modulePath}`);
  lines.push("");
  lines.push("## Description");
  lines.push("");
  lines.push(variant.description);
  lines.push("");

  if (variant.occursWhen.length > 0) {
    lines.push("## This occurs when:");
    lines.push("");
    variant.occursWhen.forEach((condition) => {
      lines.push(`- ${condition}`);
    });
    lines.push("");
  }

  lines.push("## Error Response Example");
  lines.push("");
  lines.push("```json");
  lines.push("{");
  lines.push(`  "error_code": "${variant.errorCode}",`);
  lines.push(
    `  "error_message": "Detailed error message based on the specific error condition"`
  );
  lines.push("}");
  lines.push("```");

  return lines.join("\n");
}

/**
 * Formats multiple errors for an endpoint
 */
export function formatEndpointErrors(errors: ErrorEnum[]): string {
  if (errors.length === 0) {
    return "No errors found for this endpoint.";
  }

  const lines: string[] = [];

  errors.forEach((error) => {
    lines.push(`## ${error.endpoint}`);
    lines.push("");
    if (error.description) {
      lines.push(error.description);
      lines.push("");
    }

    lines.push("| Error Code | HTTP Status | Description |");
    lines.push("|------------|-------------|-------------|");

    error.variants.forEach((variant) => {
      const desc = variant.description.replace(/\n/g, " ");
      lines.push(
        `| \`${variant.errorCode}\` | ${variant.httpStatusCode} | ${desc} |`
      );
    });

    lines.push("");

    // Add detailed information for each variant
    error.variants.forEach((variant) => {
      lines.push(`### ${variant.errorCode}`);
      lines.push("");
      lines.push(variant.description);
      lines.push("");

      if (variant.occursWhen.length > 0) {
        lines.push("**This occurs when:**");
        variant.occursWhen.forEach((condition) => {
          lines.push(`- ${condition}`);
        });
        lines.push("");
      }
    });

    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}
