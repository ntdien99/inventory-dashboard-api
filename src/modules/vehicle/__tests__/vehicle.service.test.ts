import { describe, test, expect, beforeEach } from "vitest";
import { VehicleService } from "@/modules/vehicle/vehicle.service";
import { VehicleNotFoundError } from "@/modules/vehicle/vehicle.errors";
import { prismaMock } from "@/test/singleton";
import { Decimal } from "@prisma/client/runtime/client";
import { VehicleStatus } from "../../../../generated/prisma/enums";

describe("VehicleService", () => {
  let vehicleService: VehicleService;
  const commonVehicle = {
    id: "veh-1",
    vin: "1FTFW1E50JFA12345",
    make: "Ford",
    model: "F-150",
    year: 2022,
    price: Decimal(31500),
    receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    status: VehicleStatus.IN_STOCK,
    actionLogs: [
      {
        id: "29a7d2fe-e91f-40a1-a0de-4c35b06f9a2f",
        vehicleId: "bf6879c0-8207-4d63-8651-7a47e4c36358",
        action: "Moved to Display Front",
        notes: "Repositioned vehicle near main showroom entrance.",
        createdById: "mgr_demo_101",
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    vehicleService = new VehicleService();
  });

  describe("calculateAgeInDays & isVehicleAging", () => {
    test("should correctly compute age in days", () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const age = vehicleService.calculateAgeInDays(tenDaysAgo);

      expect(age).toBe(10);
    });

    test("should return true if vehicle received date is > 90 days ago", () => {
      const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      expect(vehicleService.isVehicleAging(ninetyOneDaysAgo)).toBe(true);
    });

    test("should return true if vehicle received date is = 90 days ago", () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(vehicleService.isVehicleAging(ninetyDaysAgo)).toBe(false);
    });

    test("should return false if vehicle received date is < 90 days ago", () => {
      const eightyNineDaysAgo = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000);
      expect(vehicleService.isVehicleAging(eightyNineDaysAgo)).toBe(false);
    });
  });

  describe("getVehicleById", () => {
    test("should throw VehicleNotFoundError (404) if vehicle is not in DB", async () => {
      prismaMock.vehicle.findUnique.mockResolvedValue(null);

      await expect(vehicleService.getVehicleById("missing-uuid")).rejects.toThrow(
        VehicleNotFoundError,
      );
    });

    test("should return vehicle details with latestAction null when there are no action logs", async () => {
      const vehicle = {
        ...commonVehicle,
        receivedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        actionLogs: [],
      };

      prismaMock.vehicle.findUnique.mockResolvedValue(vehicle);

      const result = await vehicleService.getVehicleById("veh-2");

      expect(result).toMatchObject(vehicle);
      expect(result.ageInDays).toBeGreaterThanOrEqual(30);
    });

    test("should return vehicle details including latestAction when logs exist", async () => {
      const vehicle = {
        ...commonVehicle,
        receivedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      };

      prismaMock.vehicle.findUnique.mockResolvedValue(vehicle);

      const result = await vehicleService.getVehicleById("veh-3");

      expect(result).toMatchObject({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        status: vehicle.status,
        latestAction: vehicle.actionLogs[0],
      });
      expect(result.isAging).toBe(false);
    });
  });

  describe("getVehicles", () => {
    test("should return formatted vehicle data with pagination", async () => {
      prismaMock.vehicle.findMany.mockResolvedValue([commonVehicle]);
      prismaMock.vehicle.count.mockResolvedValue(1);

      const result = await vehicleService.getVehicles({});

      expect(result.pagination).toEqual({
        totalCount: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject(commonVehicle);
      expect(result.data[0].ageInDays).toBeGreaterThanOrEqual(5);
    });

    test("should apply make, model, and aging filters to query", async () => {
      prismaMock.vehicle.findMany.mockResolvedValue([]);
      prismaMock.vehicle.count.mockResolvedValue(0);

      await vehicleService.getVehicles({
        make: "Toyota",
        model: "Camry",
        isAging: true,
        page: 2,
        limit: 5,
      });

      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: VehicleStatus.IN_STOCK,
            make: { equals: "Toyota", mode: "insensitive" },
            model: { equals: "Camry", mode: "insensitive" },
            receivedDate: { lt: expect.any(Date) },
          }),
          skip: 5,
          take: 5,
          orderBy: { receivedDate: "asc" },
          include: {
            actionLogs: {
              orderBy: { createdAt: "desc" },
            },
          },
        }),
      );
      expect(prismaMock.vehicle.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: VehicleStatus.IN_STOCK,
            make: { equals: "Toyota", mode: "insensitive" },
            model: { equals: "Camry", mode: "insensitive" },
            receivedDate: { lt: expect.any(Date) },
          }),
        }),
      );
    });
    test("should return empty data and correct pagination when no vehicles match filters", async () => {
      prismaMock.vehicle.findMany.mockResolvedValue([]);
      prismaMock.vehicle.count.mockResolvedValue(0);

      const result = await vehicleService.getVehicles({
        make: "NonExistentMake",
        model: "NonExistentModel",
        isAging: true,
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    test("should return latestAction null when action logs are empty", async () => {
      const vehicleWithoutLogs = {
        ...commonVehicle,
        actionLogs: [],
        receivedDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      };

      prismaMock.vehicle.findMany.mockResolvedValue([vehicleWithoutLogs]);
      prismaMock.vehicle.count.mockResolvedValue(1);

      const result = await vehicleService.getVehicles({});

      expect(result.data[0].latestAction).toBeNull();
      expect(result.data[0].isAging).toBe(true);
      expect(result.data[0].ageInDays).toBeGreaterThanOrEqual(100);
    });

    test("should mark vehicles as aging when receivedDate is older than threshold", async () => {
      const agingVehicle = {
        ...commonVehicle,
        receivedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      };

      prismaMock.vehicle.findMany.mockResolvedValue([agingVehicle]);
      prismaMock.vehicle.count.mockResolvedValue(1);

      const result = await vehicleService.getVehicles({});

      expect(result.data[0].isAging).toBe(true);
    });

    test("should ignore the aging filter when isAging is false", async () => {
      prismaMock.vehicle.findMany.mockResolvedValue([commonVehicle]);
      prismaMock.vehicle.count.mockResolvedValue(1);

      await vehicleService.getVehicles({
        isAging: false,
        page: 1,
        limit: 10,
      });

      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: VehicleStatus.IN_STOCK,
          }),
        }),
      );
    });
  });
});
