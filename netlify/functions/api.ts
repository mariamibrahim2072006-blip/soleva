// Netlify serverless wrapper for the Express API.
// Netlify 200-rewrites keep the original request path in event.path,
// so no basePath stripping: express routes are already mounted at /api.
import serverless from 'serverless-http';
import { createApp } from '../../server/index.js';

export const handler = serverless(createApp());
