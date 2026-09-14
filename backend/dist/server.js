"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.ENV.PORT, () => {
    logger_1.logger.info(`🚀 College Shared Cab Backend running on port ${env_1.ENV.PORT}`);
    logger_1.logger.info(`📚 API Docs available at http://localhost:${env_1.ENV.PORT}/api/docs`);
    logger_1.logger.info(`✨ Environment: ${env_1.ENV.NODE_ENV}`);
});
// Graceful shutdown handling
const shutdown = (signal) => {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger_1.logger.info('HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Forcefully terminating after timeout.');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
//# sourceMappingURL=server.js.map