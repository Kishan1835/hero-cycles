import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, authController.me);

export default router;
