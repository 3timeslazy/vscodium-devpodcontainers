import vscode from "vscode";

export async function installDevpod() {
  const install = { title: "Open installation guide" };
  const explain = { title: "What is devpod?" };
  const answer = await vscode.window.showInformationMessage(
    '"devpod" executable is not found. Please, install it',
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
			DevPod Containers extension uses DevPod CLI for bootstraping dev containers.
			DevPod implements devcontainers specification, setups SSH and a does lots more.
			Without them this extension wouldn't exist.
			It is free software created by Loft Labs.
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
