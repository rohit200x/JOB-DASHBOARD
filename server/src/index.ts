import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { initDatabase } from './database.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Static files for screenshots
app.use('/screenshots', express.static(join(process.cwd(), 'screenshots')));

// API routes
app.use('/api', routes);

// Serve frontend in production
const clientBuildPath = join(process.cwd(), '../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(join(clientBuildPath, 'index.html'));
});

// Initialize database (async with sql.js) and start server
async function start() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Greenhouse Dashboard Server running at http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
