import { Router } from 'express';
import { processCV } from '../controllers/cv.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/process', upload.single('cv'), processCV);

export default router;