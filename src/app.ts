import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cvRoutes from './routes/cv.routes';
import pdfRoutes from './routes/pdf.routes';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/cv', cvRoutes);
app.use('/api/pdf', pdfRoutes);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;