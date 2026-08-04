import type { Response, NextFunction } from "express";
import { VehicleService } from "@/modules/vehicle/vehicle.service";
import { getVehiclesQuerySchema } from "@/modules/vehicle/vehicle.schema";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub";
import type { VehicleFilterQuery } from "@/modules/vehicle/vehicle.types";

export class VehicleController {
  constructor(private vehicleService: VehicleService) {}
  public async getVehicles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getVehiclesQuerySchema.parse(req.query);

      const result = await this.vehicleService.getVehicles(
        validatedQuery as unknown as VehicleFilterQuery,
      );
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  public async getVehicleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(id as string);
      return res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
      next(error);
    }
  }
}
