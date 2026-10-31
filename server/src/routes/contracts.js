import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listContracts, createContract, getContract, updateContract, sendContract,
  getPublicContract, signContract,
  contractBodySchema, contractUpdateSchema, publicLimiter,
} from '../controllers/proposalContractController.js';

const router = Router();

// Protected
router.use('/contracts', authenticate);
router.get('/contracts', listContracts);
router.post('/contracts', validate(contractBodySchema), createContract);
router.get('/contracts/:id', getContract);
router.patch('/contracts/:id', validate(contractUpdateSchema), updateContract);
router.post('/contracts/:id/send', sendContract);

// Public
router.get('/public/contracts/:token', publicLimiter, getPublicContract);
router.post('/public/contracts/:token/sign', publicLimiter, signContract);

export default router;
