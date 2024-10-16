import vscode from "vscode";

export async function installDevpod() {
  const install = { title: "Open installation guide" };
  const explain = { title: "What is devpod?" };
  const answer = await vscode.window.showInformationMessage(
    'DevPod couldn\'t be found on your machine, would you like to install it now?',
    install,
    explain,
  );

  switch (answer) {
    case install: {
      const guide = vscode.Uri.parse(
        "https://devpod.sh/docs/getting-started/install#optional-install-devpod-cli",
      );
      vscode.env.openExternal(guide);
      break;
    }

    case explain: {
      const msg = `
			The DevPod Containers extension uses DevPod for bootstraping devcontainers.
			DevPod implements the devcontainers specification, automatically configures SSH access, and lots more. Without it this extension wouldn't be possible.
			It is free software created by Loft Labs and its source code can be found here: https://github.com/loft-sh/devpod
			`;
      const clicked = await vscode.window.showInformationMessage(msg, { title: "Source code" });
      if (clicked) {
        const uri = vscode.Uri.parse("https://github.com/loft-sh/devpod");
        vscode.env.openExternal(uri);
      }
      break;
    }
  }
}
