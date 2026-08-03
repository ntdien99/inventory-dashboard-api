import { prisma } from "@/lib/prisma";
import { VehicleNotAgingError, VehicleNotFoundError } from "@/modules/vehicle/vehicle.errors";
import { VehicleService } from "@/modules/vehicle/vehicle.service";

const vehicleService = new VehicleService();

export class ActionLogService {
  public async createActionLog(
    vehicleId: string,
    action: string,
    notes?: string,
    createdById: string = "mgr_demo_101",
  ) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) throw new VehicleNotFoundError(vehicleId);

    if (!vehicleService.isVehicleAging(vehicle.receivedDate)) {
      throw new VehicleNotAgingError();
    }

    return await prisma.actionLog.create({
      data: {
        vehicleId,
        action,
        notes: notes ?? null,
        createdById,
      },
    });
  }
}
