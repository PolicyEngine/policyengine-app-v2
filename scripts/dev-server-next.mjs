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

function tryListen(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    const timeout = setTimeout(() => {
      server.close(() => resolve(false));
    }, 1000);

    server.once("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });

    server.once("listening", () => {
      clearTimeout(timeout);
      server.close(() => resolve(true));
    });

    server.listen({
      exclusive: true,
      host,
      port,
    });
  });
}

async function isPortAvailable(port) {
  const [ipv4InUse, ipv6InUse] = await Promise.all([
    tryConnect(port, "127.0.0.1"),
    tryConnect(port, "::1"),
  ]);

  if (ipv4InUse || ipv6InUse) {
    return false;
  }

  return tryListen(port, "127.0.0.1");
}

async function findAvailablePort(start) {
  let port = start;

  while (port < start + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }

    port += 1;
  }

  throw new Error(`No available port found in range ${start}-${start + 99}`);
}

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid port value: ${value}`);
  }

  return parsed;
}

async function main() {
  const requestedWebsitePort = parsePort(process.env.WEBSITE_PORT, 3000);
  const requestedCalculatorPort = parsePort(
    process.env.CALCULATOR_PORT,
    requestedWebsitePort + 1,
  );

  const websitePort = process.env.WEBSITE_PORT
    ? requestedWebsitePort
    : await findAvailablePort(requestedWebsitePort);
  const calculatorPort = process.env.CALCULATOR_PORT
    ? requestedCalculatorPort
    : await findAvailablePort(Math.max(requestedCalculatorPort, websitePort + 1));

  if (websitePort === calculatorPort) {
    throw new Error("Website and calculator ports must be different");
  }

  const websiteUrl = `http://localhost:${websitePort}`;
  const calculatorUrl = `http://localhost:${calculatorPort}`;

  console.log(`\n  Dev servers: Website :${websitePort}, Calculator :${calculatorPort}\n`);

  const env = {
    ...process.env,
    WEBSITE_PORT: String(websitePort),
    CALCULATOR_PORT: String(calculatorPort),
  };

  const command = [
    "npx concurrently",
    "--names website,calculator",
    "--prefix-colors blue,green",
    `"cd website && PORT=${websitePort} NEXT_PUBLIC_CALCULATOR_URL=${calculatorUrl} bun --bun run dev"`,
    `"cd calculator-app && PORT=${calculatorPort} NEXT_PUBLIC_WEBSITE_URL=${websiteUrl} NEXT_PUBLIC_CALCULATOR_URL=${calculatorUrl} bun --bun run dev"`,
  ].join(" ");

  const child = spawn(command, [], {
    cwd: process.cwd(),
    env,
    shell: true,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error("Failed to start Next.js dev servers:", error);
    process.exit(1);
  });

  child.on("close", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
