import * as vscode from "vscode";
import { upDevpod, listDevpods, findWorkDir } from "./devpod/commands";
import { devpodBinExists } from "./devpod/bin";
import { installDevpod } from "./devpod";
import { installCodeServer } from "./vscodium/server";
import * as path from "path";
import { DevpodTreeView } from "./treeView";
import { parseCustomizationsFile } from "./customizations";
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
      const devpodId = await vscode.window.showQuickPick(devpods.map(d => d.id).sort(), { placeHolder: "Open workspace container" });
      if (devpodId) {
        redirectToDevpod(devpodId);
      }
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

  const config = await pickConfig(workspace, containerFiles);
  if (!config) {
    return;
  }
  
  const customizations = parseCustomizationsFile(config.fsPath);
  if (customizations instanceof Error) {
    vscode.window.showErrorMessage(customizations.message);
    return;
  }

  await upDevpod({
    configPath: config.path.replace(workspace.uri.path, ""),
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

async function pickConfig(workspace: vscode.WorkspaceFolder, configs: vscode.Uri[]) {
  const picks: Record<string, vscode.Uri> = {};
  configs.forEach(config => {
    const short = config.path.replace(workspace.uri.path, "");
    picks[short] = config;
  })
  const picksLenght = Object.keys(picks).length;
  if (picksLenght === 1) {
    return Object.values(picks)[0];
  }
  if (picksLenght > 1) {
    const options = Object.keys(picks)
      .sort()
      .map(pick => ({
        label: /devcontainer\/(.+)\//.exec(pick)?.[1] as string,
        description: pick,
      }));
    const pick = await vscode.window.showQuickPick(options, { placeHolder: "Select a devcontainer.json file" });
    if (!pick) {
      return;
    }

    return picks[pick.description];
  }

  return;
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
