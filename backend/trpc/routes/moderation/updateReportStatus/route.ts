import { z } from 'zod';
import { moderatorProcedure } from '../../../create-context';
import { moderationDb } from '../../../../db/moderation';
import { logger } from '../../../../utils/logger';

export const updateReportStatusProcedure = moderatorProcedure
  .input(z.object({
    reportId: z.string(),
    status: z.enum(['pending', 'in_review', 'resolved', 'dismissed']),
    moderatorNotes: z.string().optional(),
    resolution: z.string().optional(),
  }))
  .mutation(({ input, ctx }) => {
    logger.info('[Moderation] Report status updated:', {
      reportId: input.reportId,
      status: input.status,
      moderatorId: ctx.user.userId
    });
    
    if (input.status === 'resolved' && input.resolution) {
      logger.info('[Moderation] Report resolved:', { reportId: input.reportId });
      return moderationDb.reports.resolve(input.reportId, input.resolution, ctx.user.userId);
    }
    if (input.status === 'dismissed' && input.resolution) {
      logger.info('[Moderation] Report dismissed:', { reportId: input.reportId });
      return moderationDb.reports.dismiss(input.reportId, input.resolution, ctx.user.userId);
    }
    return moderationDb.reports.updateStatus(
      input.reportId, 
      input.status, 
      ctx.user.userId, 
      input.moderatorNotes
    );
  });
