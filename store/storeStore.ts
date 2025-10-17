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
      const newStore: Store = {
        ...storeData,
        id: Date.now().toString(),
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
      set(state => ({
        stores: state.stores.filter(store => store.id !== storeId),
        isLoading: false
      }));
    } catch {
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
      const newFollower: StoreFollower = {
        id: Date.now().toString(),
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
    } catch {
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
    const { stores, followers } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const storeFollowers = followers.filter(f => f.storeId === storeId);
    const newNotifications: StoreNotification[] = storeFollowers.map(follower => ({
      id: `${Date.now()}-${follower.userId}`,
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
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store || (store.status !== 'active' && store.status !== 'grace_period')) return false;
    return store.adsUsed < store.maxAds;
  },

  addListingToStore: async (storeId, listingId) => {
    const { stores, canAddListing, notifyFollowers } = get();
    const store = stores.find(s => s.id === storeId);
    
    if (!store || !canAddListing(storeId)) {
      throw new Error('Cannot add listing to store');
    }

    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId 
          ? { ...s, adsUsed: s.adsUsed + 1 }
          : s
      )
    }));

    // Notify followers about new listing
    await notifyFollowers(storeId, listingId);
  },

  removeListingFromStore: async (storeId, listingId) => {
    set(state => ({
      stores: state.stores.map(s => 
        s.id === storeId 
          ? { ...s, adsUsed: Math.max(0, s.adsUsed - 1) }
          : s
      )
    }));
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
      set(state => ({
        stores: state.stores.map(store => 
          store.id === storeId ? { ...store, ...updates } : store
        ),
        isLoading: false
      }));
    } catch {
      set({ error: 'Failed to edit store', isLoading: false });
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
    const { stores } = get();
    const store = stores.find(s => s.id === storeId);
    if (!store) return null;
    
    const now = new Date();
    const expiresAt = new Date(store.expiresAt);
    const gracePeriodEndsAt = store.gracePeriodEndsAt ? new Date(store.gracePeriodEndsAt) : null;
    const deactivatedAt = store.deactivatedAt ? new Date(store.deactivatedAt) : null;
    
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInGracePeriod = gracePeriodEndsAt ? Math.ceil((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysSinceDeactivation = deactivatedAt ? Math.ceil((now.getTime() - deactivatedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
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
    if (!store) return;
    
    // In a real app, this would send push notifications or emails
    logger.debug(`📧 Expiration notification sent for store ${store.name}:`, type);
    
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