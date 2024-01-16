/* import { validationResult } from "express-validator";

const errors = async (req, res, next) => {
  const result = validationResult(req);
  const errors = result.array();
  const sanitizedErrors = errors.map(({ type, value, location, ...error }) => {
    return error;
  });
  for (const error of sanitizedErrors) {
    error.path = req.originalUrl;
  }
  if (errors.length > 0) {
    return res.status(400).json({ errors: sanitizedErrors });
  }
  next();
};

export default errors; */
