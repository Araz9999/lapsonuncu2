import { create } from 'zustand';
import { Store, StorePlan, storePlans, StoreFollower, StoreNotification, StoreStatus } from '@/types/store';
import { mockStores } from '@/mocks/stores';

import { logger } from '@/utils/logger';
interface StoreState {
  stores: Store[];
  userStore: Store | null;
  activeStoreId: string | null;
  userStoreSettings: Record<string, Record<string, any>>; // userId -> storeId -> settings
  followers: StoreFollower[];
  notifications: StoreNotification[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createStore: (storeData: Omit<Store, 'id' | 'createdAt' | 'expiresAt' | 'adsUsed' | 'deletedListings' | 'isActive' | 'status' | 'gracePeriodEndsAt' | 'deactivatedAt' | 'archivedAt' | 'lastPaymentReminder' | 'followers' | 'rating' | 'totalRatings'>) => Promise<void>;
  checkStoreStatus: (storeId: string) => StoreStatus;
  updateStoreStatus: (storeId: string) => Promise<void>;
  renewStore: (storeId: string, planId: string) => Promise<void>;
  sendPaymentReminder: (storeId: string) => Promise<void>;
  getStoresByStatus: (status: StoreStatus) => Store[];
  canStoreBeReactivated: (storeId: string) => boolean;
  reactivateStore: (storeId: string, planId: string) => Promise<void>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (storeId: string) => Promise<void>;
  getUserStore: (userId: string) => Store | null;
  getAllUserStores: (userId: string) => Store[];
  getStorePlans: () => StorePlan[];
  activateStore: (userId: string, planId: string, storeData: Partial<Store>) => Promise<void>;
  deactivateStore: (storeId: string) => Promise<void>;
  followStore: (userId: string, storeId: string) => Promise<void>;
  unfollowStore: (userId: string, storeId: string) => Promise<void>;
  isFollowingStore: (userId: string, storeId: string) => boolean;
  getFollowedStores: (userId: string) => Store[];
  notifyFollowers: (storeId: string, listingId: string) => Promise<void>;
  getNotifications: (userId: string) => StoreNotification[];
  markNotificationAsRead: (notificationId: string) => void;
  // Store listing management
  canAddListing: (storeId: string) => boolean;
  addListingToStore: (storeId: string, listingId: string) => Promise<void>;
  removeListingFromStore: (storeId: string, listingId: string) => Promise<void>;
  deleteListingEarly: (storeId: string, listingId: string) => Promise<void>;
  getStoreListings: (storeId: string) => string[];
  getStoreUsage: (storeId: string) => { used: number; max: number; remaining: number; deleted: number };
  // Store editing
  editStore: (storeId: string, updates: Partial<Omit<Store, 'id' | 'userId' | 'createdAt' | 'expiresAt' | 'adsUsed' | 'deletedListings' | 'followers' | 'rating' | 'totalRatings'>>) => Promise<void>;
  // Store expiration management
  getExpirationInfo: (storeId: string) => {
    status: StoreStatus;
    daysUntilExpiration: number;
    daysInGracePeriod: number;
    daysSinceDeactivation: number;
    canReactivate: boolean;
    nextAction: string;
    nextActionDate: string;
  } | null;
  // Multi-store management
  getActiveStoreForUser: (userId: string) => Store | null;
  switchActiveStore: (userId: string, storeId: string) => Promise<void>;
  getUserStoreSettings: (userId: string, storeId: string) => Record<string, unknown>;
  updateUserStoreSettings: (userId: string, storeId: string, settings: Record<string, unknown>) => Promise<void>;
  canUserCreateNewStore: (userId: string) => boolean;
  getUserStoreLimit: (userId: string) => number;
  sendExpirationNotification: (storeId: string, type: 'warning' | 'grace_period' | 'deactivated') => Promise<void>;
  getExpiredStoreActions: (storeId: string) => {
    canRenew: boolean;
    canReactivate: boolean;
    canArchive: boolean;
    recommendedAction: string;
  };
  // Product discount management
  applyDiscountToProduct: (storeId: string, listingId: string, discountPercentage: number) => Promise<void>;
  removeDiscountFromProduct: (storeId: string, listingId: string) => Promise<void>;
  applyStoreWideDiscount: (storeId: string, discountPercentage: number, excludeListingIds?: string[]) => Promise<void>;
  removeStoreWideDiscount: (storeId: string) => Promise<void>;
  getStoreDiscounts: (storeId: string) => { listingId: string; originalPrice: number; discountedPrice: number; discountPercentage: number }[];
  getStoreListingConflicts: (storeId: string) => { listingId: string; title: string; remainingDays: number }[];
}

export const useStoreStore = create<StoreState>((set, get) => ({
  stores: mockStores,
  userStore: null,
  activeStoreId: null,
  userStoreSettings: {},
  followers: [],
  notifications: [],
  isLoading: false,
  error: null,

  createStore: async (storeData) => {
    set({ isLoading: true, error: null });
    try {
      // BUG FIX: Validate input data
      if (!storeData.userId || !storeData.name || !storeData.plan) {
        throw new Error('Missing required store data');
      }
      
      // BUG FIX: Check if user already has a store
      const existingStore = get().stores.find(s => 
        s.userId === storeData.userId && 
        (s.status === 'active' || s.status === 'grace_period')
      );
      
      if (existingStore) {
        throw new Error('User already has an active store. Multiple stores require additional purchase.');
      }
      
      // BUG FIX: Generate unique ID with random component
      const newStore: Store = {
        ...storeData,
        id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + storeData.plan.duration * 24 * 60 * 60 * 1000).toISOString(),
        adsUsed: 0,
        deletedListings: [],
        isActive: true,
        status: 'active',
        gracePeriodEndsAt: undefined,
        deactivatedAt: undefined,
        archivedAt: undefined,
        lastPaymentReminder: undefined,
        followers: [],
        rating: 0,
        totalRatings: 0,
      };
      
      set(state => ({
        stores: [...state.stores, newStore],
        isLoading: false
      }));
    } catch {
      set({ error: 'Failed to create store', isLoading: false });
    }
  },

  updateStore: async (storeId, updates) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updates } : store
        ),
        isLoading: false
      }));
    } catch {
      set({ error: 'Failed to update store', isLoading: false });
    }
  },

  deleteStore: async (storeId) => {
    set({ isLoading: true, error: null });
    try {
      // BUG FIX: Validate storeId
      if (!storeId) {
        throw new Error('Invalid storeId');
      }
      
      // BUG FIX: Check if store exists
      const store = get().stores.find(s => s.id === storeId);
      if (!store) {
        logger.warn('[StoreStore] Store not found for deletion:', storeId);
        set({ isLoading: false });
        return;
      }
      
      // BUG FIX: Use soft delete instead of hard delete
      const now = new Date().toISOString();
      set(state => ({
        stores: state.stores.map(s => 
          s.id === storeId 
            ? { ...s, status: 'archived' as StoreStatus, archivedAt: now }
            : s
        ),
        isLoading: false
      }));
      
      logger.info('[StoreStore] Store archived:', storeId);
    } catch (error) {
      logger.error('[StoreStore] Failed to delete store:', error);
      set({ error: 'Failed to delete store', isLoading: false });
    }
  },

  getUserStore: (userId) => {
    const { stores } = get();
    return stores.find(store => 
      store.userId === userId && 
      (store.status === 'active' || store.status === 'grace_period')
    ) || null;
  },

  getAllUserStores: (userId) => {
    // ✅ Validate userId
    if (!userId || typeof userId !== 'string') {
      logger.warn('[StoreStore] Invalid userId for getAllUserStores');
      return [];
    }
    
    const { stores } = get();
    return stores.filter(store => 
      store.userId === userId && 
      store.status !== 'archived'
    ).sort((a, b) => {
      // Sort by status priority: active > grace_period > deactivated > archived
      const statusPriority: Record<StoreStatus, number> = { active: 4, grace_period: 3, deactivated: 2, archived: 1 };
      const aPriority = statusPriority[a.status as StoreStatus] || 0;
      const bPriority = statusPriority[b.status as StoreStatus] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getStorePlans: () => storePlans,

  activateStore: async (userId, planId, storeData) => {
    const plan = storePlans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    
    const { createStore } = get();
    await createStore({
      name: storeData.name || '',
      categoryName: storeData.categoryName || '',
      address: storeData.address || '',
      contactInfo: storeData.contactInfo || { phone: '', email: '', website: '', whatsapp: '' },
      description: storeData.description || '',
      logo: storeData.logo || '',
      coverImage: storeData.coverImage || '',
      theme: storeData.theme || { colorScheme: 'light', layout: 'grid' },
      ratingStats: storeData.ratingStats || { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      userId,
      plan,
      maxAds: plan.maxAds
    });
  },

  deactivateStore: async (storeId) => {
    const { updateStore } = get();
    await updateStore(storeId, { isActive: false });
  },

  followStore: async (userId, storeId) => {
    set({ isLoading: true, error: null });
    try {
      // BUG FIX: Validate parameters
      if (!userId || !storeId) {
        throw new Error('Invalid userId or storeId');
      }
      
      // BUG FIX: Check if already following
      const alreadyFollowing = get().followers.some(f => 
        f.userId === userId && f.storeId === storeId
      );
      
      if (alreadyFollowing) {
        logger.warn('[StoreStore] User already following store:', { userId, storeId });
        set({ isLoading: false });
        return;
      }
      
      // BUG FIX: Check if store exists
      const store = get().stores.find(s => s.id === storeId);
      if (!store) {
        throw new Error('Store not found');
      }
      
      // BUG FIX: Generate unique ID
      const newFollower: StoreFollower = {
        id: `follower-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        userId,
        storeId,
        followedAt: new Date().toISOString(),
      };
      
      set(state => ({
        followers: [...state.followers, newFollower],
        stores: state.stores.map(store => 
          store.id === storeId 
            ? { ...store, followers: [...store.followers, userId] }
            : store
        ),
        isLoading: false
      }));
      
      logger.info('[StoreStore] User followed store:', { userId, storeId });
    } catch (error) {
      logger.error('[StoreStore] Failed to follow store:', error);
      set({ error: 'Failed to follow store', isLoading: false });
    }
  },

  unfollowStore: async (userId, storeId) => {
    logger.info('[StoreStore] Unfollow store initiated:', { userId, storeId });
    set({ isLoading: true, error: null });
    try {
      const store = get().stores.find(s => s.id === storeId);
      const wasFollowing = get().followers.some(f => f.userId === userId && f.storeId === storeId);
      
      if (!wasFollowing) {
        logger.warn('[StoreStore] User was not following store:', { userId, storeId });
      }
      
      set(state => ({
        followers: state.followers.filter(f => !(f.userId === userId && f.storeId === storeId)),
        stores: state.stores.map(store => 
          store.id === storeId 
            ? { ...store, followers: store.followers.filter(id => id !== userId) }
            : store
        ),
        isLoading: false
      }));
      
      logger.info('[StoreStore] Store unfollowed successfully:', { 
        userId, 
        storeId,
        storeName: store?.name,
        followersCount: store ? store.followers.length - 1 : 0
      });
    } catch (error) {
      logger.error('[StoreStore] Unfollow store failed:', error);
      set({ error: 'Failed to unfollow store', isLoading: false });
    }
  },

  isFollowingStore: (userId, storeId) => {
    const { followers } = get();
    return followers.some(f => f.userId === userId && f.storeId === storeId);
  },

  getFollowedStores: (userId) => {
    const { stores, followers } = get();
    const followedStoreIds = followers
      .filter(f => f.userId === userId)
      .map(f => f.storeId);
    return stores.filter(store => followedStoreIds.includes(store.id));
  },

  notifyFollowers: async (storeId, listingId) => {
    // BUG FIX: Validate parameters
    if (!storeId || !listingId) {
      logger.error('[StoreStore] Invalid parameters for notifyFollowers');
      return;
    }
    
    const { stores, followers } = get();
    const store = stores.find(s => s.id === storeId);
    
    // BUG FIX: Validate store exists and has name
    if (!store || !store.name) {
      logger.warn('[StoreStore] Store not found for notification:', storeId);
      return;
    }

    const storeFollowers = followers.filter(f => f.storeId === storeId);
    
    // BUG FIX: Only send notifications if there are followers
    if (storeFollowers.length === 0) {
      logger.debug('[StoreStore] No followers to notify for store:', storeId);
      return;
    }
    
    const newNotifications: StoreNotification[] = storeFollowers.map((follower, index) => ({
      id: `notif-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`, // BUG FIX: Unique IDs
      storeId,
      userId: follower.userId,
      listingId,
      message: {
        az: `${store.name} mağazası yeni elan əlavə etdi`,
        ru: `Магазин ${store.name} добавил новое объявление`,
        en: `Store ${store.name} added a new listing`
      },
      createdAt: new Date().toISOString(),
      isRead: false,
    }));

    set(state => ({
      notifications: [...state.notifications, ...newNotifications]
    }));
    
    logger.info('[StoreStore] Notified followers:', { storeId, followerCount: storeFollowers.length });
  },

  getNotifications: (userId) => {
    const { notifications } = get();
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationAsRead: (notificationId) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    }));
  },

  canAddListing: (storeId) => {
    // BUG FIX: Validate storeId parameter
    if (!storeId || typeof storeId !== 'string') {
      logger.error('[StoreStore] Invalid storeId for canAddListing');
      return false;
    }
    
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    
    // BUG FIX: More detailed validation
    if (!store) {
      logger.warn('[StoreStore] Store not found:', storeId);
      return false;
    }
    
    if (store.status !== 'active' && store.status !== 'grace_period') {
      logger.warn('[StoreStore] Store not active:', { storeId, status: store.status });
      return false;
    }
    
    // BUG FIX: Validate store.adsUsed and store.maxAds are numbers
    const adsUsed = typeof store.adsUsed === 'number' ? store.adsUsed : 0;
    const maxAds = typeof store.maxAds === 'number' ? store.maxAds : 0;
    
    return adsUsed < maxAds;
  },

  addListingToStore: async (storeId, listingId) => {
    // BUG FIX: Validate parameters
    if (!storeId || !listingId) {
      logger.error('[StoreStore] Invalid parameters for addListingToStore');
      throw new Error('storeId and listingId are required');
    }
    
    const { stores, canAddListing, notifyFollowers } = get();
    const store = stores.find(s => s.id === storeId);
    
    // BUG FIX: Better error messages
    if (!store) {
      logger.error('[StoreStore] Store not found:', storeId);
      throw new Error('Mağaza tapılmadı');
    }
    
    if (!canAddListing(storeId)) {
      logger.error('[StoreStore] Cannot add listing to store - limit reached:', storeId);
      throw new Error('Mağaza elan limiti dolub');
    }

    // BUG FIX: Validate adsUsed is a number
    const currentAdsUsed = typeof store.adsUsed === 'number' ? store.adsUsed : 0;
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId 
          ? { ...s, adsUsed: currentAdsUsed + 1 }
          : s
      )
    }));

    logger.info('[StoreStore] Listing added to store:', { storeId, listingId });
    
    // Notify followers about new listing
    try {
      await notifyFollowers(storeId, listingId);
    } catch (error) {
      // BUG FIX: Don't fail if notifications fail
      logger.error('[StoreStore] Failed to notify followers:', error);
    }
  },

  removeListingFromStore: async (storeId, listingId) => {
    // BUG FIX: Validate parameters
    if (!storeId || !listingId) {
      logger.error('[StoreStore] Invalid parameters for removeListingFromStore');
      return;
    }
    
    // BUG FIX: Check if store exists
    const store = get().stores.find(s => s.id === storeId);
    if (!store) {
      logger.warn('[StoreStore] Store not found for listing removal:', storeId);
      return;
    }
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId 
          ? { ...s, adsUsed: Math.max(0, s.adsUsed - 1) }
          : s
      )
    }));
    
    logger.info('[StoreStore] Listing removed from store:', { storeId, listingId });
  },

  getStoreListings: (storeId) => {
    // This would typically come from a separate listings-store relationship
    // For now, we'll return empty array as listings are managed separately
    return [];
  },

  deleteListingEarly: async (storeId, listingId) => {
    logger.info('[StoreStore] Delete listing early:', { storeId, listingId });
    
    const store = get().stores.find(s => s.id === storeId);
    if (!store) {
      logger.error('[StoreStore] Store not found for listing deletion:', { storeId });
      throw new Error('Store not found');
    }
    
    if (store.deletedListings.includes(listingId)) {
      logger.warn('[StoreStore] Listing already deleted:', { storeId, listingId });
      return;
    }
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId 
          ? { 
              ...s, 
              deletedListings: [...s.deletedListings, listingId]
            }
          : s
      )
    }));
    
    logger.info('[StoreStore] Listing deleted early successfully:', { 
      storeId, 
      listingId,
      totalDeleted: store.deletedListings.length + 1
    });
  },

  getStoreUsage: (storeId) => {
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return { used: 0, max: 0, remaining: 0, deleted: 0 };
    
    return {
      used: store.adsUsed,
      max: store.maxAds,
      remaining: store.maxAds - store.adsUsed,
      deleted: store.deletedListings.length
    };
  },

  editStore: async (storeId, updates) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ Validate storeId
      if (!storeId) {
        throw new Error('Invalid storeId');
      }
      
      // ✅ Validate updates
      if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
        throw new Error('Store name cannot be empty');
      }
      
      // ✅ Validate email if provided
      if (updates.contactInfo?.email) {
        const { validateEmail } = await import('@/utils/inputValidation');
        if (!validateEmail(updates.contactInfo.email)) {
          throw new Error('Invalid email format');
        }
      }
      
      // ✅ Validate website if provided
      if (updates.contactInfo?.website) {
        const { validateWebsiteURL } = await import('@/utils/inputValidation');
        if (!validateWebsiteURL(updates.contactInfo.website)) {
          throw new Error('Invalid website URL');
        }
      }
      
      set(state => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updates } : store
        ),
        isLoading: false
      }));
      
      logger.info('[StoreStore] Store edited successfully:', { 
        storeId,
        updatedFields: Object.keys(updates)
      });
    } catch (error) {
      logger.error('[StoreStore] Failed to edit store:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to edit store', isLoading: false });
    }
  },

  applyDiscountToProduct: async (storeId, listingId, discountPercentage) => {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string') {
        logger.error('[StoreStore] Invalid storeId for applyDiscountToProduct');
        throw new Error('Invalid store ID');
      }
      
      if (!listingId || typeof listingId !== 'string') {
        logger.error('[StoreStore] Invalid listingId for applyDiscountToProduct');
        throw new Error('Invalid listing ID');
      }
      
      if (typeof discountPercentage !== 'number' || isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 99) {
        logger.error('[StoreStore] Invalid discountPercentage:', discountPercentage);
        throw new Error('Discount percentage must be between 1 and 99');
      }
      
      const { useListingStore } = await import('@/store/listingStore');
      const { updateListing, listings } = useListingStore.getState();
      
      const listing = listings.find(l => l.id === listingId && l.storeId === storeId);
      if (!listing) {
        logger.error('[StoreStore] Listing not found:', { listingId, storeId });
        throw new Error('Listing not found in store');
      }
      
      if (listing.priceByAgreement) {
        logger.warn('[StoreStore] Cannot discount price-by-agreement listing:', listingId);
        throw new Error('Cannot apply discount to price by agreement listings');
      }
      
      // ✅ Calculate from originalPrice (or current price if not discounted yet)
      const basePrice = listing.originalPrice || listing.price;
      const discountAmount = (basePrice * discountPercentage) / 100;
      const discountedPrice = Math.round(Math.max(0, basePrice - discountAmount));
      
      logger.info('[StoreStore] Applying discount:', { listingId, basePrice, discountPercentage, discountedPrice });
      
      updateListing(listingId, {
        originalPrice: basePrice,
        price: discountedPrice,
        discountPercentage,
        hasDiscount: true
      });
      
      logger.info('[StoreStore] Discount applied successfully to listing:', listingId);
    } catch (error) {
      logger.error('[StoreStore] Failed to apply discount:', error);
      throw error;
    }
  },

  removeDiscountFromProduct: async (storeId, listingId) => {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string') {
        logger.error('[StoreStore] Invalid storeId for removeDiscountFromProduct');
        throw new Error('Invalid store ID');
      }
      
      if (!listingId || typeof listingId !== 'string') {
        logger.error('[StoreStore] Invalid listingId for removeDiscountFromProduct');
        throw new Error('Invalid listing ID');
      }
      
      const { useListingStore } = await import('@/store/listingStore');
      const { updateListing, listings } = useListingStore.getState();
      
      const listing = listings.find(l => l.id === listingId && l.storeId === storeId);
      
      if (!listing) {
        logger.error('[StoreStore] Listing not found:', { listingId, storeId });
        throw new Error('Listing not found in store');
      }
      
      if (!listing.hasDiscount) {
        logger.warn('[StoreStore] Listing has no discount to remove:', listingId);
        return;
      }
      
      logger.info('[StoreStore] Removing discount from listing:', listingId);
      
      updateListing(listingId, {
        price: listing.originalPrice || listing.price,
        originalPrice: undefined,
        discountPercentage: undefined,
        hasDiscount: false
      });
      
      logger.info('[StoreStore] Discount removed successfully from listing:', listingId);
    } catch (error) {
      logger.error('[StoreStore] Failed to remove discount:', error);
      throw error;
    }
  },

  applyStoreWideDiscount: async (storeId, discountPercentage, excludeListingIds = []) => {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string') {
        logger.error('[StoreStore] Invalid storeId for applyStoreWideDiscount');
        throw new Error('Invalid store ID');
      }
      
      if (typeof discountPercentage !== 'number' || isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 99) {
        logger.error('[StoreStore] Invalid discountPercentage:', discountPercentage);
        throw new Error('Discount percentage must be between 1 and 99');
      }
      
      if (!Array.isArray(excludeListingIds)) {
        logger.error('[StoreStore] excludeListingIds must be an array');
        throw new Error('Exclude list must be an array');
      }
      
      const { useListingStore } = await import('@/store/listingStore');
      const { listings, updateListing } = useListingStore.getState();
      
      const storeListings = listings.filter(l => 
        l.storeId === storeId && 
        !excludeListingIds.includes(l.id) &&
        !l.deletedAt &&
        !l.priceByAgreement
      );
      
      if (storeListings.length === 0) {
        logger.warn('[StoreStore] No applicable listings found for store-wide discount:', storeId);
        return;
      }
      
      logger.info('[StoreStore] Applying store-wide discount:', { storeId, discountPercentage, listingCount: storeListings.length, excludedCount: excludeListingIds.length });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const listing of storeListings) {
        try {
          // ✅ Calculate from originalPrice (or current price if not discounted yet)
          const basePrice = listing.originalPrice || listing.price;
          const discountAmount = (basePrice * discountPercentage) / 100;
          const discountedPrice = Math.round(Math.max(0, basePrice - discountAmount));
          
          updateListing(listing.id, {
            originalPrice: basePrice,
            price: discountedPrice,
            discountPercentage,
            hasDiscount: true
          });
          
          successCount++;
        } catch (listingError) {
          logger.error('[StoreStore] Failed to discount individual listing:', { listingId: listing.id, error: listingError });
          errorCount++;
        }
      }
      
      logger.info('[StoreStore] Store-wide discount applied:', { storeId, successCount, errorCount, totalAttempted: storeListings.length });
    } catch (error) {
      logger.error('[StoreStore] Failed to apply store-wide discount:', error);
      throw error;
    }
  },

  removeStoreWideDiscount: async (storeId) => {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string') {
        logger.error('[StoreStore] Invalid storeId for removeStoreWideDiscount');
        throw new Error('Invalid store ID');
      }
      
      const { useListingStore } = await import('@/store/listingStore');
      const { listings, updateListing } = useListingStore.getState();
      
      const storeListings = listings.filter(l => 
        l.storeId === storeId && 
        l.hasDiscount &&
        !l.deletedAt
      );
      
      if (storeListings.length === 0) {
        logger.warn('[StoreStore] No discounted listings found to remove:', storeId);
        return;
      }
      
      logger.info('[StoreStore] Removing store-wide discount:', { storeId, listingCount: storeListings.length });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const listing of storeListings) {
        try {
          updateListing(listing.id, {
            price: listing.originalPrice || listing.price,
            originalPrice: undefined,
            discountPercentage: undefined,
            hasDiscount: false
          });
          
          successCount++;
        } catch (listingError) {
          logger.error('[StoreStore] Failed to remove discount from individual listing:', { listingId: listing.id, error: listingError });
          errorCount++;
        }
      }
      
      logger.info('[StoreStore] Store-wide discount removed:', { storeId, successCount, errorCount, totalAttempted: storeListings.length });
    } catch (error) {
      logger.error('[StoreStore] Failed to remove store-wide discount:', error);
      throw error;
    }
  },

  getStoreDiscounts: (storeId) => {
    try {
      // ✅ Validate storeId
      if (!storeId || typeof storeId !== 'string') {
        logger.error('[StoreStore] Invalid storeId for getStoreDiscounts');
        return [];
      }
      
      // ✅ Get actual discounts from listingStore
      // Note: We can't use dynamic import in sync function, so we access the global state
      const discounts: { listingId: string; originalPrice: number; discountedPrice: number; discountPercentage: number }[] = [];
      
      // Access listingStore if available
      try {
        // This is a workaround for type safety - in production, use proper state management
        const listingStoreModule = require('@/store/listingStore');
        if (listingStoreModule && listingStoreModule.useListingStore) {
          const { listings } = listingStoreModule.useListingStore.getState();
          
          const discountedListings = listings.filter((l: any) => 
            l.storeId === storeId && 
            l.hasDiscount && 
            !l.deletedAt &&
            l.originalPrice &&
            l.discountPercentage
          );
          
          discountedListings.forEach((listing: any) => {
            discounts.push({
              listingId: listing.id,
              originalPrice: listing.originalPrice,
              discountedPrice: listing.price,
              discountPercentage: listing.discountPercentage
            });
          });
          
          logger.info('[StoreStore] Retrieved store discounts:', { storeId, count: discounts.length });
        }
      } catch (moduleError) {
        logger.warn('[StoreStore] Could not load listingStore for discounts:', moduleError);
      }
      
      return discounts;
    } catch (error) {
      logger.error('[StoreStore] Failed to get store discounts:', error);
      return [];
    }
  },

  checkStoreStatus: (storeId) => {
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return 'archived';
    
    const now = new Date();
    const expiresAt = new Date(store.expiresAt);
    const gracePeriodEndsAt = store.gracePeriodEndsAt ? new Date(store.gracePeriodEndsAt) : null;
    const deactivatedAt = store.deactivatedAt ? new Date(store.deactivatedAt) : null;
    
    // Check if store should be archived (90 days after deactivation)
    if (deactivatedAt && now.getTime() - deactivatedAt.getTime() > 90 * 24 * 60 * 60 * 1000) {
      return 'archived';
    }
    
    // Check if store is in grace period
    if (now > expiresAt && gracePeriodEndsAt && now <= gracePeriodEndsAt) {
      return 'grace_period';
    }
    
    // Check if store should be deactivated
    if (now > expiresAt && (!gracePeriodEndsAt || now > gracePeriodEndsAt)) {
      return 'deactivated';
    }
    
    // Store is active
    if (now <= expiresAt) {
      return 'active';
    }
    
    return store.status;
  },

  updateStoreStatus: async (storeId) => {
    if (!storeId) {
      logger.error('[StoreStore] No storeId for status update');
      return;
    }
    
    const { stores, checkStoreStatus } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) {
      logger.error('[StoreStore] Store not found for status update:', storeId);
      return;
    }
    
    const oldStatus = store.status;
    const newStatus = checkStoreStatus(storeId);
    const now = new Date().toISOString();
    
    let updates: Partial<Store> = { status: newStatus };
    
    if (newStatus === 'grace_period' && !store.gracePeriodEndsAt) {
      // Start grace period (7 days after expiration)
      const gracePeriodEnd = new Date(store.expiresAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
      updates.gracePeriodEndsAt = gracePeriodEnd.toISOString();
      updates.isActive = true; // Keep active during grace period
      logger.info('[StoreStore] Grace period started:', { storeId, storeName: store.name, gracePeriodEnd: updates.gracePeriodEndsAt });
    } else if (newStatus === 'deactivated' && !store.deactivatedAt) {
      // Deactivate store
      updates.deactivatedAt = now;
      updates.isActive = false;
      logger.warn('[StoreStore] Store deactivated:', { storeId, storeName: store.name });
    } else if (newStatus === 'archived' && !store.archivedAt) {
      // Archive store
      updates.archivedAt = now;
      updates.isActive = false;
      logger.info('[StoreStore] Store archived:', { storeId, storeName: store.name });
    }
    
    if (oldStatus !== newStatus) {
      logger.info('[StoreStore] Store status changed:', { storeId, oldStatus, newStatus });
    }
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, ...updates } : s
      )
    }));
  },

  renewStore: async (storeId, planId) => {
    // ✅ Input validation
    if (!storeId || typeof storeId !== 'string') {
      logger.error('[StoreStore] Invalid storeId for renewal:', storeId);
      throw new Error('Invalid store ID');
    }
    
    if (!planId || typeof planId !== 'string') {
      logger.error('[StoreStore] Invalid planId for renewal:', planId);
      throw new Error('Invalid plan ID');
    }
    
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    const plan = storePlans.find(p => p.id === planId);
    
    if (!store) {
      logger.error('[StoreStore] Store not found for renewal:', storeId);
      throw new Error('Store not found');
    }
    
    if (!plan) {
      logger.error('[StoreStore] Plan not found for renewal:', planId);
      throw new Error('Plan not found');
    }
    
    logger.info('[StoreStore] Renewing store:', { storeId, storeName: store.name, planId, planDuration: plan.duration });
    
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    
    const updates: Partial<Store> = {
      plan,
      expiresAt: newExpiresAt.toISOString(),
      status: 'active',
      isActive: true,
      gracePeriodEndsAt: undefined,
      deactivatedAt: undefined,
      archivedAt: undefined,
      maxAds: plan.maxAds
    };
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, ...updates } : s
      )
    }));
    
    logger.info('[StoreStore] Store renewed successfully:', { storeId, newExpiresAt: newExpiresAt.toISOString() });
  },

  sendPaymentReminder: async (storeId) => {
    const now = new Date().toISOString();
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, lastPaymentReminder: now } : s
      )
    }));
  },

  getStoresByStatus: (status) => {
    const { stores } = get();
    return stores.filter(store => store.status === status);
  },

  canStoreBeReactivated: (storeId) => {
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return false;
    
    // Can reactivate if deactivated but not archived
    return store.status === 'deactivated' && !store.archivedAt;
  },

  reactivateStore: async (storeId, planId) => {
    if (!storeId || typeof storeId !== 'string') {
      logger.error('[StoreStore] Invalid storeId for reactivation:', storeId);
      throw new Error('Invalid store ID');
    }
    
    const { canStoreBeReactivated, renewStore } = get();
    
    if (!canStoreBeReactivated(storeId)) {
      logger.error('[StoreStore] Store cannot be reactivated:', storeId);
      throw new Error('Store cannot be reactivated');
    }
    
    logger.info('[StoreStore] Reactivating store:', storeId);
    await renewStore(storeId, planId);
  },

  getExpirationInfo: (storeId) => {
    if (!storeId) {
      logger.error('[StoreStore] No storeId provided to getExpirationInfo');
      return null;
    }
    
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) {
      logger.warn('[StoreStore] Store not found for expiration info:', storeId);
      return null;
    }
    
    const now = new Date();
    const expiresAt = new Date(store.expiresAt);
    const gracePeriodEndsAt = store.gracePeriodEndsAt ? new Date(store.gracePeriodEndsAt) : null;
    const deactivatedAt = store.deactivatedAt ? new Date(store.deactivatedAt) : null;
    
    // ✅ Validate dates
    if (isNaN(expiresAt.getTime())) {
      logger.error('[StoreStore] Invalid expiresAt date for store:', { storeId, expiresAt: store.expiresAt });
      return null;
    }
    
    if (gracePeriodEndsAt && isNaN(gracePeriodEndsAt.getTime())) {
      logger.error('[StoreStore] Invalid gracePeriodEndsAt date:', { storeId, gracePeriodEndsAt: store.gracePeriodEndsAt });
      return null;
    }
    
    if (deactivatedAt && isNaN(deactivatedAt.getTime())) {
      logger.error('[StoreStore] Invalid deactivatedAt date:', { storeId, deactivatedAt: store.deactivatedAt });
      return null;
    }
    
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInGracePeriod = gracePeriodEndsAt ? Math.max(0, Math.ceil((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const daysSinceDeactivation = deactivatedAt ? Math.max(0, Math.ceil((now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    let nextAction = '';
    let nextActionDate = '';
    
    switch (store.status) {
      case 'active':
        if (daysUntilExpiration <= 7) {
          nextAction = 'Mağaza tezliklə bitəcək - yeniləyin';
          nextActionDate = expiresAt.toLocaleDateString();
        } else {
          nextAction = 'Mağaza aktiv';
          nextActionDate = expiresAt.toLocaleDateString();
        }
        break;
      case 'grace_period':
        nextAction = 'Güzəşt müddəti bitəcək - yeniləyin';
        nextActionDate = gracePeriodEndsAt?.toLocaleDateString() || '';
        break;
      case 'deactivated':
        if (daysSinceDeactivation < 90) {
          nextAction = 'Reaktiv edin və ya arxivə köçürüləcək';
          const archiveDate = new Date(deactivatedAt!.getTime() + 90 * 24 * 60 * 60 * 1000);
          nextActionDate = archiveDate.toLocaleDateString();
        } else {
          nextAction = 'Arxivə köçürülməli';
          nextActionDate = '';
        }
        break;
      case 'archived':
        nextAction = 'Arxivdə - reaktiv etmək mümkündür';
        nextActionDate = '';
        break;
    }
    
    return {
      status: store.status,
      daysUntilExpiration,
      daysInGracePeriod,
      daysSinceDeactivation,
      canReactivate: store.status === 'deactivated' || store.status === 'archived',
      nextAction,
      nextActionDate
    };
  },

  sendExpirationNotification: async (storeId, type) => {
    if (!storeId) {
      logger.error('[StoreStore] No storeId for notification');
      return;
    }
    
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) {
      logger.error('[StoreStore] Store not found for notification:', storeId);
      return;
    }
    
    // In a real app, this would send push notifications or emails
    logger.info(`[StoreStore] 📧 Expiration notification sent for store ${store.name}:`, type);
    
    // Update last notification time
    const now = new Date().toISOString();
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, lastPaymentReminder: now } : s
      )
    }));
  },

  getExpiredStoreActions: (storeId) => {
    const { stores, canStoreBeReactivated } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return {
      canRenew: false,
      canReactivate: false,
      canArchive: false,
      recommendedAction: 'Store not found'
    };
    
    const now = new Date();
    const deactivatedAt = store.deactivatedAt ? new Date(store.deactivatedAt) : null;
    const daysSinceDeactivation = deactivatedAt ? Math.ceil((now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    let recommendedAction = '';
    
    switch (store.status) {
      case 'active':
        recommendedAction = 'Mağaza aktiv - əlavə əməliyyat tələb olunmur';
        break;
      case 'grace_period':
        recommendedAction = 'Dərhal yeniləyin - güzəşt müddəti bitir';
        break;
      case 'deactivated':
        if (daysSinceDeactivation < 30) {
          recommendedAction = 'Tezliklə reaktiv edin - arxivə köçürülmə riski';
        } else if (daysSinceDeactivation < 90) {
          recommendedAction = 'Son şans - tezliklə reaktiv edin';
        } else {
          recommendedAction = 'Arxivə köçürülməli - reaktivasiya hələ mümkündür';
        }
        break;
      case 'archived':
        recommendedAction = 'Reaktiv edin - bütün məlumatlar qorunub';
        break;
    }
    
    return {
      canRenew: store.status === 'active' || store.status === 'grace_period',
      canReactivate: canStoreBeReactivated(storeId) || store.status === 'archived',
      canArchive: store.status === 'deactivated' && daysSinceDeactivation >= 90,
      recommendedAction
    };
  },

  // Multi-store management functions
  getActiveStoreForUser: (userId) => {
    const { stores, activeStoreId, getAllUserStores } = get();
    
    // If there's an active store ID set, return that store
    if (activeStoreId) {
      const activeStore = stores.find(s => s.id === activeStoreId && s.userId === userId);
      if (activeStore && (activeStore.status === 'active' || activeStore.status === 'grace_period')) {
        return activeStore;
      }
    }
    
    // Otherwise, return the first active store for the user
    const userStores = getAllUserStores(userId);
    return userStores.find(s => s.status === 'active' || s.status === 'grace_period') || userStores[0] || null;
  },

  switchActiveStore: async (userId, storeId) => {
    const { stores } = get();
    const store = stores.find(s => s.id === storeId && s.userId === userId);
    
    if (!store) {
      throw new Error('Store not found or not owned by user');
    }
    
    set({ activeStoreId: storeId });
  },

  getUserStoreSettings: (userId, storeId) => {
    const { userStoreSettings } = get();
    return userStoreSettings[userId]?.[storeId] || {
      notifications: true,
      autoRenewal: false,
      publicProfile: true,
      showContact: true,
      allowMessages: true,
      showRating: true,
      analyticsSharing: false,
      promotionalEmails: true,
      smsNotifications: false,
      weeklyReports: true,
      listingExpirationNotifications: true,
      autoArchiveExpired: true
    };
  },

  updateUserStoreSettings: async (userId, storeId, settings) => {
    set(state => ({
      userStoreSettings: {
        ...state.userStoreSettings,
        [userId]: {
          ...state.userStoreSettings[userId],
          [storeId]: {
            ...state.userStoreSettings[userId]?.[storeId],
            ...settings
          }
        }
      }
    }));
  },

  canUserCreateNewStore: (userId) => {
    const { getAllUserStores } = get();
    const userStores = getAllUserStores(userId);
    
    // Basic users can have 1 store, premium users can have 3, business users can have 10
    const maxStores = 3; // This could be based on user subscription
    return userStores.length < maxStores;
  },

  getUserStoreLimit: (userId) => {
    // This could be based on user subscription level
    return 3; // Basic limit
  },

  getStoreListingConflicts: (storeId) => {
    try {
      const { stores } = get();
      const store = stores.find(s => s.id === storeId);
      if (!store) return [];
      
      const storeExpiresAt = new Date(store.expiresAt);
      
      // Mock data for demonstration - in real app this would check actual listings
      // that have expiration dates longer than the store expiration
      const mockConflicts = [
        {
          listingId: '1',
          title: 'iPhone 15 Pro Max',
          remainingDays: 25
        },
        {
          listingId: '2', 
          title: 'MacBook Air M2',
          remainingDays: 30
        },
        {
          listingId: '3',
          title: 'Samsung Galaxy S24',
          remainingDays: 20
        }
      ];
      
      // Only return conflicts if store is expiring soon (within 30 days)
      const daysUntilStoreExpires = Math.ceil((storeExpiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStoreExpires <= 30) {
        return mockConflicts.filter(conflict => conflict.remainingDays > daysUntilStoreExpires);
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to get store listing conflicts:', error);
      return [];
    }
  }
}));