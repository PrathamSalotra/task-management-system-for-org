import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project & Task Management System API',
      version: '1.0.0',
      description:
        'RESTful API documentation for the Project & Task Management System with RBAC and JWT Authentication (Phases 2–5)',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development server',
      },
      {
        url: 'http://api:4000',
        description: 'Docker API server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
            },
            ownerId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            },
            projectId: { type: 'string', format: 'uuid' },
            assigneeId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            taskId: { type: 'string', format: 'uuid' },
            authorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Attachment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileName: { type: 'string' },
            fileUrl: { type: 'string' },
            fileSize: { type: 'number' },
            fileType: { type: 'string' },
            taskId: { type: 'string', format: 'uuid' },
            uploadedById: { type: 'string', format: 'uuid' },
            uploadedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'System', description: 'System health check' },
      { name: 'Auth', description: 'Authentication and token management' },
      { name: 'Users', description: 'User management and role administration' },
      { name: 'Projects', description: 'Project CRUD and team membership' },
      { name: 'Tasks', description: 'Task CRUD, comments, and attachments' },
      { name: 'Dashboard', description: 'Dashboard metrics and team analytics' },
    ],
  },
  apis: ['./src/**/*.routes.ts', './src/**/*.routes.js', './src/app.ts', './src/app.js'],
};

let cachedSpec: any = null;

export function getSwaggerSpec() {
  if (!cachedSpec) {
    cachedSpec = swaggerJSDoc(options);
  }
  return cachedSpec;
}
