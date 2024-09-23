import vscode from 'vscode';
import { installCLI } from "./devpod/bin";

const outputChan = vscode.window.createOutputChannel("Install DevPod");

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
			const success = await vscode.window.withProgress(
				{
					title: "Installing devpod",
					location: vscode.ProgressLocation.Notification,
					cancellable: false
				},
				() => { return installCLI(outputChan); }
			);
			if (success) {
				vscode.window.showInformationMessage("devpod installed!");
				break;
			}

			let msg = "Failed to install devpod.\n";
			msg += "Please, install it manually. ";
			msg += "[Installation guide](https://devpod.sh/docs/getting-started/install#optional-install-devpod-cli)";
			vscode.window.showErrorMessage(msg);
			outputChan.show(true);
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
