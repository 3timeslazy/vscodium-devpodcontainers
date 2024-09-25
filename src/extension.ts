import * as vscode from "vscode";
import { upDevpod, listDevpods, findWorkDir } from "./devpod/commands";
import { devpodBinExists } from "./devpod/bin";
import { installDevpod } from "./devpod";
import { installCodeServer } from "./vscodium/server";
import * as path from "path";
import { DevpodTreeView } from "./treeView";
import { parseCustomizations } from "./spec";
import { downloadExtension, DOWNLOAD_EXTENSIONS_DIR } from "./marketplace";

// TODO: not fail when open vsx in not available

export async function activate(context: vscode.ExtensionContext) {
  const recreate = true;

  initial();

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodium-devpodcontainers.open", () => openContainer()),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodium-devpodcontainers.recreateAndOpen", () =>
      openContainer(recreate),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodium-devpodcontainers.list", async () => {
      const devpods = await listDevpods();
      vscode.window.showQuickPick(devpods.map(d => d.id)).then(id => {
        if (id) {
          redirectToDevpod(id);
        }
      });
    }),
  );

  const devpodsTreeView = new DevpodTreeView();
  vscode.window.registerTreeDataProvider("devpodcontainers.devpods", devpodsTreeView);
  vscode.commands.registerCommand("vscodium-devpodcontainers.refreshEntry", () =>
    devpodsTreeView.refresh(),
  );
}

async function initial() {
  const containerFiles = await vscode.workspace.findFiles(".devcontainer/**/devcontainer.json");
  if (containerFiles.length === 0) {
    return;
  }

  const reopen = { title: "Reopen in Container" };
  const neverAgain = { title: "Don't Show Again" };
  const action = await vscode.window.showInformationMessage(
    "A devcontainers file found. Reopen in a container?",
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
    vscode.window.showInformationMessage("No devcontainer files found.");
    return;
  }
  if (!devpodBinExists()) {
    await installDevpod();
    return;
  }

  const opened = vscode.window.activeTextEditor?.document?.uri;
  const workspace =
    opened ? vscode.workspace.getWorkspaceFolder(opened) : vscode.workspace.workspaceFolders?.at(0);
  if (!workspace) {
    vscode.window.showInformationMessage("No workspace found.");
    return;
  }

  const picks = new Map<string, vscode.Uri>([]);
  containerFiles.forEach(uri => {
    const short = uri.path.replace(workspace.uri.path, "");
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
    configPath: pick.path.replace(workspace.uri.path, ""),
    workspaceFolder: workspace.uri.fsPath,
    recreate: recreate,
  });

  const devpods = await listDevpods();
  // TODO: more then one devpod in the directory.
  const devpod = devpods.find(d => d.source.localFolder === workspace.uri.fsPath);
  if (!devpod) {
    vscode.window.showErrorMessage("Unknown error: no devpod found");
    return;
  }
  const devpodHost = `${devpod.id}.devpod`;

  const customizations = parseCustomizations(pick.fsPath);
  const exts = customizations.extensions;
  const installExtArgs = [];
  const registryExts = [];
  for (const ext of exts) {
    // No registry specified, so let vscodium server handle it by
    // providing extension ID.
    if (!ext.registry) {
      installExtArgs.push(ext.id);
    } else {
      installExtArgs.push(path.join(DOWNLOAD_EXTENSIONS_DIR, `${ext.id}.vsix`));
      registryExts.push({
        id: ext.id,
        version: ext.version,
        registryUrl: customizations.registries[ext.registry].url,
        registryHeaders: customizations.registries[ext.registry].headers,
      });
    }
  }
  await Promise.allSettled(
    registryExts.map(ext =>
      downloadExtension({
        devpodHost: devpodHost,
        extId: ext.id,
        extVersion: ext.version,
        registryUrl: ext.registryUrl,
        registryHeaders: ext.registryHeaders,
      }),
    ),
  );

  // Unfortunately, we have to inject the codium server outselves because
  // DevPod does not support it (yet).
  //
  // TODO: show message to users or log the script's output into the output channel
  await installCodeServer(devpodHost, installExtArgs);

  redirectToDevpod(devpod.id);
}

function redirectToDevpod(id: string) {
  const devpodHost = `${id}.devpod`;
  const workdir = findWorkDir(devpodHost);
  if (!workdir) {
    vscode.window.showErrorMessage("Unknown error: couldn't find container's workdir.");
    return;
  }
  const uri = vscode.Uri.from({
    scheme: "vscode-remote",
    authority: `ssh-remote+${devpodHost}`,
    path: workdir,
  });
  vscode.commands.executeCommand("vscode.openFolder", uri);
}

export function deactivate() {}
