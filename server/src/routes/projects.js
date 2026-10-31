import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listProjects, createProject, getProject, updateProject, deleteProject,
  listTasks, createTask, updateTask, moveTask, deleteTask,
  projectBodySchema, projectUpdateSchema, projectQuerySchema,
  taskBodySchema, taskUpdateSchema, taskMoveSchema,
} from '../controllers/projectController.js';
import { startTimer, stopTimer } from '../controllers/timeController.js';
import { listMessages, postMessage } from '../controllers/messageController.js';

const router = Router();
router.use(authenticate);

// Projects
router.get('/', validate(projectQuerySchema), listProjects);
router.post('/', validate(projectBodySchema), createProject);
router.get('/:id', getProject);
router.patch('/:id', validate(projectUpdateSchema), updateProject);
router.delete('/:id', deleteProject);

// Tasks (nested under project)
router.get('/:id/tasks', listTasks);
router.post('/:id/tasks', validate(taskBodySchema), createTask);

// Messages (nested under project)
router.get('/:id/messages', listMessages);
router.post('/:id/messages', postMessage);

export default router;
