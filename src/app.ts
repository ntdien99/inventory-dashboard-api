import express from "express";
import cors from "cors";
import helmet from "helmet";
import { mockAuthMiddleware } from "@/shared/middleware/authStub";
import { httpLogger } from "@/shared/middleware/httpLogger";
import { errorHandler } from "@/shared/middleware/errorHandler";
import apiRoutes from "@/modules/routes/index";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "@/shared/config/swagger";

const app = express();

// Security & Base Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mockAuthMiddleware);
app.use(httpLogger);

// Interactive Swagger API Documentation Endpoint
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
// Domain Module Routes
app.use("/api/v1", apiRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
});
export default app;
