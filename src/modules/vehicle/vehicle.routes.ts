import { Router } from "express";
import { VehicleController } from "@/modules/vehicle/vehicle.controller";
import { VehicleService } from "@/modules/vehicle/vehicle.service";

const router = Router();
const controller = new VehicleController(new VehicleService());

/**
 * @openapi
 * /api/v1/vehicles:
 *   get:
 *     summary: Retrieve a paginated list of vehicles
 *     description: Filter inventory by make, model, or aging status (>90 days in stock).
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by vehicle make (case-insensitive)
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by vehicle model (case-insensitive)
 *       - in: query
 *         name: isAging
 *         schema:
 *           type: boolean
 *         description: Set to true to filter vehicles in stock for > 90 days
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Successfully fetched vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalCount: { type: integer, example: 42 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 10 }
 *                     totalPages: { type: integer, example: 5 }
 */
router.get("/", (req, res, next) => controller.getVehicles(req, res, next));

/**
 * @openapi
 * /api/v1/vehicles/{id}:
 *   get:
 *     summary: Get vehicle details by ID
 *     description: Returns vehicle metadata alongside its full historical action log.
 *     tags:
 *       - Vehicles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle details found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", (req, res, next) => controller.getVehicleById(req, res, next));

export default router;
