import * as vscode from "vscode";
import { spawnSync } from "child_process";

// Checks if the DevPod bin exists by running `devpod version` as a child process.
export function devpodBinExists() {
  const devPodCommand = buildDevPodCommand(['version'])
  const cp = spawnSync(devPodCommand.command, devPodCommand.args);
  return !cp.error
}

// Gets the users configured devpod command from their settings.
function getDevPodCommand() {
  return vscode.workspace
    .getConfiguration("remote.devpodcontainers")
    .get<string>("devpodCommand", "devpod");
}

// Construct a devpod command to use with `spawn()` or `spawnSync()`. It will automatically grab the devpod command from the users settings. If the users settings contains spaces (eg. `host-spawn devpod`), it will add everything after the first space into the `args` array.
export function buildDevPodCommand(args: string[] = []) {
  const devPodCommand = getDevPodCommand().split(" ")[0]
  const argArray = [
    ...getDevPodCommand().split(" ").slice(1),
    ...args
  ]
  return {
    command: devPodCommand,
    args: argArray
  }
}
