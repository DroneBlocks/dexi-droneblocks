import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    return stdout.trim();
  } catch (e: any) {
    throw new Error(e.stderr || e.message);
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { action, connection } = body as {
    action: "hotspot" | "wifi";
    connection?: string;
  };

  if (action === "hotspot") {
    // Disconnect current wifi, activate hotspot
    await run("nmcli device disconnect wlan0 2>/dev/null || true");
    await run("nmcli connection up dexi-hotspot");
    return {
      success: true,
      message: "Hotspot activated. Connect to the DEXI hotspot network and navigate to 192.168.4.1",
      ip: "192.168.4.1",
    };
  }

  if (action === "wifi" && connection) {
    // Deactivate hotspot if active, connect to specified network
    await run("nmcli connection down dexi-hotspot 2>/dev/null || true");
    await run(`nmcli connection up "${connection}"`);
    // Give it a moment to get an IP
    await new Promise((r) => setTimeout(r, 2000));
    const ip = await run(
      "nmcli -t -f IP4.ADDRESS connection show --active | grep -v 172.17 | grep -v 192.168.4 | head -1 | cut -d: -f2 | cut -d/ -f1"
    ).catch(() => "");
    return {
      success: true,
      message: `Connected to ${connection}`,
      ip,
    };
  }

  throw createError({ statusCode: 400, message: "Invalid action" });
});
