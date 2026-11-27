import { createApp } from './index.js';
let app: any = null;
export default function handler(req: any, res: any) {
  app ??= createApp();
  return app(req, res);
}
