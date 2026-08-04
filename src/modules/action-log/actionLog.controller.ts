import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@/shared/middleware/authStub";
import type { ActionLogService } from "@/modules/action-log/actionLog.service";
import { createActionLogSchema } from "@/modules/action-log/actionLog.schema";

export class ActionLogController {
  constructor(private actionLogService: ActionLogService) {}
  public async createActionLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id: vehicleId } = req.params;
      const validatedBody = createActionLogSchema.parse(req.body);
      const userId = req.user?.id;

      const actionLog = await this.actionLogService.createActionLog(
        vehicleId as string,
        validatedBody.action,
        validatedBody.notes,
        userId,
      );

      return res.status(201).json({ success: true, data: actionLog });
    } catch (error) {
      next(error);
    }
  }
}
