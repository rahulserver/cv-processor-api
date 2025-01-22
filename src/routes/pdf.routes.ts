import { Router } from 'express';
import { generatePDF } from '../controllers/pdf.controller';

const router = Router();

router.post('/generate', generatePDF);

export default router;