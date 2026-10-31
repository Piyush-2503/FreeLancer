import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listProposals, createProposal, getProposal, updateProposal, sendProposal,
  getPublicProposal, respondToProposal,
  proposalBodySchema, proposalUpdateSchema, publicLimiter,
} from '../controllers/proposalContractController.js';

const router = Router();

// Protected
router.use('/proposals', authenticate);
router.get('/proposals', listProposals);
router.post('/proposals', validate(proposalBodySchema), createProposal);
router.get('/proposals/:id', getProposal);
router.patch('/proposals/:id', validate(proposalUpdateSchema), updateProposal);
router.post('/proposals/:id/send', sendProposal);

// Public
router.get('/public/proposals/:token', publicLimiter, getPublicProposal);
router.post('/public/proposals/:token/respond', publicLimiter, respondToProposal);

export default router;
