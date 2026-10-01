import express from 'express';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { UPLOADS_DIR } from './utils/paths';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static directory for assets (including logo.png)
app.use('/assets', express.static(path.join(process.cwd(), 'lostcamp/assets')));
app.use('/lostcamp/assets', express.static(path.join(process.cwd(), 'lostcamp/assets')));

// Static directory for user uploads (review photos, etc.)
app.use('/uploads', express.static(UPLOADS_DIR));

// Forward all API requests to the routes module
app.use('/api', apiRoutes);

// 404 for unhandled API routes
app.use('/api/*', notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
