// ═══════════════════════════════════════════════════════════════
// Bajaj MCP Server — Winston Logger
// ═══════════════════════════════════════════════════════════════
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase().padEnd(7)} ${message}${metaStr}`;
    })
);

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat,
            ),
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'mcp-server.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'mcp-errors.log'),
            level: 'error',
            maxsize: 10485760,
            maxFiles: 3,
        }),
    ],
});
