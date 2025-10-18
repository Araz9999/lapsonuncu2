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
  renewStore: (storeId: string, planId: string, applyDiscount?: boolean) => Promise<void>;
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
        throw new Error('User already has an active store');
      }
      
      // BUG FIX: Generate unique ID with random component
      const newStore: Store = {
        ...storeData,
        id: `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      // ✅ VALIDATION START
      
      // 1. Validate storeId
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        logger.error('[deleteStore] Invalid storeId:', storeId);
        throw new Error('Invalid store ID');
      }
      
      // 2. Check if store exists
      const { stores } = get();
      const store = stores.find(s => s.id === storeId);
      
      if (!store) {
        logger.error('[deleteStore] Store not found:', storeId);
        throw new Error('Store not found');
      }
      
      // 3. Check if store is already deleted/archived
      if (store.status === 'archived' || store.archivedAt) {
        logger.warn('[deleteStore] Store already archived:', storeId);
        throw new Error('Store is already deleted');
      }
      
      // 4. Check for active listings
      const { useListingStore } = await import('@/store/listingStore');
      const { listings } = useListingStore.getState();
      
      const activeStoreListings = listings.filter(l => 
        l.storeId === storeId && 
        !l.deletedAt &&
        !store.deletedListings.includes(l.id)
      );
      
      if (activeStoreListings.length > 0) {
        logger.warn('[deleteStore] Store has active listings:', {
          storeId,
          activeListingsCount: activeStoreListings.length
        });
        throw new Error(`Store has ${activeStoreListings.length} active listings. Please delete all listings first.`);
      }
      
      // 5. Validate store data for notification
      const followerCount = Array.isArray(store.followers) ? store.followers.length : 0;
      const deletedListingsCount = Array.isArray(store.deletedListings) ? store.deletedListings.length : 0;
      
      logger.info('[deleteStore] Deleting store:', {
        storeId,
        name: store.name,
        followers: followerCount,
        deletedListings: deletedListingsCount,
        status: store.status
      });
      
      // ✅ VALIDATION END
      
      // Soft delete - archive the store
      const now = new Date().toISOString();
      
      set(state => ({
        stores: state.stores.map(s => 
          s.id === storeId 
            ? { 
                ...s, 
                status: 'archived' as StoreStatus, 
                archivedAt: now,
                isActive: false  // ✅ Also set isActive to false
              }
            : s
        ),
        isLoading: false
      }));
      
      logger.info('[deleteStore] Store archived successfully:', storeId);
      
      // ✅ Notify followers (async, don't wait)
      if (followerCount > 0 && Array.isArray(store.followers)) {
        setTimeout(async () => {
          try {
            const { useNotificationStore } = await import('@/store/notificationStore');
            const { addNotification } = useNotificationStore.getState();
            
            for (const followerId of store.followers) {
              if (followerId && typeof followerId === 'string') {
                addNotification({
                  id: `store-deleted-${storeId}-${followerId}-${Date.now()}`,
                  type: 'store',
                  title: store.name || 'Mağaza',
                  message: 'Mağaza silindi',
                  fromUserId: store.userId || '',
                  fromUserName: store.name || 'Mağaza',
                  fromUserAvatar: '',
                  timestamp: Date.now(),
                  isRead: false
                });
              }
            }
            
            logger.info('[deleteStore] Notified followers:', followerCount);
          } catch (notifError) {
            logger.error('[deleteStore] Failed to notify followers:', notifError);
            // Don't throw - notification failure shouldn't fail deletion
          }
        }, 100);
      }
      
    } catch (error) {
      logger.error('[deleteStore] Failed to delete store:', error);
      set({ error: 'Failed to delete store', isLoading: false });
      throw error; // ✅ Re-throw for UI handling
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
        id: `follower-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        followers: state.followers.filter(f => !(f.userId === userId && f.storeId === storeId)),
        stores: state.stores.map(store => 
          store.id === storeId 
            ? { ...store, followers: store.followers.filter(id => id !== userId) }
            : store
        ),
        isLoading: false
      }));
    } catch {
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
      id: `notif-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`, // BUG FIX: Unique IDs
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
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        logger.error('[StoreStore] Invalid storeId for editStore');
        throw new Error('Invalid store ID');
      }
      
      // ✅ Validate updates object
      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        logger.error('[StoreStore] No updates provided');
        throw new Error('No updates provided');
      }
      
      // ✅ Find store
      const { stores } = get();
      const store = stores.find(s => s.id === storeId);
      
      if (!store) {
        logger.error('[StoreStore] Store not found:', storeId);
        throw new Error('Store not found');
      }
      
      // ✅ Validate name if provided
      if ('name' in updates) {
        if (!updates.name || typeof updates.name !== 'string' || updates.name.trim().length < 3 || updates.name.trim().length > 50) {
          logger.error('[StoreStore] Invalid store name');
          throw new Error('Store name must be 3-50 characters');
        }
      }
      
      // ✅ Validate address if provided
      if ('address' in updates) {
        if (!updates.address || typeof updates.address !== 'string' || updates.address.trim().length < 5 || updates.address.trim().length > 200) {
          logger.error('[StoreStore] Invalid store address');
          throw new Error('Store address must be 5-200 characters');
        }
      }
      
      // ✅ Validate description if provided
      if ('description' in updates && updates.description) {
        if (typeof updates.description !== 'string' || updates.description.trim().length > 1000) {
          logger.error('[StoreStore] Invalid store description');
          throw new Error('Store description must not exceed 1000 characters');
        }
      }
      
      // ✅ Validate contactInfo if provided
      if ('contactInfo' in updates && updates.contactInfo) {
        const contactInfo = updates.contactInfo as any;
        
        // Email validation
        if (contactInfo.email) {
          const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
          if (!emailRegex.test(contactInfo.email) || contactInfo.email.length > 255) {
            logger.error('[StoreStore] Invalid email format');
            throw new Error('Invalid email format');
          }
        }
        
        // Phone validation
        if (contactInfo.phone) {
          const phoneDigits = contactInfo.phone.replace(/\D/g, '');
          if (phoneDigits.length < 9 || phoneDigits.length > 15) {
            logger.error('[StoreStore] Invalid phone number');
            throw new Error('Phone number must be 9-15 digits');
          }
        }
        
        // WhatsApp validation
        if (contactInfo.whatsapp) {
          const whatsappDigits = contactInfo.whatsapp.replace(/\D/g, '');
          if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
            logger.error('[StoreStore] Invalid WhatsApp number');
            throw new Error('WhatsApp number must be 9-15 digits');
          }
        }
        
        // Website validation
        if (contactInfo.website) {
          try {
            const url = new URL(contactInfo.website);
            if (!['http:', 'https:'].includes(url.protocol)) {
              throw new Error('Invalid protocol');
            }
            if (contactInfo.website.length > 2083) {
              throw new Error('URL too long');
            }
          } catch (error) {
            logger.error('[StoreStore] Invalid website URL:', error);
            throw new Error('Invalid website URL');
          }
        }
      }
      
      logger.info('[StoreStore] Updating store:', storeId);
      
      set(state => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updates } : store
        ),
        isLoading: false
      }));
      
      logger.info('[StoreStore] Store updated successfully:', storeId);
    } catch (error) {
      logger.error('[StoreStore] Failed to edit store:', error);
      set({ error: 'Failed to edit store', isLoading: false });
      throw error;
    }
  },

  applyDiscountToProduct: async (storeId, listingId, discountPercentage) => {
    try {
      const { useListingStore } = await import('@/store/listingStore');
      const { updateListing, listings } = useListingStore.getState();
      
      const listing = listings.find(l => l.id === listingId && l.storeId === storeId);
      if (!listing) throw new Error('Listing not found in store');
      
      if (listing.priceByAgreement) {
        throw new Error('Cannot apply discount to price by agreement listings');
      }
      
      const discountAmount = (listing.price * discountPercentage) / 100;
      const discountedPrice = Math.max(0, listing.price - discountAmount);
      
      updateListing(listingId, {
        originalPrice: listing.originalPrice || listing.price,
        price: discountedPrice,
        discountPercentage,
        hasDiscount: true
      });
    } catch (error) {
      logger.error('Failed to apply discount:', error);
      throw error;
    }
  },

  removeDiscountFromProduct: async (storeId, listingId) => {
    try {
      const { useListingStore } = await import('@/store/listingStore');
      const { updateListing, listings } = useListingStore.getState();
      
      const listing = listings.find(l => l.id === listingId && l.storeId === storeId);
      if (!listing || !listing.hasDiscount) return;
      
      updateListing(listingId, {
        price: listing.originalPrice || listing.price,
        originalPrice: undefined,
        discountPercentage: undefined,
        hasDiscount: false
      });
    } catch (error) {
      logger.error('Failed to remove discount:', error);
      throw error;
    }
  },

  applyStoreWideDiscount: async (storeId, discountPercentage, excludeListingIds = []) => {
    try {
      const { useListingStore } = await import('@/store/listingStore');
      const { listings, updateListing } = useListingStore.getState();
      
      const storeListings = listings.filter(l => 
        l.storeId === storeId && 
        !excludeListingIds.includes(l.id) &&
        !l.deletedAt &&
        !l.priceByAgreement
      );
      
      for (const listing of storeListings) {
        const discountAmount = (listing.price * discountPercentage) / 100;
        const discountedPrice = Math.max(0, listing.price - discountAmount);
        
        updateListing(listing.id, {
          originalPrice: listing.originalPrice || listing.price,
          price: discountedPrice,
          discountPercentage,
          hasDiscount: true
        });
      }
    } catch (error) {
      logger.error('Failed to apply store-wide discount:', error);
      throw error;
    }
  },

  removeStoreWideDiscount: async (storeId) => {
    try {
      const { useListingStore } = await import('@/store/listingStore');
      const { listings, updateListing } = useListingStore.getState();
      
      const storeListings = listings.filter(l => 
        l.storeId === storeId && 
        l.hasDiscount &&
        !l.deletedAt
      );
      
      for (const listing of storeListings) {
        updateListing(listing.id, {
          price: listing.originalPrice || listing.price,
          originalPrice: undefined,
          discountPercentage: undefined,
          hasDiscount: false
        });
      }
    } catch (error) {
      logger.error('Failed to remove store-wide discount:', error);
      throw error;
    }
  },

  getStoreDiscounts: (storeId) => {
    try {
      // This would normally be imported dynamically, but for type safety we'll use a different approach
      const discounts: { listingId: string; originalPrice: number; discountedPrice: number; discountPercentage: number }[] = [];
      return discounts;
    } catch (error) {
      logger.error('Failed to get store discounts:', error);
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
    
    // AUTO-ARCHIVE: Check if store should be archived (90 days after deactivation)
    if (deactivatedAt) {
      const daysSinceDeactivation = (now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDeactivation >= 90) {
        // Auto-archive the store
        logger.info('[StoreStore] Auto-archiving store after 90 days:', { storeId, daysSinceDeactivation });
        
        // Update store status to archived
        set(state => ({
          stores: state.stores.map(s => 
            s.id === storeId 
              ? { ...s, status: 'archived' as StoreStatus, archivedAt: now.toISOString() }
              : s
          )
        }));
        
        return 'archived';
      }
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
    const { stores, checkStoreStatus } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    
    const newStatus = checkStoreStatus(storeId);
    const now = new Date().toISOString();
    
    let updates: Partial<Store> = { status: newStatus };
    
    if (newStatus === 'grace_period' && !store.gracePeriodEndsAt) {
      // Start grace period (7 days after expiration)
      const gracePeriodEnd = new Date(store.expiresAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
      updates.gracePeriodEndsAt = gracePeriodEnd.toISOString();
      updates.isActive = true; // Keep active during grace period
    } else if (newStatus === 'deactivated' && !store.deactivatedAt) {
      // Deactivate store
      updates.deactivatedAt = now;
      updates.isActive = false;
    } else if (newStatus === 'archived' && !store.archivedAt) {
      // Archive store
      updates.archivedAt = now;
      updates.isActive = false;
    }
    
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, ...updates } : s
      )
    }));
  },

  renewStore: async (storeId, planId) => {
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    const plan = storePlans.find(p => p.id === planId);
    
    if (!store || !plan) throw new Error('Store or plan not found');
    
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
    const { canStoreBeReactivated, renewStore } = get();
    
    if (!canStoreBeReactivated(storeId)) {
      throw new Error('Store cannot be reactivated');
    }
    
    await renewStore(storeId, planId);
  },

  getExpirationInfo: (storeId) => {
    const { stores, sendExpirationNotification } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return null;
    
    const now = new Date();
    const expiresAt = new Date(store.expiresAt);
    const gracePeriodEndsAt = store.gracePeriodEndsAt ? new Date(store.gracePeriodEndsAt) : null;
    const deactivatedAt = store.deactivatedAt ? new Date(store.deactivatedAt) : null;
    
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInGracePeriod = gracePeriodEndsAt ? Math.ceil((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysSinceDeactivation = deactivatedAt ? Math.ceil((now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // AUTO-SEND NOTIFICATIONS at 7, 3, 1 days before expiration
    if (store.status === 'active') {
      // Send notification 7 days before
      if (daysUntilExpiration === 7) {
        sendExpirationNotification(storeId, 'warning').catch(err => 
          logger.error('[getExpirationInfo] Failed to send 7-day notification:', err)
        );
      }
      // Send notification 3 days before
      else if (daysUntilExpiration === 3) {
        sendExpirationNotification(storeId, 'warning').catch(err => 
          logger.error('[getExpirationInfo] Failed to send 3-day notification:', err)
        );
      }
      // Send notification 1 day before
      else if (daysUntilExpiration === 1) {
        sendExpirationNotification(storeId, 'warning').catch(err => 
          logger.error('[getExpirationInfo] Failed to send 1-day notification:', err)
        );
      }
    }
    
    // Send grace period notification
    if (store.status === 'grace_period' && daysInGracePeriod > 0 && daysInGracePeriod <= 7) {
      // Send on first day of grace period
      if (daysInGracePeriod === 7) {
        sendExpirationNotification(storeId, 'grace_period').catch(err => 
          logger.error('[getExpirationInfo] Failed to send grace period notification:', err)
        );
      }
    }
    
    // Send deactivation notification
    if (store.status === 'deactivated' && daysSinceDeactivation === 0) {
      sendExpirationNotification(storeId, 'deactivated').catch(err => 
        logger.error('[getExpirationInfo] Failed to send deactivation notification:', err)
      );
    }
    
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
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) {
      logger.error('[StoreStore] Store not found for notification:', storeId);
      return;
    }
    
    // Validation: Check notification type
    if (!['warning', 'grace_period', 'deactivated'].includes(type)) {
      logger.error('[StoreStore] Invalid notification type:', type);
      return;
    }
    
    // Check if notification was already sent recently (prevent spam)
    if (store.lastPaymentReminder) {
      const lastNotification = new Date(store.lastPaymentReminder);
      const now = new Date();
      const hoursSinceLastNotification = (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60);
      
      // Don't send same notification within 12 hours
      if (hoursSinceLastNotification < 12) {
        logger.debug('[StoreStore] Notification already sent recently:', { storeId, type, hoursSinceLastNotification });
        return;
      }
    }
    
    // Create notification message
    let messageAz = '';
    let messageRu = '';
    let messageEn = '';
    
    switch (type) {
      case 'warning':
        messageAz = `${store.name} mağazanızın müddəti tezliklə bitir. Xidməti davam etdirmək üçün yeniləyin.`;
        messageRu = `Срок действия вашего магазина ${store.name} скоро истекает. Обновите для продолжения работы.`;
        messageEn = `Your store ${store.name} is expiring soon. Renew to continue service.`;
        break;
      case 'grace_period':
        messageAz = `${store.name} mağazanızın müddəti bitdi. 7 günlük güzəşt müddətiniz var. Yeniləyin və ya mağaza deaktiv ediləcək.`;
        messageRu = `Срок действия вашего магазина ${store.name} истек. У вас есть 7-дневный льготный период. Обновите или магазин будет деактивирован.`;
        messageEn = `Your store ${store.name} has expired. You have a 7-day grace period. Renew or the store will be deactivated.`;
        break;
      case 'deactivated':
        messageAz = `${store.name} mağazanız deaktiv edildi. Reaktiv etmək üçün ödəniş edin.`;
        messageRu = `Ваш магазин ${store.name} деактивирован. Оплатите для реактивации.`;
        messageEn = `Your store ${store.name} has been deactivated. Pay to reactivate.`;
        break;
    }
    
    // Create notification object
    const notification: StoreNotification = {
      id: `notif-exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      storeId,
      userId: store.userId,
      listingId: undefined, // No specific listing
      message: {
        az: messageAz,
        ru: messageRu,
        en: messageEn
      },
      createdAt: new Date().toISOString(),
      read: false,
      type: 'expiration' // Add notification type
    };
    
    // Add notification to store
    set(state => ({
      notifications: [...state.notifications, notification],
      stores: state.stores.map(s => 
        s.id === storeId ? { ...s, lastPaymentReminder: new Date().toISOString() } : s
      )
    }));
    
    logger.info('[StoreStore] Expiration notification sent:', { storeId, type, userId: store.userId });
    
    // TODO: In production, send push notification and email
    // await pushNotificationService.send(store.userId, notification);
    // await emailService.send(store.contactInfo.email, notification);
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