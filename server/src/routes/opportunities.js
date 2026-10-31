import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listOpportunities,
  getMyOpportunities,
  createOpportunity,
  applyOpportunity,
  deleteOpportunity,
  opportunityQuerySchema,
  createOpportunitySchema,
  applyOpportunitySchema,
} from '../controllers/opportunityController.js';

const router = Router();

router.use(authenticate);

// List all open opportunities for freelancers
router.get('/', validate(opportunityQuerySchema), listOpportunities);

// List opportunities posted by the current user (if company)
router.get('/my', getMyOpportunities);

// Post a new opportunity (companies)
router.post('/', validate(createOpportunitySchema), createOpportunity);

// Apply to an opportunity (freelancers)
router.post('/:id/apply', validate(applyOpportunitySchema), applyOpportunity);

// Delete an opportunity
router.delete('/:id', deleteOpportunity);

export default router;
