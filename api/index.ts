import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server/index.js';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as any)(req, res);
}
