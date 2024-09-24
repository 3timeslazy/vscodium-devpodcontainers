import vscode from 'vscode';
import { installCLI } from "./devpod/bin";

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
			const path = await vscode.window.showInputBox({
				title: "Installation path",
				value: "~/.local/bin",
				prompt: "The installation path must be included into $PATH env"
			});
			if (!path) {
				vscode.window.showInformationMessage("Installation cancelled.");
				return false;
			}
			
			const outputChan = vscode.window.createOutputChannel("Install DevPod");
			const success = await vscode.window.withProgress(
				{
					title: "Installing devpod",
					location: vscode.ProgressLocation.Notification,
					cancellable: false
				},
				() => { return installCLI(path, outputChan); }
			);
			if (success) {
				vscode.window.showInformationMessage("devpod installed!");
				return true;
			}

			let msg = "Unable to install devpod. " +
				"Follow " +
				"[installation guide](https://devpod.sh/docs/getting-started/install#optional-install-devpod-cli) " +
				"to install in manually"
			vscode.window.showErrorMessage(msg);
			outputChan.show(true);
			return false;
		}

		case explain: {
			const msg = `
			DevPod Containers extension uses DevPod CLI for bootstraping dev containers.
			DevPod implements devcontainers specification, setups SSH and a does lots more.Without them this extension wouldn't exists.
			It is free software created by Loft Labs which source code can be found here: https://github.com/loft-sh/devpod
			`;
			vscode.window.showInformationMessage(msg);
			return false;
		}

		default:
			return false;
	}
}
