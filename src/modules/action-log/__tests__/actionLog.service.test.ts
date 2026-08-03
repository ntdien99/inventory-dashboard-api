import { describe, test, expect, beforeEach } from "vitest";
import { ActionLogService } from "@/modules/action-log/actionLog.service";
import { VehicleNotAgingError, VehicleNotFoundError } from "@/modules/vehicle/vehicle.errors";
import { prismaMock } from "@/test/singleton";

describe("ActionLogService", () => {
  let actionLogService: ActionLogService;

  beforeEach(() => {
    actionLogService = new ActionLogService();
  });

  test("should throw VehicleNotFoundError when logging action for missing vehicle", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);

    await expect(
      actionLogService.createActionLog("non-existent-id", "Price Reduction", "Notes", "mgr-1"),
    ).rejects.toThrow(VehicleNotFoundError);
  });

  test("should throw VehicleNotAgingError (400) if vehicle stock age is <= 90 days", async () => {
    const recentVehicle = {
      id: "veh-recent",
      receivedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days old
    };

    prismaMock.vehicle.findUnique.mockResolvedValue(recentVehicle as any);

    await expect(
      actionLogService.createActionLog("veh-recent", "Price Discount", "Notes", "mgr-1"),
    ).rejects.toThrow(VehicleNotAgingError);

    expect(prismaMock.actionLog.create).not.toHaveBeenCalled();
  });

  test("should create ActionLog entry when vehicle is > 90 days in stock", async () => {
    const agingVehicle = {
      id: "veh-aging",
      receivedDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000), // 110 days old
    };

    const mockCreatedLog = {
      id: "log-001",
      vehicleId: "veh-aging",
      action: "Send to Auction",
      notes: "Over threshold",
      createdById: "mgr_john_101",
      createdAt: new Date(),
    };

    prismaMock.vehicle.findUnique.mockResolvedValue(agingVehicle as any);
    prismaMock.actionLog.create.mockResolvedValue(mockCreatedLog as any);

    const result = await actionLogService.createActionLog(
      "veh-aging",
      "Send to Auction",
      "Over threshold",
      "mgr_john_101",
    );

    expect(result).toEqual(mockCreatedLog);
    expect(prismaMock.actionLog.create).toHaveBeenCalledWith({
      data: {
        vehicleId: "veh-aging",
        action: "Send to Auction",
        notes: "Over threshold",
        createdById: "mgr_john_101",
      },
    });
  });

  test("should use default createdById and set notes to null when omitted", async () => {
    const agingVehicle = {
      id: "veh-aging-default",
      receivedDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days old
    };

    const mockCreatedLog = {
      id: "log-002",
      vehicleId: "veh-aging-default",
      action: "Routine Check",
      notes: null,
      createdById: "mgr_demo_101",
      createdAt: new Date(),
    };

    prismaMock.vehicle.findUnique.mockResolvedValue(agingVehicle as any);
    prismaMock.actionLog.create.mockResolvedValue(mockCreatedLog as any);

    const result = await actionLogService.createActionLog("veh-aging-default", "Routine Check");

    expect(result).toEqual(mockCreatedLog);
    expect(prismaMock.actionLog.create).toHaveBeenCalledWith({
      data: {
        vehicleId: "veh-aging-default",
        action: "Routine Check",
        notes: null,
        createdById: "mgr_demo_101",
      },
    });
  });

  test("should throw VehicleNotAgingError when vehicle is exactly 90 days old", async () => {
    const exactNinety = {
      id: "veh-90",
      receivedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // exactly 90 days
    };

    prismaMock.vehicle.findUnique.mockResolvedValue(exactNinety as any);

    await expect(actionLogService.createActionLog("veh-90", "Inspect")).rejects.toThrow(
      VehicleNotAgingError,
    );
  });
});
