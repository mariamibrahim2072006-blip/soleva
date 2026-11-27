// Netlify serverless wrapper for the Express API.
import serverless from 'serverless-http';
import { createApp } from '../../server/index.js';

export const handler = serverless(createApp(), { basePath: '/api' });
