import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  startTimer, stopTimer, getActiveTimer,
  createManualEntry, listTimeEntries, updateTimeEntry, deleteTimeEntry,
  manualEntrySchema, updateEntrySchema, listEntriesSchema,
} from '../controllers/timeController.js';

const router = Router();
router.use(authenticate);

// Active timer
router.get('/active', getActiveTimer);
router.post('/start', startTimer);
router.post('/stop', stopTimer);
router.post('/:taskId/start', startTimer);
router.post('/:id/stop', stopTimer);

// Manual entries
router.get('/', validate(listEntriesSchema), listTimeEntries);
router.post('/', validate(manualEntrySchema), createManualEntry);
router.patch('/:id', validate(updateEntrySchema), updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
