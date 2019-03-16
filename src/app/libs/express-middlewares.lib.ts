import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';

export const ExpressMiddlewares = [
  // Send analytics event for all entering requests
  (req, res, next) => {
    this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_ENTERING_REQUEST);

    next();
  },
  // Remove multiple slash and replace by single slash
  (req, res, next) => {
    req.url = req.url.replace(/\/{2,}/g, '/');

    next();
  },
  // Parse body as a raw string
  (req, res, next) => {
    try {
      req.setEncoding('utf8');
      req.body = '';

      req.on('data', (chunk) => {
        req.body += chunk;
      });

      req.on('end', () => {
        next();
      });
    } catch (error) { }
  }
];
