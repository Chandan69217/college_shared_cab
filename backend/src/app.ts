import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp(): Express {
  const app = express();

  // Security headers & middleware
  app.use(helmet());
  app.use(
    cors({
      origin: ENV.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Global rate limiter
  app.use(apiRateLimiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
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
      description:
        'Production-ready REST API for College Cab & Shuttle Platform with Role-Based Access Control (Student, Driver, Admin), Concurrency-safe Booking, Dynamic Signed QR, and GPS Tracking.',
    },
    servers: [{ url: `http://localhost:${ENV.PORT}${ENV.API_PREFIX}`, description: 'Local Development Server' }],
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

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Mount API v1 Routes
  app.use(ENV.API_PREFIX, apiRoutes);

  // 404 Handler for undefined routes
  app.use((req: Request, res: Response) => {
    const notFoundMessage = `Route not found: ${req.method} ${req.originalUrl}`;
    res.status(404).json({
      success: false,
      message: notFoundMessage,
      data: null,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: notFoundMessage,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
