import { apiLogger } from '@/utils/logger';

export interface SavedCard {
  id: string;
  userId: string;
  cardUuid: string;
  pan: string;
  brand: string;
  cardHolderName: string;
  savedAt: string;
  lastUsed?: string;
}

class SavedCardsDatabase {
  private cards: Map<string, SavedCard> = new Map();
  private userCardsIndex: Map<string, Set<string>> = new Map();
  private cardUuidIndex: Map<string, string> = new Map();

  async saveCard(cardData: Omit<SavedCard, 'id' | 'savedAt'>): Promise<SavedCard> {
    const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const card: SavedCard = {
      id,
      ...cardData,
      savedAt: now,
    };

    this.cards.set(id, card);
    this.cardUuidIndex.set(cardData.cardUuid, id);

    if (!this.userCardsIndex.has(cardData.userId)) {
      this.userCardsIndex.set(cardData.userId, new Set());
    }
    this.userCardsIndex.get(cardData.userId)!.add(id);

    apiLogger.debug(`[DB] Saved card: ${id} for user: ${cardData.userId}`);
    return card;
  }

  async findByUserId(userId: string): Promise<SavedCard[]> {
    const cardIds = this.userCardsIndex.get(userId);
    if (!cardIds) return [];

    const cards: SavedCard[] = [];
    for (const cardId of cardIds) {
      const card = this.cards.get(cardId);
      if (card) {
        cards.push(card);
      }
    }

    return cards.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  async findByCardUuid(cardUuid: string): Promise<SavedCard | null> {
    const cardId = this.cardUuidIndex.get(cardUuid);
    if (!cardId) return null;
    return this.cards.get(cardId) || null;
  }

  async findById(id: string): Promise<SavedCard | null> {
    return this.cards.get(id) || null;
  }

  async deleteCard(id: string): Promise<boolean> {
    const card = this.cards.get(id);
    if (!card) return false;

    this.cards.delete(id);
    this.cardUuidIndex.delete(card.cardUuid);

    const userCards = this.userCardsIndex.get(card.userId);
    if (userCards) {
      userCards.delete(id);
      if (userCards.size === 0) {
        this.userCardsIndex.delete(card.userId);
      }
    }

    apiLogger.debug(`[DB] Deleted card: ${id}`);
    return true;
  }

  async updateLastUsed(id: string): Promise<boolean> {
    const card = this.cards.get(id);
    if (!card) return false;

    card.lastUsed = new Date().toISOString();
    this.cards.set(id, card);

    apiLogger.debug(`[DB] Updated last used for card: ${id}`);
    return true;
  }

  async cardExists(userId: string, cardUuid: string): Promise<boolean> {
    const card = await this.findByCardUuid(cardUuid);
    return card !== null && card.userId === userId;
  }
}

export const savedCardsDB = new SavedCardsDatabase();
