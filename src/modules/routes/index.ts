import { Router } from "express";
import vehicleRoutes from "@/modules/vehicle/vehicle.routes";
import actionLogRoutes from "@/modules/action-log/actionLog.routes";

const router = Router();

router.use("/vehicles", vehicleRoutes);
router.use("/vehicles/:id/actions", actionLogRoutes);

export default router;
