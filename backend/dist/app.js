"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security headers & middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.ENV.CORS_ORIGIN,
        credentials: true,
    }));
    // Body parsers
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Logging
    if (env_1.ENV.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Global rate limiter
    app.use(rateLimiter_1.apiRateLimiter);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: 'college-shared-cab-backend',
            version: '1.0.0',
        });
    });
    // Swagger OpenAPI Docs
    const swaggerDocument = {
        openapi: '3.0.0',
        info: {
            title: 'College Student Shared Cab & Shuttle Platform API',
            version: '1.0.0',
            description: 'Production-ready REST API for College Cab & Shuttle Platform with Role-Based Access Control (Student, Driver, Admin), Concurrency-safe Booking, Dynamic Signed QR, and GPS Tracking.',
        },
        servers: [{ url: `http://localhost:${env_1.ENV.PORT}${env_1.ENV.API_PREFIX}`, description: 'Local Development Server' }],
        paths: {
            '/auth/login': {
                post: {
                    summary: 'User Login',
                    description: 'Login with email/phone and password for Student, Driver, or Admin',
                },
            },
            '/auth/register': {
                post: {
                    summary: 'Register Student Account',
                },
            },
            '/bookings': {
                post: {
                    summary: 'Book Ride',
                    description: 'Concurrency-safe ride booking with seat locks',
                },
            },
            '/qr/driver/verify-scan': {
                post: {
                    summary: 'Verify Dynamic QR Scan',
                    description: 'Driver verifies passenger pass and boards student with anti-replay protection',
                },
            },
            '/trips/location': {
                post: {
                    summary: 'Broadcast Live GPS Coordinates',
                },
            },
            '/admin/dashboard-stats': {
                get: {
                    summary: 'Get Admin Analytics Dashboard Stats',
                },
            },
        },
    };
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
    // Mount API v1 Routes
    app.use(env_1.ENV.API_PREFIX, routes_1.default);
    // 404 Handler for undefined routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
            data: null,
            error: { code: 'ROUTE_NOT_FOUND' },
        });
    });
    // Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map