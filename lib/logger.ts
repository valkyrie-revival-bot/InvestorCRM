import winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Pretty format for development
const prettyFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Create the Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'sales-crm' },
  transports: [
    // Write all logs to app.log
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add console transport with appropriate format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: prettyFormat,
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

// Export convenience methods
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => {
    logger.error(message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  },
  http: (message: string, meta?: Record<string, unknown>) => {
    logger.http(message, meta);
  },
};

// Export logger instance for advanced usage
export default logger;

// Log startup
logger.info('Logger initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
});
