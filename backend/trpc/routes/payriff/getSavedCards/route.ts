import { protectedProcedure } from '../../../create-context';
import { savedCardsDB } from '../../../../db/savedCards';

export const getSavedCardsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.user.userId;
  const cards = await savedCardsDB.findByUserId(userId);

  return {
    cards: cards.map((c) => ({
      ...c,
      pan: c.pan && c.pan.length >= 4 ? `**** **** **** ${c.pan.slice(-4)}` : c.pan,
    })),
  };
});
