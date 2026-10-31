import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { summary } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);

router.get('/summary', summary);

export default router;
