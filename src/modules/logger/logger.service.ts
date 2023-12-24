import { Injectable, Logger as NestLogger } from '@nestjs/common';
import * as LogDNATransport from 'logdna-winston';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private readonly nestLogger: NestLogger;
  private readonly logger: winston.Logger;
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.nestLogger = new NestLogger(serviceName);
    this.logger = winston.createLogger({
      level: 'info', // Set your log level here
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new LogDNATransport({
          key: process.env.LOGDNA_API_KEY ?? '916273442780e9676ec2bf457fb7f49e', // Access environment variables directly
          app: process.env.LOGDNA_APP_NAME, // Access environment variables directly
          env: process.env.LOGDNA_ENV, // Access environment variables directly
        }),
        // console log
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(...args: any[]) {
    const message = args.map((arg) => this.stringify(arg)).join(' ');
    this.logger.info(`[${this.serviceName}] ${message}`);
  }

  error(...args: any[]) {
    const message = args.map((arg) => this.stringify(arg)).join(' ');
    this.logger.error(`[${this.serviceName}] ${message}`);
  }

  warn(...args: any[]) {
    const message = args.map((arg) => this.stringify(arg)).join(' ');
    this.logger.warn(`[${this.serviceName}] ${message}`);
  }

  debug(...args: any[]) {
    const message = args.map((arg) => this.stringify(arg)).join(' ');
    this.logger.debug(`[${this.serviceName}] ${message}`);
  }

  private stringify(arg: any): string {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (error) {
        return arg.toString(); // Fallback to string representation if JSON.stringify fails
      }
    }
    return arg.toString();
  }
}
