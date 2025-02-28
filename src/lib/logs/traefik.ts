import { v4 as uuidv4 } from "uuid";
import { ColumnSchema } from "@/app/(home)/schema";

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
  // Allow for any additional properties with string keys and any values
  [key: string]: any;
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
 * Extracts headers from raw log object
 * Headers are prefixed with 'request_' in the log
 * @param rawLog The raw log object
 * @returns Record of header names and values
 */
function extractHeaders(rawLog: RawLog): Record<string, string> {
  const headers: Record<string, string> = {
    protocol: rawLog.RequestProtocol,
    scheme: rawLog.RequestScheme,
  };

  // Extract all properties that start with 'request_'
  Object.keys(rawLog).forEach((key) => {
    if (key.startsWith("request_")) {
      // Remove the 'request_' prefix and convert to standard header format
      // e.g., 'request_User-Agent' becomes 'User-Agent'
      const headerName = key.substring(8); // 'request_'.length === 8
      headers[headerName] = rawLog[key];
    }
  });

  return headers;
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

  // Extract headers from the raw log
  const headers = extractHeaders(rawLog);

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

export function parseLogs(logStrings: string[]): ColumnSchema[] {
  return logStrings.map(parseLog);
}

export async function readLogFile(filePath: string): Promise<string[]> {
  const fs = await import("fs/promises");

  try {
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
  if (cachedLogs) {
    return cachedLogs;
  }

  const logLines = await readLogFile(filePath);
  cachedLogs = parseLogs(logLines);

  return cachedLogs;
}
