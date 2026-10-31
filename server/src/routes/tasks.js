import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateTask, moveTask, deleteTask,
  taskUpdateSchema, taskMoveSchema,
} from '../controllers/projectController.js';
import { startTimer, stopTimer } from '../controllers/timeController.js';

const router = Router();
router.use(authenticate);

router.patch('/:id', validate(taskUpdateSchema), updateTask);
router.patch('/:id/move', validate(taskMoveSchema), moveTask);
router.post('/:id/move', validate(taskMoveSchema), moveTask);
router.delete('/:id', deleteTask);
router.post('/:taskId/timer/start', startTimer);
router.post('/:taskId/timer/stop', stopTimer);

export default router;
