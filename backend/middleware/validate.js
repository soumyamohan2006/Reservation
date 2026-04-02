import { z } from 'zod'
import { logger } from '../utils/logger.js'

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ errors: error.errors }, 'Validation failed')
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })) 
      })
    }
    next(error)
  }
}
