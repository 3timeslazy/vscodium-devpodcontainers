import which from "which";

export function devpodBinExists(): boolean {
  return which.sync("devpod", { nothrow: true }) !== null;
}
