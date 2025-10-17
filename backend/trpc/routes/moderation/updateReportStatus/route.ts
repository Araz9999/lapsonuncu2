import { z } from 'zod';
import { moderatorProcedure } from '../../../create-context';
import { moderationDb } from '../../../../db/moderation';

export const updateReportStatusProcedure = moderatorProcedure
  .input(z.object({
    reportId: z.string(),
    status: z.enum(['pending', 'in_review', 'resolved', 'dismissed']),
    moderatorNotes: z.string().optional(),
    resolution: z.string().optional(),
  }))
  .mutation(({ input, ctx }) => {
    if (input.status === 'resolved' && input.resolution) {
      return moderationDb.reports.resolve(input.reportId, input.resolution, ctx.user.userId);
    }
    if (input.status === 'dismissed' && input.resolution) {
      return moderationDb.reports.dismiss(input.reportId, input.resolution, ctx.user.userId);
    }
    return moderationDb.reports.updateStatus(
      input.reportId, 
      input.status, 
      ctx.user.userId, 
      input.moderatorNotes
    );
  });
