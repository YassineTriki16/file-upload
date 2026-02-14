import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import * as path from 'path';
import filesRouter from './routes/files';

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-hashes'", "'unsafe-inline'"], // Allow inline event handlers
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Serve static files from public directory (using absolute path from root)
app.use(express.static(path.resolve(process.cwd(), 'public')));


// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount file routes
app.use('/api/files', filesRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
