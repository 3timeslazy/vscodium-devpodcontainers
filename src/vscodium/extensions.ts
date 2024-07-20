import * as path from 'path';
import { spawnSync } from 'child_process';

export const DOWNLOAD_EXTENSIONS_DIR = "$HOME/.devpodcontainers/extensions";

const MS_REGISTRY_URL = "https://marketplace.visualstudio.com/_apis/public/gallery";

interface Extension {
	id: string,
	version: string,
}

export function downloadRegistryExtensions(devpodHost: string, exts: Extension[]) {
	// TODO: fallback to wget
	let script = `mkdir -p ${DOWNLOAD_EXTENSIONS_DIR}\n`;

	for (const ext of exts) {
		const [publisher, name] = ext.id.split('.', 2);
		const url = path.join(MS_REGISTRY_URL, `publishers/${publisher}/vsextensions/${name}/${ext.version}/vspackage`);
		script += `curl \
			--location --show-error \
			--silent --compressed \
			--output ${DOWNLOAD_EXTENSIONS_DIR}/${ext.id}.vsix \
			${url}\n`;
	}

	// TODO: write output to output channel
	spawnSync('ssh', [devpodHost, '--', 'bash', '-c', `'${script}'`]);
}