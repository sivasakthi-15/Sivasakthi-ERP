import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface PerformanceMetrics {
  totalRequests: number;
  slowRequestsCount: number;
  cpuUsage: number;
  memoryUsage: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  endpoints: Record<string, {
    calls: number;
    totalDurationMs: number;
    avgDurationMs: number;
    slowestMs: number;
  }>;
}

// Global metrics tracker
export const metrics: PerformanceMetrics = {
  totalRequests: 0,
  slowRequestsCount: 0,
  cpuUsage: 0,
  memoryUsage: { rss: '0 MB', heapTotal: '0 MB', heapUsed: '0 MB', external: '0 MB' },
  endpoints: {}
};

// Simple helper to format bytes
const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

// Background interval to refresh host metrics
setInterval(() => {
  const mem = process.memoryUsage();
  metrics.memoryUsage = {
    rss: formatMB(mem.rss),
    heapTotal: formatMB(mem.heapTotal),
    heapUsed: formatMB(mem.heapUsed),
    external: formatMB(mem.external)
  };

  // Safe CPU usage simulation for sandboxed environments
  const load = process.cpuUsage();
  metrics.cpuUsage = parseFloat(((load.user + load.system) / 1000000).toFixed(2));
}, 10000);

// Observability and Slow Query tracker middleware
export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const requestId = Math.random().toString(36).substring(2, 11).toUpperCase();
  req.headers['x-request-id'] = requestId;

  metrics.totalRequests++;

  // Record finish details
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    const route = `${req.method} ${req.baseUrl}${req.path}`;

    // Update endpoint stats
    if (!metrics.endpoints[route]) {
      metrics.endpoints[route] = { calls: 0, totalDurationMs: 0, avgDurationMs: 0, slowestMs: 0 };
    }
    const stat = metrics.endpoints[route];
    stat.calls++;
    stat.totalDurationMs += durationMs;
    stat.avgDurationMs = Math.round(stat.totalDurationMs / stat.calls);
    stat.slowestMs = Math.max(stat.slowestMs, durationMs);

    // Flag slow queries (> 500ms)
    if (durationMs > 500) {
      metrics.slowRequestsCount++;
      logger.warn(`[SLOW QUERY DETECTED] [RID: ${requestId}] ${req.method} ${req.originalUrl} took ${durationMs}ms`);
    } else {
      logger.info(`[RID: ${requestId}] ${req.method} ${req.originalUrl} Status: ${res.statusCode} in ${durationMs}ms`);
    }
  });

  next();
};

// Express endpoint helper to query system metrics
export const getSystemMetrics = (req: Request, res: Response) => {
  res.json({
    success: true,
    metrics: {
      ...metrics,
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
};
