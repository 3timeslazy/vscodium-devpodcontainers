import * as vscode from 'vscode';
import { upDevpod, listDevpods } from './devpod/commands';
import { devpodBinExists, installDevpod } from './devpod/bin'

// TODO: check devpod binary
// TODO: customisations
// TODO: hosttree for devpods
// TODO: check podman and add podman provider

export async function activate(context: vscode.ExtensionContext) {

	initial();

	const xfn = vscode.commands.registerCommand('vscodium-podcontainers.test', async () => {
		const list = await listDevpods();
		const workspace = vscode.workspace.workspaceFolders?.at(0);
		if (!workspace) {
			vscode.window.showInformationMessage('Not found');
			return;
		}
		const x = list.find((item) => item.source.localFolder === workspace.uri.path);
		vscode.window.showInformationMessage(JSON.stringify({ x: x }));
	});
	context.subscriptions.push(xfn);

	context.subscriptions.push(vscode.commands.registerCommand(
		'vscodium-podcontainers.open',
		() => openContainer(),
	));
}

async function initial() {
	const containerFiles = await vscode.workspace.findFiles(".devcontainer/**/devcontainer.json");
	if (containerFiles.length === 0) {
		return;
	}

	const reopen = { title: 'Reopen in Container' };
	const neverAgain = { title: "Don't Show Again" };
	vscode.window.showInformationMessage(
		'A devcontainers file found. Reopen in a container?',
		reopen,
		neverAgain,
	).then(async (action) => {
		switch (action) {
			case reopen: {
				openContainer();
				break;
			}

			// TODO: implement 'Never Again' button
			case neverAgain:
				vscode.window.showInformationMessage("Sorry, but that button is not yet implemented :)");
				break;
		}
	});
}

async function openContainer() {
	const containerFiles = await vscode.workspace.findFiles(".devcontainer/**/devcontainer.json");
	if (containerFiles.length === 0) {
		vscode.window.showInformationMessage('No devcontainer files found.');
		return;
	}
	if (!devpodBinExists()) {
		await installDevpod();
		// TODO: delete the return once installDevpod is implemented
		return;
	}

	const opened = vscode.window.activeTextEditor?.document?.uri;
	const workspace = opened ?
		vscode.workspace.getWorkspaceFolder(opened) :
		vscode.workspace.workspaceFolders?.at(0);
	if (!workspace) {
		vscode.window.showInformationMessage('No workspace found.');
		return;
	}

	const picks = new Map<string, vscode.Uri>([]);
	containerFiles.forEach(uri => {
		const short = uri.path.replace(workspace.uri.path, '');
		picks.set(short, uri);
	});

	let pick: vscode.Uri | undefined;
	if (picks.size === 1) {
		pick = [...picks.values()][0];
	}
	if (picks.size > 1) {
		pick = await vscode.window.showQuickPick([...picks.keys()]).then(chosen => {
			if (!chosen) {
				return;
			}
			return picks.get(chosen);
		});
	}
	if (!pick) {
		return;
	}

	await upDevpod({
		configPath: pick.path.replace(workspace.uri.path, ''),
		workspaceFolder: workspace.uri.path,
	});

	const devpods = listDevpods();
	// TODO: more then one devpod in the directory.
	const devpod = (await devpods).find((d) => d.source.localFolder === workspace.uri.path);
	if (!devpod) {
		vscode.window.showErrorMessage('Unknown error: no devpod found');
		return;
	}

	const devpodUri = vscode.Uri.from({
		scheme: 'vscode-remote',
		authority: `ssh-remote+vscode@${devpod.id}.devpod`,
		path: `/workspaces/${devpod.id}`,
	});
	vscode.commands.executeCommand('vscode.openFolder', devpodUri);
}

export function deactivate() { }