import { sendSuccess } from '../utils/response.js';
import { getDashboardSummary } from '../services/dashboardService.js';

export async function summary(req, res, next) {
  try {
    const data = await getDashboardSummary(req.user._id);
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
