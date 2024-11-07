import * as vscode from "vscode";
import { spawn, spawnSync } from "child_process";
import { buildDevPodCommand } from "./bin";

export async function upDevpod(args: {
  configPath: string;
  workspaceFolder: string;
  recreate: boolean;
}) {
  const cliOutput = vscode.window.createOutputChannel("devpod up");
  cliOutput.show();

  return new Promise<void>((resolve, reject) => {
    // prettier-ignore
    const cmdArgs = [
      'up',
      '--devcontainer-path', args.configPath,
      '--log-output', 'raw',
      '--ide', 'none',
      args.workspaceFolder,
    ];
    if (args.recreate) {
      cmdArgs.push("--recreate");
    }

    let devPodCommand = buildDevPodCommand(cmdArgs);

    const cp = spawn(devPodCommand.command, devPodCommand.args);
    cp.stdout.on("data", data => {
      cliOutput.append(data.toString());
    });
    cp.stderr.on("data", data => {
      cliOutput.append(data.toString());
    });
    cp.on("close", code => {
      if (code !== 0) {
        vscode.window.showErrorMessage("Failed to build the devpod.");
        return reject("Failed to build the devpod.");
      }

      return resolve();
    });
  });
}

type Devpod = {
  id: string;
  source: {
    localFolder: string;
  };
};

export async function listDevpods() {
  let devPodCommand = buildDevPodCommand(["list", "--output", "json"]);

  return new Promise<Devpod[]>((resolve, reject) => {
    const cp = spawn(devPodCommand.command, devPodCommand.args);
    let stdout = "";
    cp.stdout.on("data", data => {
      stdout += data;
    });
    cp.on("close", code => {
      if (code !== 0) {
        vscode.window.showErrorMessage("Failed to list devpod.");
        return reject("Failed to list devpod.");
      }

      return resolve(JSON.parse(stdout) as Devpod[]);
    });
  });
}

// a dirty hack until I find a better solution.
export function findWorkDir(devpodHost: string) {
  const output = spawnSync("ssh", [devpodHost, "--", "pwd"]);
  if (output.stdout) {
    return output.stdout.toString("utf-8").trim();
  }

  return null;
}
