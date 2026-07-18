const { z } = require('zod');

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Invalid email format'),
});

const bulkEmailSchema = z.object({
  emails: z
    .array(z.string().email('Invalid email format'))
    .min(1, 'At least one email is required')
    .max(10000, 'Maximum 10,000 emails per request'),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: errors,
        },
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

module.exports = {
  validateEmail: validate(emailSchema),
  validateBulk: validate(bulkEmailSchema),
};
