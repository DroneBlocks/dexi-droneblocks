import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { PassThrough } from "node:stream";

// Flash the flight controller by running the same flash_px4.sh the terminal
// flow uses — no ROS. The script finds the ARK serial port, stops mavlink-router,
// resets the FMU into its bootloader, uploads the firmware, and restarts services.
//
// If the script isn't present (local dev / Docker preview with no drone), we
// stream a simulated run so the UI can be reviewed end-to-end. This mirrors the
// simulation_mode that the old dexi_tools ROS node had.
const FLASH_SCRIPT =
  process.env.DEXI_FLASH_SCRIPT ||
  "/home/dexi/dexi_ws/src/dexi_tools/scripts/flash_px4.sh";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const firmwarePath = String(body?.firmwarePath || "").trim();

  // Basic validation. Args are passed to spawn() as an array (no shell), so the
  // path can't inject shell commands — but we still sanity-check the shape.
  if (!firmwarePath || !firmwarePath.endsWith(".px4")) {
    setResponseStatus(event, 400);
    return { success: false, message: "firmwarePath must be a path ending in .px4" };
  }

  const stream = new PassThrough();
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "X-Accel-Buffering", "no"); // don't let a proxy buffer the stream

  const line = (s: string) => stream.write(s.endsWith("\n") ? s : s + "\n");
  const finish = (success: boolean, exit_code: number, message: string) => {
    line(`RESULT:${JSON.stringify({ success, exit_code, message })}`);
    stream.end();
  };

  const simulate = !existsSync(FLASH_SCRIPT);

  if (simulate) {
    // No flash script on this host — stream a realistic dry run for UI review.
    (async () => {
      line("[SIMULATION] flash script not found on this host — dry run only");
      line(`Flashing firmware: ${firmwarePath}`);
      await sleep(500);
      line("Found flight controller: /dev/serial/by-id/usb-ARK_ARKV6X-if00 (simulated)");
      await sleep(500);
      line("Stopping mavlink-router...");
      await sleep(600);
      line("Resetting FMU into bootloader...");
      await sleep(900);
      line("Uploading firmware...");
      for (let pct = 0; pct <= 100; pct += 20) {
        await sleep(350);
        line(`  ...${pct}%`);
      }
      line("Restarting mavlink-router + logloader...");
      await sleep(500);
      line("✅ Firmware flash completed successfully! (simulation)");
      finish(true, 0, "Firmware flash completed successfully (simulation)");
    })();
    return sendStream(event, stream);
  }

  // Real flash: run the script, stream its stdout/stderr line-by-line.
  line(`Flashing firmware: ${firmwarePath}`);
  const proc = spawn(FLASH_SCRIPT, [firmwarePath], { stdio: ["ignore", "pipe", "pipe"] });

  let carry = "";
  const onData = (chunk: Buffer) => {
    carry += chunk.toString();
    const parts = carry.split("\n");
    carry = parts.pop() ?? "";
    for (const p of parts) if (p) line(p);
  };
  proc.stdout.on("data", onData);
  proc.stderr.on("data", onData);

  proc.on("error", (err) => {
    if (carry) line(carry);
    finish(false, 1, `Failed to start flash: ${err.message}`);
  });
  proc.on("close", (code) => {
    if (carry) line(carry);
    const ok = code === 0;
    finish(
      ok,
      code ?? 1,
      ok ? "Firmware flash completed successfully" : `Firmware flash failed (exit ${code})`,
    );
  });

  return sendStream(event, stream);
});
