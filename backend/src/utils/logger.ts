import winston from "winston";
import { env } from "../config/env";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf((info) => {
    const { timestamp: ts, level, message, stack } = info;
    return `${ts} ${level}: ${stack ?? message}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.nodeEnv === "development" ? "debug" : "info",
  format: env.nodeEnv === "development" ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
});
