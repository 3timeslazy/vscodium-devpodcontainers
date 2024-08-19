import { readFileSync } from 'fs';
import * as jsonc from 'jsonc-parser';

type DevContainerConfig = {
	customizations?: {
		vscode?: {
			extensions?: string[]
		}
		vscodium?: {
			extensions?: Record<string, Omit<Extension, 'id'>>;
		}
	}
};

type Customizations = {
	extensions: Extension[]
};

export type Extension = {
	id: string
	registry?: 'microsoft'
	version?: string
};

export function parseCustomizations(path: string): Customizations {
    const specFile = readFileSync(path, { encoding: 'utf-8' });
	const spec = jsonc.parse(specFile) as DevContainerConfig;
    
	const codium = spec.customizations?.vscodium?.extensions;
	const vscode = spec.customizations?.vscode?.extensions;
	if (codium) {
		return {
			extensions: Object.entries(codium).map(([id, ext]) => ({id, ...ext})),
		};
	}
	if (vscode) {
		return {
			// TODO: check extensions for their presence in openvsx?
			extensions: vscode.map((id) => ({id}))
		};
	}

	return { extensions: [] };
}
