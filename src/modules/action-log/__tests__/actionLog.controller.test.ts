import { describe, test, expect, beforeEach, vi, type Mocked } from "vitest";
import { ActionLogController } from "@/modules/action-log/actionLog.controller";
import { ActionLogService } from "@/modules/action-log/actionLog.service";
import { VehicleNotAgingError } from "@/modules/vehicle/vehicle.errors";
import type { Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub";

vi.mock("../actionLog.service");

describe("ActionLogController Unit Tests", () => {
  let controller: ActionLogController;
  let mockServiceInstance: Mocked<ActionLogService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: Mocked<NextFunction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = new ActionLogService() as Mocked<ActionLogService>;
    controller = new ActionLogController(mockServiceInstance);

    mockReq = {
      params: { id: "veh-123" },
      body: { action: "Price Reduction Planned", notes: "Markdown $1,000" },
      user: { id: "mgr-909", role: "DEALERSHIP_MANAGER" },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  test("should return 201 Created on valid request body", async () => {
    const mockCreatedLog = {
      id: "log-1",
      vehicleId: "veh-123",
      action: "Price Reduction Planned",
      notes: "Markdown $1,000",
      createdById: "mgr-909",
      createdAt: new Date(),
    };

    mockServiceInstance.createActionLog.mockResolvedValue(mockCreatedLog as any);

    await controller.createActionLog(
      mockReq as AuthenticatedRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCreatedLog });
  });

  test("should pass ZodError to next(err) when body validation fails", async () => {
    mockReq.body = { action: "A" }; // Too short (min 3 chars)

    await controller.createActionLog(
      mockReq as AuthenticatedRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    expect(mockServiceInstance.createActionLog).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("should pass VehicleNotAgingError to next(err) when business rule fails", async () => {
    const error = new VehicleNotAgingError();
    mockServiceInstance.createActionLog.mockRejectedValue(error);

    await controller.createActionLog(
      mockReq as AuthenticatedRequest,
      mockRes as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
