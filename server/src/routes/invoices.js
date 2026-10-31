import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listInvoices, createInvoice, createFromTime, getInvoice,
  updateInvoice, sendInvoice, cancelInvoice, downloadPDF,
  invoiceBodySchema, invoiceFromTimeSchema, invoiceQuerySchema, invoiceUpdateSchema,
} from '../controllers/invoiceController.js';

const router = Router();
router.use(authenticate);

router.get('/', validate(invoiceQuerySchema), listInvoices);
router.post('/', validate(invoiceBodySchema), createInvoice);
router.post('/from-time', validate(invoiceFromTimeSchema), createFromTime);
router.get('/:id', getInvoice);
router.patch('/:id', validate(invoiceUpdateSchema), updateInvoice);
router.post('/:id/send', sendInvoice);
router.post('/:id/cancel', cancelInvoice);
router.get('/:id/pdf', downloadPDF);

export default router;
