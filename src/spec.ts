import { readFileSync } from "fs";
import * as jsonc from "jsonc-parser";

type DevContainerConfig = {
  customizations?: {
    vscode?: {
      extensions?: string[];
    };
    vscodium?: {
      registries?: Record<string, Registry>;
      extensions?: Record<string, Omit<Extension, "id">>;
    };
  };
};

type Registry = {
  url: string;
  headers: Record<string, string>;
};

type Customizations = {
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
      extensions: vscode.map((id) => ({ id })),
	    registries: {},
    };
  }

  return { extensions: [], registries: {} };
}
