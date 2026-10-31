import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listClients, createClient, getClient, updateClient, deleteClient,
  archiveClient, unarchiveClient,
  clientBodySchema, clientQuerySchema, clientUpdateSchema,
} from '../controllers/clientController.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', validate(clientQuerySchema), listClients);
router.post('/', validate(clientBodySchema), createClient);
router.get('/:id', getClient);
router.patch('/:id', validate(clientUpdateSchema), updateClient);
router.delete('/:id', deleteClient);
router.patch('/:id/archive', archiveClient);
router.patch('/:id/unarchive', unarchiveClient);

export default router;
