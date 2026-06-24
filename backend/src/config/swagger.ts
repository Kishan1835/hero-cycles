import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hero Cycles Pricing Engine API',
      version: '1.0.0',
      description:
        'REST API for managing bicycle parts, time-based pricing, bicycle configurations, and instant price calculation.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
