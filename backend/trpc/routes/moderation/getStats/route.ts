import { moderatorProcedure } from '../../../create-context';
import { moderationDb } from '../../../../db/moderation';

export const getStatsProcedure = moderatorProcedure
  .query(() => {
    return moderationDb.stats.getOverview();
  });
