# DevPod Containers

VSCodium extension for remote development with devcontainers using [DevPod](https://github.com/loft-sh/devpod).

> The extension is written by me and for me, so it lacks many features or may be confusing to use. So, if you find anything confusing or missing feel free to create an issue or a PR.

https://github.com/user-attachments/assets/69f34f33-14e5-4bcd-a96e-8b069e1727ef

## Features

- Works with VS Codium.
- Aware of differen container engines. Will add Podman's `--userns=keep-id` for you.
- Supports alternative extension registries.

## DevContainer Customizations

DevpodContainers extension implements a `customizations` format different from the format of VS Code. 

For comparison, that's how the VS Code format looks like:

```jsonc
{
    "customizations": {
        "vscode": {
            "settings": {
                "go.useLanguageServer": true,
                "go.gopath": "/go"
            },
            "extensions": [
                "golang.Go",
                "connor4312.esbuild-problem-matchers"
            ]
        }
    }
}
```

And that's the extensions's format:

```jsonc
{
    "customizations": {
        "vscodium": {
            // Settings are not yet supported
            //
            // "settings": {
            //    "go.useLanguageServer": true,
            //    "go.gopath": "/go"
            // },

            // Here you can define additional registries, which can later
            // be referred in the "extensions" section.
            // 
            // OpenVSX here is just an example, if you use VS Codium
            // without any product.json modifications, just skip this part.
            // 
            // This part is intended to be of use for enterprises and anyone with their private
            // extensions registry. See: https://github.com/coder/code-marketplace
            "registries": {
                // Registry alias to be used in the "extensions" section.
                "openvsx": {
                    // Registry base url. Must be compatible with OpenVSX API.
                    // See: https://github.com/eclipse/openvsx/wiki/Using-Open-VSX-in-VS-Code
                    "url": "https://open-vsx.org/vscode/gallery",

                    // Random headers you'd like to add to all registry requests.
                    "headers": {
                        "Accept": "application/json"
                    }
                }

                // NOTE: Please, remember that putting Microsoft's Marketplace URL
                // may be prohibited by its Terms of Use.
                // See: https://cdn.vsassets.io/v/M190_20210811.1/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf
            },

            // Extensions configuration
            "extensions": {
                // This extension will be downloaded from your editor's 
                // default registry, which is OpenVSX for VS Codium and
                // Visual Studio Marketplace for VS Code.
                "golang.Go": {},

                // If you wish, you can specify the desired registry and
                // version for the extension.
                "webben.browserslist": {
                    "registry": "openvsx",
                    "version": "11.0.0"
                },
            }
        }
    }
}
```

The key difference between the formats is that the extension gives developers more control and options in dealing with remote extensions. 

## Install

**First step is to enable the extension**. To do so, add the following into `argv.json`

```jsonc
{
    // ...
    "enable-proposed-api": [
        // ...
        "3timeslazy.vscodium-devpodcontainers"
    ]
}
```

which you can find by running the `Preferences: Configure Runtime Arguments` command.

**The last step is to install it.**

The extension is available on [Open VSX Marketplace](https://open-vsx.org/extension/3timeslazy/vscodium-devpodcontainers). Just type "DevPod Containers" in the extension tab and find the extension published by `3timeslazy`.

Alternatively, you can download the .vsix file from either Open VSX or GitHub releases and run

```sh
$ code --install-extension /path/to/vsix
```

## Dependencies

- **devpod** CLI
- **ssh**

## FAQ

### Why not use the Dev Containers from VS Code?

Because Microsoft Devcontainer is a proprietary extension incompatible with VS Codium.

### Why it is not on VS Code Marketplace?

Because Microsoft is a VS Code gatekeeper and won't allow anyone to publish an extension if it uses [Proposed API](https://code.visualstudio.com/api/advanced-topics/using-proposed-api). [Except Microsoft and its "partners"](https://github.com/microsoft/vscode/issues/137744#issuecomment-989889396), of course. 

Meanwhile, these API are the only way to implement an extension like [Open Remote SSH](https://github.com/jeanp413/open-remote-ssh) or Devcontainers.

Microsoft promises to allow everyone to use these API and publish extensions based on them in the future, once these API are "stable". But it's been many years since Microsoft first [published an extension backed by a proposed API](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh). It has also published many other extensions supported by the same API. However, the API is "unstable" and doesn't seem to be going to stabilise anytime soon.
