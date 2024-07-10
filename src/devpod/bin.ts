import vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export async function installDevpod() {
	const install = { title: 'Install' };
	const explain = { title: "Explain me what it is" };
	const answer = await vscode.window.showInformationMessage(
		'"devpod" executable is not found. Would you like to install it?',
		install,
		explain,
	);

	switch (answer) {
		case install: {
			vscode.window.showErrorMessage('TODO: not implemented');
			break;
		}

		case explain: {
			const msg = `
			PodContainers extension uses DevPod CLI for bootstraping dev containers.
			DevPod implements devcontainers specification, setups SSH and a does lots more.Without them this extension wouldn't exists.
			It is free software created by Loft Labs which source code can be found here: https://github.com/loft-sh/devpod
			`;
			vscode.window.showInformationMessage(msg);
			break;
		}
	}
}

export function devpodBinExists(): boolean {
	const envPath = process.env['PATH'] || '';
	const paths = envPath?.split(path.delimiter);
	let s = '';
	for (const p of paths) {
		const binpath = path.join(p, 'devpod');
		if (executableFileExists(binpath)) {
			return true;
		}
	}
	return false;
}

function executableFileExists(filePath: string): boolean {
	let exists = true;
	try {
		exists = fs.statSync(filePath).isFile();
		if (exists) {
			fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK);
		}
	} catch (e) {
		exists = false;
	}
	return exists;
}