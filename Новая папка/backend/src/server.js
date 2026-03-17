import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = Number(process.env.PORT || 8787);
const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173,http://localhost:5180,http://localhost:4173';

const app = createApp({ clientOrigin });

app.listen(port, () => {
  console.log(`[maven-backend] running on http://localhost:${port}`);
});
