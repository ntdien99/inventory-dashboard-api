import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Intelligent Inventory Dashboard API",
      version: "1.0.0",
      description:
        "RESTful API for tracking inventory, filtering aging stock (>90 days), and logging manager actions.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        UserIdHeader: {
          type: "apiKey",
          in: "header",
          name: "x-user-id",
          description: "Mock user ID for manager action context (e.g., mgr_john_101)",
        },
      },
      schemas: {
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "c39a81e2-8b1a-42bc-9d7a-123456789abc" },
            vin: { type: "string", example: "1HGCR2F83HA000101" },
            make: { type: "string", example: "Honda" },
            model: { type: "string", example: "Accord" },
            year: { type: "integer", example: 2024 },
            price: { type: "number", example: 28500.0 },
            receivedDate: {
              type: "string",
              format: "date-time",
              example: "2026-04-15T10:00:00.000Z",
            },
            status: { type: "string", enum: ["IN_STOCK", "RESERVED", "SOLD"], example: "IN_STOCK" },
            ageInDays: { type: "integer", example: 109 },
            isAging: { type: "boolean", example: true },
            actionLogs: {
              type: "array",
              items: { $ref: "#/components/schemas/ActionLog" },
            },
            latestAction: {
              type: "object",
              nullable: true,
              $ref: "#/components/schemas/ActionLog",
            },
          },
        },
        ActionLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "e42f92d1-9a2b-43cd-8e11-987654321xyz" },
            vehicleId: {
              type: "string",
              format: "uuid",
              example: "c39a81e2-8b1a-42bc-9d7a-123456789abc",
            },
            action: { type: "string", example: "Price Reduction Planned" },
            notes: {
              type: "string",
              nullable: true,
              example: "Discounted asking price by $1,500 due to slow foot traffic.",
            },
            createdById: { type: "string", example: "mgr_john_101" },
            createdAt: { type: "string", format: "date-time", example: "2026-07-28T14:30:00.000Z" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Vehicle not found" },
          },
        },
      },
    },
  },
  // Paths to files containing OpenAPI annotations
  apis: ["./src/modules/**/*.routes.ts", "./src/routes/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
