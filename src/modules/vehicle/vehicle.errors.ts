import { AppError } from "@/shared/errors/AppError";

export class VehicleNotFoundError extends AppError {
  constructor(vehicleId?: string) {
    const message = vehicleId ? `Vehicle with ID '${vehicleId}' not found` : "Vehicle not found";
    super(message, 404);
  }
}

export class VehicleNotAgingError extends AppError {
  constructor() {
    super("Actions can only be logged for aging vehicles (>90 days in stock)", 400);
  }
}
