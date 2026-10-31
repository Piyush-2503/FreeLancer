export const sendSuccess = (res, data, statusCode = 200, meta) =>
  res.status(statusCode).json({ success: true, data, ...(meta && { meta }) });

export const sendError = (res, statusCode, code, message, details) =>
  res.status(statusCode).json({ success: false, error: { code, message, ...(details && { details }) } });
