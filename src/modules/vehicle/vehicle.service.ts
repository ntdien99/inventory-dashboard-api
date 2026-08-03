import { prisma } from "@/lib/prisma";
import { VehicleNotFoundError } from "@/modules/vehicle/vehicle.errors";
import type { VehicleFilterQuery } from "@/modules/vehicle/vehicle.types";
import { VehicleStatus } from "../../../generated/prisma/browser";

export class VehicleService {
  private AGING_THRESHOLD_DAYS = 90;

  public calculateAgeInDays(receivedDate: Date): number {
    const diffTime = Math.abs(Date.now() - new Date(receivedDate).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  public isVehicleAging(receivedDate: Date): boolean {
    return this.calculateAgeInDays(receivedDate) > this.AGING_THRESHOLD_DAYS;
  }

  public async getVehicles(filters: VehicleFilterQuery) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { status: VehicleStatus.IN_STOCK }; // Only fetch vehicles that are in stock

    if (filters.make) where.make = { equals: filters.make, mode: "insensitive" };
    if (filters.model) where.model = { equals: filters.model, mode: "insensitive" };

    if (filters.isAging) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - this.AGING_THRESHOLD_DAYS);
      where.receivedDate = { lte: ninetyDaysAgo };
    }

    const [items, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: "asc" },
        include: {
          actionLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    const formattedData = items.map((v: any) => {
      const ageInDays = this.calculateAgeInDays(v.receivedDate);
      return {
        ...v,
        ageInDays,
        isAging: ageInDays > this.AGING_THRESHOLD_DAYS,
        latestAction: v.actionLogs[0] || null,
      };
    });

    return {
      data: formattedData,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  public async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        actionLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vehicle) throw new VehicleNotFoundError(id);

    const ageInDays = this.calculateAgeInDays(vehicle.receivedDate);
    return {
      ...vehicle,
      ageInDays,
      isAging: ageInDays > this.AGING_THRESHOLD_DAYS,
      latestAction: vehicle.actionLogs[0] || null,
    };
  }
}
