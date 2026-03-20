/**
 * Dev server for the Next.js website + Vite calculator.
 *
 * Discovers available ports dynamically, then starts both servers
 * with cross-app URLs injected as environment variables.
 * This matches the pattern from app/scripts/dev-server.mjs.
 */

import { spawn } from "child_process";
import net from "net";

function tryConnect(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function isPortAvailable(port) {
  const [ipv4InUse, ipv6InUse] = await Promise.all([
    tryConnect(port, "127.0.0.1"),
    tryConnect(port, "::1"),
  ]);
  return !ipv4InUse && !ipv6InUse;
}

async function findAvailablePort(start) {
  let port = start;
  while (port < start + 100) {
    if (await isPortAvailable(port)) return port;
    port++;
  }
  throw new Error(`No available port found in range ${start}-${start + 99}`);
}

async function main() {
  const websitePort = await findAvailablePort(3000);
  const calculatorPort = await findAvailablePort(websitePort + 1);

  console.log(
    `\n  Dev servers: Website :${websitePort}, Calculator :${calculatorPort}\n`,
  );

  const env = {
    ...process.env,
    // Next.js website env
    NEXT_PUBLIC_CALCULATOR_URL: `http://localhost:${calculatorPort}`,
    PORT: String(websitePort),
    // Vite calculator env
    WEBSITE_PORT: String(websitePort),
    CALCULATOR_PORT: String(calculatorPort),
  };

  const command = `npx concurrently --names website,calc --prefix-colors blue,green "cd website && bun run dev" "cd app && VITE_APP_MODE=calculator npx vite --port ${calculatorPort}"`;

  const child = spawn(command, [], {
    env,
    stdio: "inherit",
    shell: true,
    cwd: process.cwd().endsWith("/website")
      ? process.cwd().replace(/\/website$/, "")
      : process.cwd(),
  });

  child.on("error", (err) => {
    console.error("Failed to start dev servers:", err);
    process.exit(1);
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
