import { readFile } from "fs/promises";

// Build identity of the DEXI-OS image this GCS is running on.
//
// Both files are written by the dexi-os image build (provision.sh) and are host
// files, so the container needs them bind-mounted to see them:
//   -v /etc/dexi-version:/etc/dexi-version:ro
//   -v /etc/dexi-platform:/etc/dexi-platform:ro
//
// Either can legitimately be missing: /etc/dexi-version only exists on images
// built after 2026-04-28, /etc/dexi-platform only on v0.21 and later, and
// neither is present when the GCS runs off-drone in dev. Callers get null and
// are expected to say "unknown" rather than guess — a stale hardcoded version
// is what this endpoint exists to get rid of.

async function readEtc(path: string): Promise<string | null> {
  try {
    const value = (await readFile(path, "utf-8")).trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export default defineEventHandler(async () => {
  const [os, platform] = await Promise.all([
    readEtc("/etc/dexi-version"),
    readEtc("/etc/dexi-platform"),
  ]);

  return { os, platform };
});
