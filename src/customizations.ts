import { z } from "zod";
import * as jsonc from "jsonc-parser";

// Type definitions according to devcontainer specification

const SpecSettings = z.object({}).catchall(z.any()).default({});
type SpecSettings = z.infer<typeof SpecSettings>;

const VsCodeExtensions = z.array(z.string()).default([]);
type VsCodeExtensions = z.infer<typeof VsCodeExtensions>;

// const CodiumRegistry = z.object({
//   url: z.string().url(),
//   headers: z.object({}).catchall(z.string()),
// });
// type CodiumRegistry = z.infer<typeof CodiumRegistry>;

const SpecCustomizations = z.object({
  vscode: z.optional(
    z.object({
      settings: SpecSettings,
      extensions: VsCodeExtensions,
    }),
  ),
});
type SpecCustomizations = z.infer<typeof SpecCustomizations>;

const DevContainerConfig = z.object({
  customizations: SpecCustomizations.default({}),
});
type DevContainerConfig = z.infer<typeof DevContainerConfig>;

// Internal type definitions

export type Settings = SpecSettings;

export type Extension = {
  id: string;
  registry?: string;
  version?: string;
};

export type Customizations = {
  settings: Settings;
  //   registries: Record<string, Registry>;
  extensions: Extension[];
};

const emptyCustomuzations = { settings: {}, extensions: [] };

export function parseCustomizations(configContent: string): Customizations | Error {
  let errors: jsonc.ParseError[] = [];
  const parsed = jsonc.parse(configContent, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    return new Error("devcontainer.json must be a valid jsonc file");
  }
  const validated = DevContainerConfig.safeParse(parsed);
  if (validated.error) {
    const msg = "Invalid configuration at " +
        validated.error.issues[0].path.join(".") + ": " +
        validated.error.issues[0].message;
    return new Error(msg);
  }

  const vscode = validated.data.customizations.vscode;
  if (vscode) {
    return {
      settings: vscode.settings,
      extensions: vscode.extensions.map(id => ({ id: id })),
    };
  }

  return emptyCustomuzations;
}
