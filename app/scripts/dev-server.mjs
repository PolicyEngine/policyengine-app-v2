import { spawn } from 'child_process';
import net from 'net';

/**
 * Try to connect to a port on a specific host
 * @param {number} port
 * @param {string} host
 * @returns {Promise<boolean>} true if connection succeeded (port in use)
 */
function tryConnect(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1000);

    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true); // Connected - port is in use
    });

    socket.once('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false); // Connection failed - port might be available
    });

    socket.connect(port, host);
  });
}

/**
 * Check if a port is available by trying to connect on both IPv4 and IPv6
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function isPortAvailable(port) {
  // Try both IPv4 and IPv6 - if either connects, port is in use
  const [ipv4InUse, ipv6InUse] = await Promise.all([
    tryConnect(port, '127.0.0.1'),
    tryConnect(port, '::1'),
  ]);
  return !ipv4InUse && !ipv6InUse;
}

/**
 * Find an available port starting from `start`
 * @param {number} start
 * @returns {Promise<number>}
 */
async function findAvailablePort(start) {
  let port = start;
  while (port < start + 100) {
    const available = await isPortAvailable(port);
    if (available) return port;
    port++;
  }
  throw new Error(`No available port found in range ${start}-${start + 99}`);
}

async function main() {
  // Find two available ports
  const websitePort = await findAvailablePort(3000);
  const calculatorPort = await findAvailablePort(websitePort + 1);

  console.log(`\n  Dev servers: Website :${websitePort}, Calculator :${calculatorPort}\n`);

  // Start both servers with discovered ports
  const env = {
    ...process.env,
    WEBSITE_PORT: String(websitePort),
    CALCULATOR_PORT: String(calculatorPort),
  };

  // Use a single command string for proper shell parsing
  const command = `npx concurrently --names website,calc --prefix-colors blue,green "npm run dev:website" "npm run dev:calculator"`;

  const child = spawn(command, [], { env, stdio: 'inherit', shell: true });

  child.on('error', (err) => {
    console.error('Failed to start dev servers:', err);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
