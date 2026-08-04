import { createLogger, format, transports, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import os from "os";

interface CustomLogInfo {
  timestamp: string;
  level: string;
  pid: number;
  hostname: string;
  message: string;
  error_stack?: object;
  trace_details?: object;
}
const customJsonFormat = format.printf(
  ({ level, message, timestamp, stack, error, ...metadata }) => {
    const customPayload: CustomLogInfo = {
      timestamp: timestamp as string,
      level: level as string,
      pid: process.pid,
      hostname: os.hostname(),
      message: message as string,
    };
    if (metadata && Object.keys(metadata).length > 0) {
      customPayload["trace_details"] = metadata;
    }
    if (stack) {
      customPayload["error_stack"] = stack;
    }

    return JSON.stringify(customPayload);
  },
);

// Define the log format with timestamp, error stack, and custom JSON structure
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SS Z" }),
  format.errors({ stack: true }),
  customJsonFormat,
);

// Define the configuration for the daily rotating log file structure
const dailyRotateTransport: DailyRotateFile = new DailyRotateFile({
  filename: "logs/application-%DATE%.log", // File name including the date variable
  datePattern: "YYYY-MM-DD",
  zippedArchive: true, // Compress old log files into .gz format
  maxSize: "20m", // Automatically rotate to a new file if the current file exceeds 20MB
  maxFiles: "14d", // Automatically delete old files older than 14 days
  level: process.env.LOG_LEVEL || "info",
});

// Define the configuration for the error log file structure
const errorRotateTransport: DailyRotateFile = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d", // Automatically delete error log files older than 30 days
  level: "error",
});

// Initialize the main logger entity
const logger: Logger = createLogger({
  format: logFormat,
  transports: [dailyRotateTransport, errorRotateTransport],
});

export default logger;
