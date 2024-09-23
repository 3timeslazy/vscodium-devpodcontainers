import * as path from "path";
import { spawnSync } from "child_process";

export const DOWNLOAD_EXTENSIONS_DIR = "$HOME/.devpodcontainers/extensions";

export async function latestExtVersion(
  registryUrl: string,
  headers: Record<string, string>,
  id: string,
): Promise<string | null> {
  const resp = await fetch(`${registryUrl}/extensionquery`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      filters: [
        {
          criteria: [
            {
              filterType: 7,
              value: id,
            },
          ],
          pageNumber: 1,
        },
      ],
      flags: 1,
    }),
  });

  const data = (await resp.json()) as any;
  if (data.results.length == 0 || data.results[0].extensions.length == 0) {
    return null;
  }

  return data.results[0].extensions[0].versions[0].version as string;
}

export async function downloadExtension(args: {
  devpodHost: string;
  extId: string;
  extVersion?: string;
  registryUrl: string;
  registryHeaders: Record<string, string>;
}) {
  let version =
    args.extVersion ?
      args.extVersion
    : await latestExtVersion(args.registryUrl, args.registryHeaders, args.extId);

  // TODO: let users know that that happened.
  if (version === null) {
    return;
  }

  // TODO: fallback to wget
  let script = `mkdir -p ${DOWNLOAD_EXTENSIONS_DIR}\n`;
  const [publisher, name] = args.extId.split(".", 2);
  const url = path.join(
    args.registryUrl,
    `publishers/${publisher}/vsextensions/${name}/${version}/vspackage`,
  );
  script += `curl \
		--location --show-error \
		--silent --compressed \
		--output ${DOWNLOAD_EXTENSIONS_DIR}/${args.extId}.vsix \
		${url}\n`;

  // TODO: write output to output channel
  spawnSync("ssh", [args.devpodHost, "--", "bash", "-c", `'${script}'`]);
}
