import { readFileSync } from 'fs';
import * as jsonc from 'jsonc-parser';

// TODO: fallback to `vscode` customizations?

type DevContainerConfig = {
	customizations?: {
		vscodium?: {
			extensions?: Record<string, Extension>;
		}
	}
};

export type Extension = {
	// TODO: add openvsx if the extension is going to be released for VS Code.
	registry: 'microsoft',

	// TODO: make optional and fetch the latest version 
	version: string,
};

export function parseDevContainerConfig(path: string): DevContainerConfig {
    const specFile = readFileSync(path, { encoding: 'utf-8' });
	const spec = jsonc.parse(specFile) as DevContainerConfig;
    return spec;
}
