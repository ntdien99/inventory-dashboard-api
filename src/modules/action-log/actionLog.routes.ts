import { ActionLogController } from "@/modules/action-log/actionLog.controller";
import { Router } from "express";
import { ActionLogService } from "@/modules/action-log/actionLog.service";

const router = Router({ mergeParams: true });
const controller = new ActionLogController(new ActionLogService());
/**
 * @openapi
 * /api/v1/vehicles/{id}/actions:
 *   post:
 *     summary: Log a proposed action on an aging vehicle
 *     description: Actions can ONLY be logged if the vehicle has been in stock for > 90 days.
 *     tags:
 *       - Action Logs
 *     security:
 *       - UserIdHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the vehicle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 example: "Price Reduction Planned"
 *               notes:
 *                 type: string
 *                 example: "Reducing price by $1,200 due to low search volume."
 *     responses:
 *       201:
 *         description: Action logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/ActionLog'
 *       400:
 *         description: Business rule violation (e.g., vehicle is not aging)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Vehicle not found
 */
router.post("/", (req, res, next) => controller.createActionLog(req, res, next));

export default router;
