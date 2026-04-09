import { exec } from "child_process";
import { promisify } from "util";
import { readFile, readdir } from "fs/promises";

const execAsync = promisify(exec);

async function run(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 5000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function readProc(path: string): Promise<string> {
  try {
    return (await readFile(path, "utf-8")).trim();
  } catch {
    return "";
  }
}

interface NetworkInterface {
  name: string;
  type: string;
  ip?: string;
  ssid?: string;
  state: string;
}

interface SavedConnection {
  name: string;
  type: string;
  priority: number;
  active: boolean;
}

function parseMemInfo(raw: string) {
  const lines: Record<string, number> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^(\w+):\s+(\d+)/);
    if (match) lines[match[1]] = parseInt(match[2]);
  }
  const totalMb = Math.round((lines.MemTotal || 0) / 1024);
  const availableMb = Math.round((lines.MemAvailable || 0) / 1024);
  const usedMb = totalMb - availableMb;
  return { totalMb, usedMb, freeMb: availableMb };
}

async function getInterfaceIps(): Promise<Record<string, string>> {
  const ips: Record<string, string> = {};
  const os = await import("os");
  const netInterfaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(netInterfaces)) {
    if (!addrs) continue;
    const ipv4 = addrs.find((a) => a.family === "IPv4" && !a.internal);
    if (ipv4) ips[name] = ipv4.address;
  }
  return ips;
}

// Detect if an ethernet interface is actually a USB cellular dongle
async function isUsbCellular(dev: string): Promise<boolean> {
  // Check if the device is a USB device by reading its device path
  const uevent = await readProc(`/sys/class/net/${dev}/device/uevent`);
  if (uevent.includes("DRIVER=cdc_ether") || uevent.includes("DRIVER=rndis_host")) {
    return true;
  }
  // Also check by USB vendor — common cellular dongle vendors
  const devPath = await run(
    `readlink -f /sys/class/net/${dev}/device 2>/dev/null`
  );
  if (devPath.includes("/usb")) {
    const idVendor = await readProc(`${devPath}/../idVendor`);
    // TCL/Alcatel: 1bbb, Huawei: 12d1, ZTE: 19d2, Quectel: 2c7c, Sierra: 1199
    const cellularVendors = ["1bbb", "12d1", "19d2", "2c7c", "1199"];
    if (cellularVendors.includes(idVendor)) return true;
  }
  return false;
}

async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  const interfaces: NetworkInterface[] = [];
  const ips = await getInterfaceIps();

  let netDevices: string[] = [];
  try {
    netDevices = await readdir("/sys/class/net");
  } catch {
    return interfaces;
  }

  for (const dev of netDevices) {
    if (dev === "lo" || dev.startsWith("veth")) continue;

    const operstate = await readProc(`/sys/class/net/${dev}/operstate`);
    // USB cellular dongles (cdc_ether) report "unknown" operstate — treat as up
    if (operstate !== "up" && operstate !== "unknown") continue;

    let type = "ethernet";
    try {
      await readdir(`/sys/class/net/${dev}/wireless`);
      type = "wifi";
    } catch {
      if (dev.startsWith("wwan") || dev.startsWith("usb")) {
        type = "cellular";
      } else if (dev === "docker0" || dev.startsWith("br-")) {
        type = "bridge";
      } else if (await isUsbCellular(dev)) {
        type = "cellular";
      }
    }

    const iface: NetworkInterface = {
      name: dev,
      type,
      ip: ips[dev],
      state: operstate,
    };

    // Get SSID for wifi interfaces
    if (type === "wifi") {
      const ssid = await run(
        `iw dev ${dev} link 2>/dev/null | awk '/SSID:/ {print $2}'`
      );
      if (ssid) iface.ssid = ssid;
    }

    interfaces.push(iface);
  }

  return interfaces;
}

async function getSavedConnections(): Promise<SavedConnection[]> {
  const raw = await run(
    "nmcli -t -f NAME,TYPE,AUTOCONNECT-PRIORITY,ACTIVE connection show 2>/dev/null"
  );
  if (!raw) return [];

  const connections: SavedConnection[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const [name, type, priority, active] = line.split(":");
    if (!name || !type) continue;
    // Only include wifi connections (client + hotspot)
    if (type !== "802-11-wireless") continue;

    connections.push({
      name,
      type: name === "dexi-hotspot" ? "hotspot" : "wifi",
      priority: parseInt(priority) || 0,
      active: active === "yes",
    });
  }

  // Sort by priority descending
  connections.sort((a, b) => b.priority - a.priority);
  return connections;
}

async function getWifiMode(): Promise<"hotspot" | "client" | "disconnected"> {
  const activeRaw = await run(
    "nmcli -t -f NAME,TYPE connection show --active 2>/dev/null"
  );
  if (activeRaw.includes("dexi-hotspot")) return "hotspot";
  for (const line of activeRaw.split("\n")) {
    if (line.includes("802-11-wireless")) return "client";
  }
  return "disconnected";
}

export default defineEventHandler(async () => {
  const [hostname, uptimeRaw, memRaw, tempRaw, model, interfaces, savedConnections, wifiMode] =
    await Promise.all([
      run("hostname"),
      readProc("/proc/uptime"),
      readProc("/proc/meminfo"),
      readProc("/sys/class/thermal/thermal_zone0/temp"),
      readProc("/etc/device-model").then(v => v || readProc("/proc/device-tree/model")),
      getNetworkInterfaces(),
      getSavedConnections(),
      getWifiMode(),
    ]);

  // Parse uptime from seconds
  let uptime = "";
  if (uptimeRaw) {
    const totalSeconds = Math.floor(parseFloat(uptimeRaw.split(" ")[0]));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    uptime = parts.join(" ");
  }

  const memory = memRaw ? parseMemInfo(memRaw) : null;
  const cpuTempC = tempRaw ? parseInt(tempRaw) / 1000 : null;

  return {
    hostname,
    model: model || null,
    uptime,
    memory,
    cpuTempC,
    interfaces,
    savedConnections,
    wifiMode,
    timestamp: Date.now(),
  };
});
