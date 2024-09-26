import { readFileSync } from "fs";
import * as jsonc from "jsonc-parser";
// import { z } from "zod";

type DevContainerConfig = {
  customizations?: {
    vscode?: {
      settings?: Record<string, any>,
      extensions?: string[];
    };
    vscodium?: {
      settings?: Record<string, any>,
      registries?: Record<string, Registry>;
      extensions?: Record<string, Omit<Extension, "id">>;
    };
  };
};

type Registry = {
  url: string;
  headers: Record<string, string>;
};

export type Customizations = {
  settings?: Record<string, any>,
  registries: Record<string, Registry>;
  extensions: Extension[];
};

export type Extension = {
  id: string;
  registry?: string;
  version?: string;
};

export function parseCustomizations(path: string): Customizations {
  const specFile = readFileSync(path, { encoding: "utf-8" });
  // TODO: validate the spec
  const spec = jsonc.parse(specFile) as DevContainerConfig;

  const codium = spec.customizations?.vscodium?.extensions;
  const vscode = spec.customizations?.vscode?.extensions;
  if (codium) {
    return {
      extensions: Object.entries(codium).map(([id, ext]) => ({ id, ...ext })),
      registries: spec.customizations?.vscodium?.registries || {},
    };
  }
  if (vscode) {
    return {
      // TODO: check extensions for their presence in openvsx?
      extensions: vscode.map(id => ({ id })),
      registries: {},
    };
  }

  return { extensions: [], registries: {} };
}

export function parseDevcontainerStr(file: string): Customizations | jsonc.ParseError[] {
  const parseErrors: jsonc.ParseError[] = [];
  const spec = jsonc.parse(file, parseErrors, { allowTrailingComma: true }) as DevContainerConfig;
  if (parseErrors.length > 0) {
    return parseErrors;
  }

  let customizations: Customizations = {
    settings: {},
    extensions: [],
    registries: {},
  };
  const codium = spec.customizations?.vscodium;
  const vscode = spec.customizations?.vscode;
  if (codium) {
    if (codium.extensions)
      customizations.extensions = Object.entries(codium.extensions).map(([id, ext]) => ({ id, ...ext }))
    customizations.registries = codium.registries || {};
    customizations.settings = codium.settings;
  }
  if (vscode) {
    // TODO: check extensions for their presence in openvsx?
    customizations.extensions = vscode.extensions ? vscode.extensions.map(id => ({ id })) : [];
    customizations.settings = vscode.settings;
  }

  return customizations;
}

