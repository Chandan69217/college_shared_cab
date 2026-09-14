import { createApp } from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(ENV.PORT, '0.0.0.0', () => {
  logger.info(`🚀 College Shared Cab Backend running on port ${ENV.PORT} (0.0.0.0)`);
  logger.info(`📚 API Docs available at http://localhost:${ENV.PORT}/api/docs`);
  logger.info(`✨ Environment: ${ENV.NODE_ENV}`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully terminating after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
