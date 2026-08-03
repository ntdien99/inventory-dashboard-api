import { describe, test, expect, beforeEach, vi, type Mocked } from "vitest";
import { VehicleController } from "@/modules/vehicle/vehicle.controller";
import { VehicleService } from "@/modules/vehicle/vehicle.service";
import { VehicleNotFoundError } from "@/modules/vehicle/vehicle.errors";
import type { Response, NextFunction } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub";

// Mock VehicleService using Vitest vi.mock
vi.mock("../vehicle.service");

describe("VehicleController Unit Tests", () => {
  let controller: VehicleController;
  let mockServiceInstance: Mocked<VehicleService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: Mocked<NextFunction>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceInstance = new VehicleService() as Mocked<VehicleService>;
    controller = new VehicleController(mockServiceInstance);

    mockReq = { query: {}, params: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe("getVehicles", () => {
    test("should return 200 JSON on successful query", async () => {
      mockReq.query = { page: "1", limit: "10" };
      const mockResult = {
        data: [],
        pagination: { totalCount: 0, page: 1, limit: 10, totalPages: 0 },
      };

      mockServiceInstance.getVehicles.mockResolvedValue(mockResult as any);

      await controller.getVehicles(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, ...mockResult });
    });

    test("should forward ZodError to next(err) if query validation fails", async () => {
      mockReq.query = { page: "invalid_number" };

      await controller.getVehicles(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("getVehicleById", () => {
    test("should forward VehicleNotFoundError (404) to next(err) if service throws", async () => {
      mockReq.params = { id: "veh-404" };
      const error = new VehicleNotFoundError("veh-404");
      mockServiceInstance.getVehicleById.mockRejectedValue(error);

      await controller.getVehicleById(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
    test("should return 200 JSON with vehicle data on successful retrieval", async () => {
      const mockVehicle = { id: "veh-1", make: "Toyota", model: "Camry" };
      mockReq.params = { id: "veh-1" };
      mockServiceInstance.getVehicleById.mockResolvedValue(mockVehicle as any);

      await controller.getVehicleById(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockVehicle });
    });
  });
});
