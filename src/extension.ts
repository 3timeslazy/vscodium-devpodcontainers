import * as vscode from 'vscode';
import { upDevpod, listDevpods } from './devpod/commands';
import { devpodBinExists, installDevpod } from './devpod/bin';
import { installCodeServer } from './vscodium/server';
import * as path from 'path';
import { DevpodTreeView } from './treeView';
import { parseDevContainerConfig } from './spec';
import { downloadRegistryExtensions, DOWNLOAD_EXTENSIONS_DIR } from './vscodium/extensions';

// TODO: not fail when open vsx in not available
// TODO: check devpod binary
// TODO: check podman and add podman provider

export async function activate(context: vscode.ExtensionContext) {
	const recreate = true;

	initial();

	context.subscriptions.push(vscode.commands.registerCommand(
		'vscodium-devpodcontainers.open',
		() => openContainer(),
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'vscodium-devpodcontainers.recreateAndOpen',
		() => openContainer(recreate),
	));

	const devpodsTreeView = new DevpodTreeView();
	vscode.window.registerTreeDataProvider('devpodcontainers.devpods', devpodsTreeView);
	vscode.commands.registerCommand('vscodium-devpodcontainers.refreshEntry', () => devpodsTreeView.refresh());
}

async function initial() {
	const containerFiles = await vscode.workspace.findFiles(".devcontainer/**/devcontainer.json");
	if (containerFiles.length === 0) {
		return;
	}

	const reopen = { title: 'Reopen in Container' };
	const neverAgain = { title: "Don't Show Again" };
	const action = await vscode.window.showInformationMessage(
		'A devcontainers file found. Reopen in a container?',
		reopen,
		neverAgain,
	);
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
}

async function openContainer(recreate: boolean = false) {
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
		recreate: recreate,
	});

	const devpods = await listDevpods();
	// TODO: more then one devpod in the directory.
	const devpod = devpods.find((d) => d.source.localFolder === workspace.uri.path);
	if (!devpod) {
		vscode.window.showErrorMessage('Unknown error: no devpod found');
		return;
	}
	const devpodHost = `${devpod.id}.devpod`;

	const conf = parseDevContainerConfig(pick.path);
	const exts = conf.customizations?.vscodium?.extensions || [];
	const installExtArgs = [];
	const registryExts = [];
	for (const [id, description] of Object.entries(exts)) {
		if (Object.keys(description).length === 0) {
			installExtArgs.push(id);
		} else {
			installExtArgs.push(path.join(DOWNLOAD_EXTENSIONS_DIR, `${id}.vsix`));
			registryExts.push({
				id: id,
				version: description.version,
			});
		}
	}

	downloadRegistryExtensions(devpodHost, registryExts);

	// Unfortunately, we have to inject the codium server outselves because
	// DevPod does not support it (yet).
	// 
	// TODO: show message to users or log the script's output into the output channel
	await installCodeServer(devpodHost, installExtArgs);

	const devpodUri = vscode.Uri.from({
		scheme: 'vscode-remote',
		authority: `ssh-remote+${devpodHost}`,
		path: `/workspaces/${devpod.id}`,
	});
	vscode.commands.executeCommand('vscode.openFolder', devpodUri);
}

export function deactivate() { }