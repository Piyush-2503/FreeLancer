import { sendError } from '../utils/response.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed',
        result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }
    req.validated = result.data;
    next();
  };
}
