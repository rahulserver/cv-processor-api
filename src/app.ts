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
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Add static file serving
app.use(express.static('public'));

// Routes
app.get('/apis/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});
app.use('/apis/cv', cvRoutes);
app.use('/apis/pdf', pdfRoutes);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;