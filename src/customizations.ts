import { z } from "zod";
import * as jsonc from "jsonc-parser";
import { readFileSync } from "node:fs";

// Type definitions according to the devcontainer specification

const SpecSettings = z.object({}).catchall(z.any()).default({});
type SpecSettings = z.infer<typeof SpecSettings>;

const VsCodeExtensions = z
  .array(z.string())
  .default([])
  .transform(arr => new Set(arr));
type VsCodeExtensions = z.infer<typeof VsCodeExtensions>;

const CodiumRegistries = z
  .object({})
  .catchall(
    z.object({
      url: z.string().url(),
      headers: z.object({}).catchall(z.string()).default({}),
    }),
  )
  .default({});
type CodiumRegistries = z.infer<typeof CodiumRegistries>;

const CodiumExtension = z.object({
  registry: z.string().optional(),
  version: z.string().optional(),
});
type CodiumExtension = z.infer<typeof CodiumExtension>;

const SpecCustomizations = z.object({
  vscode: z
    .object({
      settings: SpecSettings,
      extensions: VsCodeExtensions,
    })
    .optional(),
  vscodium: z
    .object({
      settings: SpecSettings,
      registries: CodiumRegistries,
      extensions: z.object({}).catchall(CodiumExtension).default({}),
    })
    .optional(),
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

export type Registries = CodiumRegistries;

export type Customizations = {
  settings: Settings;
  registries: CodiumRegistries;
  extensions: Extension[];
};

export function parseCustomizationsFile(path: string) {
  return parseCustomizations(readFileSync(path, { encoding: "utf-8" }));
}

export function parseCustomizations(configContent: string): Customizations | Error {
  let errors: jsonc.ParseError[] = [];
  const parsed = jsonc.parse(configContent, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const err = errors[0];
    const path = jsonc.getLocation(configContent, err.offset).path;
    const msg =
      "Invalid jsonc at '" +
      (path.length ? path.join(".") : "root") +
      "': " +
      jsonc.printParseErrorCode(err.error);
    return new Error(msg);
  }
  const validated = DevContainerConfig.safeParse(parsed);
  if (validated.error) {
    const msg =
      "Invalid configuration at " +
      validated.error.issues[0].path.join(".") +
      ": " +
      validated.error.issues[0].message;
    return new Error(msg);
  }

  const codium = validated.data.customizations.vscodium;
  if (codium) {
    for (const [extId, ext] of Object.entries(codium.extensions)) {
      if (ext.registry && !codium.registries[ext.registry]) {
        return new Error(`Extension "${extId}" refers to unknown "${ext.registry}" registry`);
      }
    }
    return {
      settings: codium.settings,
      registries: codium.registries,
      extensions: Object.entries(codium.extensions).map(([id, ext]) => ({ id, ...ext })),
    };
  }
  const vscode = validated.data.customizations.vscode;
  if (vscode) {
    return {
      settings: vscode.settings,
      registries: {},
      extensions: [...vscode.extensions].map(id => ({ id })),
    };
  }

  return { registries: {}, settings: {}, extensions: [] };
}
