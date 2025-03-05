import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Define possible values for random generation
const METHODS = ["GET", "POST", "PUT", "DELETE"];
const PATHS = [
  "/",
  "/api/users",
  "/api/products",
  "/api/orders",
  "/500",
  "/404",
  "/health",
];
const STATUS_CODES = [
  200,
  200,
  200,
  200, // More 200s for realistic distribution
  201,
  400,
  401,
  403,
  404,
  500,
];
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  "curl/7.64.1",
  "PostmanRuntime/7.32.3",
];

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateLatency(): number {
  // Generate random latency between 100ms and 5000ms (in nanoseconds)
  return Math.floor(Math.random() * 4900 + 100) * 1000000;
}

function generateLog() {
  const method = getRandomItem(METHODS);
  const path = getRandomItem(PATHS);
  const status = getRandomItem(STATUS_CODES);
  const duration = generateLatency();
  const now = new Date();
  const userAgent = getRandomItem(USER_AGENTS);

  return {
    ClientAddr: "192.168.156.1:31073",
    ClientHost: "192.168.156.1",
    ClientPort: "31073",
    ClientUsername: "-",
    DownstreamContentSize: 75,
    DownstreamStatus: status,
    Duration: duration,
    OriginContentSize: 75,
    OriginDuration: Math.floor(duration * 0.8), // Origin duration is typically less than total duration
    OriginStatus: status,
    Overhead: Math.floor(duration * 0.2), // Overhead is the difference
    RequestAddr: "nodejs.127.0.0.1.sslip.io",
    RequestContentSize: 0,
    RequestCount: 1,
    RequestHost: "nodejs.127.0.0.1.sslip.io",
    RequestMethod: method,
    RequestPath: path,
    RequestPort: "-",
    RequestProtocol: "HTTP/1.1",
    RequestScheme: "http",
    RetryAttempts: 0,
    RouterName: "http-0-p0o00o0g0cksskkog88so880@docker",
    ServiceAddr: "192.168.156.12:3000",
    ServiceName: "http-0-p0o00o0g0cksskkog88so880@docker",
    ServiceURL: "http://192.168.156.12:3000",
    StartLocal: now.toISOString(),
    StartUTC: now.toISOString(),
    entryPointName: "http",
    level: "info",
    msg: "",
    time: now.toISOString().split(".")[0] + "Z",
    "request_User-Agent": userAgent,
    request_Accept: "*/*",
    "request_Accept-Encoding": "gzip, deflate, br",
  };
}

async function appendLogs(filePath: string, count: number) {
  try {
    // Generate 1 to 3 logs
    const logsToAdd = Math.floor(Math.random() * count) + 1;
    const logs = Array.from({ length: logsToAdd }, () => generateLog());

    // Convert logs to strings with newlines
    const logStrings = logs.map((log) => JSON.stringify(log)).join("\n") + "\n";

    // Append to file
    await fs.appendFile(filePath, logStrings);

    console.log(`${new Date().toISOString()} - Added ${logsToAdd} logs`);
  } catch (error) {
    console.error("Error appending logs:", error);
  }
}

async function ensureLogFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    // File doesn't exist, create directory and empty file
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "");
  }
}

async function main() {
  const logPath = path.join(process.cwd(), "data", "example", "access.log");

  // Ensure log file exists
  await ensureLogFile(logPath);

  // Add logs every 5 seconds
  setInterval(() => appendLogs(logPath, 3), 5000);

  console.log(`Started generating logs at ${logPath}`);
  console.log("Press Ctrl+C to stop");
}

main().catch(console.error);
