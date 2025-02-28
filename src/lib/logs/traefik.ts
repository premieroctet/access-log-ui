import { v4 as uuidv4 } from "uuid";
import { ColumnSchema } from "@/app/(home)/schema";

// Define the raw log format type
export interface RawLog {
  ClientAddr: string;
  ClientHost: string;
  ClientPort: string;
  ClientUsername: string;
  DownstreamContentSize: number;
  DownstreamStatus: number;
  Duration: number;
  OriginContentSize: number;
  OriginDuration: number;
  OriginStatus: number;
  Overhead: number;
  RequestAddr: string;
  RequestContentSize: number;
  RequestCount: number;
  RequestHost: string;
  RequestMethod: string;
  RequestPath: string;
  RequestPort: string;
  RequestProtocol: string;
  RequestScheme: string;
  RetryAttempts: number;
  RouterName: string;
  ServiceAddr: string;
  ServiceName: string;
  ServiceURL: string;
  StartLocal: string;
  StartUTC: string;
  entryPointName: string;
  level: string;
  msg: string;
  time: string;
}

/**
 * Determines the level based on the status code
 * @param status HTTP status code
 * @returns 'success', 'warning', or 'error'
 */
function determineLevel(status: number): "success" | "warning" | "error" {
  if (status >= 200 && status < 400) {
    return "success";
  } else if (status >= 400 && status < 500) {
    return "warning";
  } else {
    return "error";
  }
}

/**
 * Parses a raw log into the ColumnSchema format
 * @param logString JSON string of the raw log
 * @returns Parsed log in ColumnSchema format
 */
export function parseLog(logString: string): ColumnSchema {
  // Parse the JSON string
  const rawLog: RawLog = JSON.parse(logString);

  // Determine the level based on status code
  const level = determineLevel(rawLog.DownstreamStatus);

  // Create headers object (simplified)
  const headers: Record<string, string> = {
    protocol: rawLog.RequestProtocol,
    scheme: rawLog.RequestScheme,
  };

  // Convert the raw log to ColumnSchema format
  const parsedLog: ColumnSchema = {
    uuid: uuidv4(),
    method: rawLog.RequestMethod as any, // Type assertion needed as RequestMethod might need validation
    host: rawLog.RequestHost,
    pathname: rawLog.RequestPath,
    level: level,
    latency: Math.round(rawLog.Duration / 1000000), // Convert nanoseconds to milliseconds
    status: rawLog.DownstreamStatus,
    date: new Date(rawLog.StartUTC),
    headers: headers,
    message: rawLog.msg || undefined,
  };

  return parsedLog;
}

/**
 * Parses multiple raw logs into the ColumnSchema format
 * @param logStrings Array of JSON strings of raw logs
 * @returns Array of parsed logs in ColumnSchema format
 */
export function parseLogs(logStrings: string[]): ColumnSchema[] {
  return logStrings.map(parseLog);
}

export async function readLogFile(filePath: string): Promise<string[]> {
  const fs = await import("fs/promises");

  try {
    // Read file contents
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Split into lines and filter out empty lines
    const logLines = fileContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    return logLines;
  } catch (error) {
    console.error("Error reading log file:", error);
    throw error;
  }
}

// Cache to store parsed logs
let cachedLogs: ColumnSchema[] | null = null;

export async function getLogsFromTraefikAccessLog(
  filePath: string
): Promise<ColumnSchema[]> {
  // Return cached logs if available
  if (cachedLogs) {
    console.log("Using cached logs...");
    return cachedLogs;
  }

  console.log("Reading log file...");
  // Read and parse logs if not cached
  const logLines = await readLogFile(filePath);
  cachedLogs = parseLogs(logLines);
  return cachedLogs;
}
