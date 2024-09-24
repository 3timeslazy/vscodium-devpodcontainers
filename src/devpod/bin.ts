import vscode from 'vscode';
import which from 'which';
import { spawn } from "child_process";

export async function installCLI(path: string, outputChannel: vscode.OutputChannel) {
	return new Promise(resolve => {
		const installScript = generateBashInstallScript(path);
		const proc = spawn('bash', ['-c', installScript]);
		proc.stdout.on('data', data => {
			outputChannel.append(data.toString());
		});
		proc.stderr.on('data', data => {
			outputChannel.append(data.toString());
		});
		proc.on('exit', code => {
			resolve(code === 0);
		});
	});
}

function generateBashInstallScript(cliPath: string) {
	return `
PLATFORM=
SERVER_ARCH=

KERNEL="$(uname -s)"
case $KERNEL in
    Linux)
        PLATFORM="linux"
        ;;
    *)
    	echo "Automatic installation is not supported for the platform: $KERNEL. Please, install in manually"
    	exit 1
    	;;
esac

ARCH="$(uname -m)"
case $ARCH in
    x86_64 | amd64)
        SERVER_ARCH="amd64"
        ;;
    arm64 | aarch64)
        SERVER_ARCH="arm64"
        ;;
    *)
        echo "Automatic installation is not supported for the architecture: $KERNEL. Please, install in manually"
        exit 1
        ;;
esac

echo "Downloading devpod binary"
curl --location --silent --fail --show-error --output devpod "https://github.com/loft-sh/devpod/releases/latest/download/devpod-$PLATFORM-$SERVER_ARCH"
if (( $? > 0 )); then
    echo "Failed to download devpod binary"
    exit 1
fi

echo "Installing devpod into ${cliPath}"
install -c -m 0755 devpod ${cliPath} && rm -f devpod
if (( $? > 0 )); then
    echo "Failed to install devpod"
    exit 1
fi

echo "Done"
`;
}

export function cliExists(): boolean {
	return which.sync('devpod', { nothrow: true }) !== null;
}