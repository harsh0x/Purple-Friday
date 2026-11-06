import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "token",
      "*.token",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
      "email",
      "*.email",
      "phone",
      "*.phone",
      "gstin",
      "*.gstin",
      "req.headers.cookie",
      "req.headers.authorization",
    ],
    remove: true,
  },
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

