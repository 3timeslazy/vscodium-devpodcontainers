import vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import which from 'which';

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
			vscode.window.showErrorMessage('Sorry, but that buttun is not yet implemented.\nPlease, install devpod manually. The instuction can be found here: https://devpod.sh/docs/getting-started/install');
			break;
		}

		case explain: {
			const msg = `
			DevPod Containers extension uses DevPod CLI for bootstraping dev containers.
			DevPod implements devcontainers specification, setups SSH and a does lots more.Without them this extension wouldn't exists.
			It is free software created by Loft Labs which source code can be found here: https://github.com/loft-sh/devpod
			`;
			vscode.window.showInformationMessage(msg);
			break;
		}
	}
}

export function devpodBinExists(): boolean {
	return which.sync('devpod', { nothrow: true }) !== null;
}