import { Extension } from "./spec";
import * as path from 'path';
import { spawnSync } from 'child_process';

export const DOWNLOAD_EXTENSIONS_DIR = "$HOME/.devpodcontainers/extensions";

export async function latestExtVersion(id: string): Promise<string> {
    const resp = await fetch(`${MS_REGISTRY_URL}/extensionquery`, {
        method: "POST",
        body: JSON.stringify({
            filters: [{
                criteria: [{
                    filterType: 7, 
                    value: id,
                }],
                pageNumber: 1
            }],
            flags: 1
        })
    });
    const data = resp.json() as any;

    // TODO: handler wrong response
    return data.results[0].extensions[0].versions[0].version as string;
}

const MS_REGISTRY_URL = "https://marketplace.visualstudio.com/_apis/public/gallery";

export async function downloadExtension(devpodHost: string, ext: Extension) {
    let version = ext.version ? ext.version : await latestExtVersion(ext.id);

	// TODO: fallback to wget
	let script = `mkdir -p ${DOWNLOAD_EXTENSIONS_DIR}\n`;
	const [publisher, name] = ext.id.split('.', 2);
	const url = path.join(MS_REGISTRY_URL, `publishers/${publisher}/vsextensions/${name}/${version}/vspackage`);
	script += `curl \
		--location --show-error \
		--silent --compressed \
		--output ${DOWNLOAD_EXTENSIONS_DIR}/${ext.id}.vsix \
		${url}\n`;

	// TODO: write output to output channel
	spawnSync('ssh', [devpodHost, '--', 'bash', '-c', `'${script}'`]);
}