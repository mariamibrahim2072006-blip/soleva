// Single-service production entry (Render etc.): API + built frontend on one origin.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../dist');
const app = createApp();
app.use(express.static(dist, { maxAge: '1h' }));
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
const port = +(process.env.PORT || 8080);
app.listen(port, '0.0.0.0', () => console.log(`SOLEVA on :${port}`));
