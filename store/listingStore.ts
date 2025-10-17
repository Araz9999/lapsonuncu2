import { create } from 'zustand';
import { listings as mockListings } from '@/mocks/listings';
import { Listing } from '@/types/listing';
import { useThemeStore } from './themeStore';

import { logger } from '@/utils/logger';
interface ListingState {
  listings: Listing[];
  filteredListings: Listing[];
  searchQuery: string;
  selectedCategory: number | null;
  selectedSubcategory: number | null;
  priceRange: { min: number | null; max: number | null };
  sortBy: 'date' | 'price-asc' | 'price-desc' | null;
  userUnusedViews: { [userId: string]: number }; // Track unused views per user
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: number | null) => void;
  setSelectedSubcategory: (subcategoryId: number | null) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sort: 'date' | 'price-asc' | 'price-desc' | null) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  deleteListingEarly: (storeId: string, id: string) => Promise<void>;
  addListingToStore: (listing: Listing, storeId?: string) => Promise<void>;
  promoteListing: (id: string, type: 'premium' | 'vip' | 'featured', duration: number) => Promise<void>;
  promoteListingInStore: (id: string, type: 'vip' | 'premium' | 'featured', price: number) => Promise<void>;
  incrementViewCount: (id: string) => void;
  checkExpiringListings: () => void;
  purchaseViews: (id: string, viewCount: number) => Promise<void>;
  applyCreativeEffects: (id: string, effects: any[], effectEndDates: any[]) => Promise<void>;
  getUserUnusedViews: (userId: string) => number;
  transferUnusedViewsToNewListing: (userId: string, listingId: string) => void;
}

// Helper function to notify store followers when a new listing is added
const notifyStoreFollowersIfNeeded = async (listing: Listing) => {
  // This will be called from components that have access to store context
  // We'll implement this in the component level to avoid circular dependencies
};

// Check for expiring listings - this will be called from app initialization
let expiringListingsInterval: NodeJS.Timeout | null = null;

export const initListingStoreInterval = () => {
  if (expiringListingsInterval) {
    clearInterval(expiringListingsInterval);
  }
  expiringListingsInterval = setInterval(() => {
    const store = useListingStore.getState();
    store.checkExpiringListings();
  }, 60 * 60 * 1000);
};

export const cleanupListingStoreInterval = () => {
  if (expiringListingsInterval) {
    clearInterval(expiringListingsInterval);
    expiringListingsInterval = null;
  }
};

export const useListingStore = create<ListingState>((set, get) => ({
  listings: mockListings,
  filteredListings: mockListings,
  searchQuery: '',
  selectedCategory: null,
  selectedSubcategory: null,
  priceRange: { min: null, max: null },
  sortBy: null,
  userUnusedViews: {},
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },
  
  setSelectedCategory: (categoryId) => {
    set({ 
      selectedCategory: categoryId,
      selectedSubcategory: null
    });
    get().applyFilters();
  },
  
  setSelectedSubcategory: (subcategoryId) => {
    set({ selectedSubcategory: subcategoryId });
    get().applyFilters();
  },
  
  setPriceRange: (min, max) => {
    set({ priceRange: { min, max } });
    get().applyFilters();
  },
  
  setSortBy: (sort) => {
    set({ sortBy: sort });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { 
      listings, 
      searchQuery, 
      selectedCategory, 
      selectedSubcategory,
      priceRange,
      sortBy
    } = get();
    
    // BUG FIX: Validate listings array exists
    if (!listings || !Array.isArray(listings)) {
      logger.error('[ListingStore] Invalid listings array');
      set({ filteredListings: [] });
      return;
    }
    
    // Filter out deleted listings
    let filtered = listings.filter(listing => !listing.deletedAt);
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(listing => {
        // BUG FIX: Safe property access with null checks
        const titleAz = listing.title?.az?.toLowerCase() || '';
        const titleRu = listing.title?.ru?.toLowerCase() || '';
        const descAz = listing.description?.az?.toLowerCase() || '';
        const descRu = listing.description?.ru?.toLowerCase() || '';
        
        return titleAz.includes(normalizedQuery) || 
               titleRu.includes(normalizedQuery) ||
               descAz.includes(normalizedQuery) ||
               descRu.includes(normalizedQuery);
      });
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(listing => listing.categoryId === selectedCategory);
    }
    
    // Apply subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter(listing => listing.subcategoryId === selectedSubcategory);
    }
    
    // Apply price range filter
    if (priceRange.min !== null) {
      filtered = filtered.filter(listing => listing.price >= (priceRange.min || 0));
    }
    
    if (priceRange.max !== null) {
      filtered = filtered.filter(listing => listing.price <= (priceRange.max || Infinity));
    }
    
    // Apply sorting with featured listings priority (create a copy to avoid mutation)
    filtered = [...filtered].sort((a, b) => {
      // First priority: Featured listings (with purchased views) go to top
      if (a.isFeatured && a.purchasedViews && !b.isFeatured) return -1;
      if (b.isFeatured && b.purchasedViews && !a.isFeatured) return 1;
      
      // Second priority: Other featured listings
      if (a.isFeatured && !b.isFeatured) return -1;
      if (b.isFeatured && !a.isFeatured) return 1;
      
      // Third priority: Premium listings
      if (a.isPremium && !b.isPremium) return -1;
      if (b.isPremium && !a.isPremium) return 1;
      
      // Fourth priority: VIP listings
      if (a.isVip && !b.isVip) return -1;
      if (b.isVip && !a.isVip) return 1;
      
      // Apply user-selected sorting for same-tier listings
      if (sortBy) {
        switch (sortBy) {
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
        }
      }
      
      // Default: sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    set({ filteredListings: filtered });
  },
  
  resetFilters: () => {
    set({
      searchQuery: '',
      selectedCategory: null,
      selectedSubcategory: null,
      priceRange: { min: null, max: null },
      sortBy: null,
      filteredListings: get().listings
    });
  },
  
  addListing: (listing) => {
    logger.debug('[ListingStore] Adding listing:', listing.id, listing.title);
    
    // BUG FIX: Check if listing already exists
    const existingListing = get().listings.find(l => l.id === listing.id);
    if (existingListing) {
      logger.warn('[ListingStore] Listing already exists, updating instead:', listing.id);
      get().updateListing(listing.id, listing);
      return;
    }
    
    // BUG FIX: Validate listing has required fields
    if (!listing.id || !listing.title || !listing.userId) {
      logger.error('[ListingStore] Invalid listing data:', listing);
      throw new Error('Listing must have id, title, and userId');
    }
    
    set(state => ({
      listings: [listing, ...state.listings]
    }));
    
    // Check if user has unused views and apply them automatically
    const { getUserUnusedViews, transferUnusedViewsToNewListing } = get();
    const unusedViews = getUserUnusedViews(listing.userId);
    if (unusedViews > 0) {
      transferUnusedViewsToNewListing(listing.userId, listing.id);
      
      // Send notification about auto-applied views
      setTimeout(() => {
        const { sendNotification } = useThemeStore.getState();
        sendNotification(
          'Baxışlar avtomatik tətbiq edildi',
          `${unusedViews} istifadə olunmayan baxış yeni elanınıza avtomatik olaraq tətbiq edildi.`
        );
      }, 100);
    }
    
    get().applyFilters();
    logger.debug('[ListingStore] Listing added successfully. Total listings:', get().listings.length);
  },

  addListingToStore: async (listing, storeId) => {
    logger.debug('[ListingStore] addListingToStore called:', { listingId: listing.id, storeId });
    
    // Add listing to main listings first
    const { addListing } = get();
    addListing(listing);
    
    // Verify listing was added
    const addedListing = get().listings.find(l => l.id === listing.id);
    logger.debug('[ListingStore] Listing verification after add:', addedListing ? 'Found' : 'Not found');
    
    // If storeId is provided, add to store and notify followers
    if (storeId) {
      try {
        logger.debug('[ListingStore] Adding listing to store:', storeId);
        // Import store functions dynamically to avoid circular dependency
        const { useStoreStore } = await import('@/store/storeStore');
        const { addListingToStore } = useStoreStore.getState();
        await addListingToStore(storeId, listing.id);
        logger.debug('[ListingStore] Successfully added listing to store');
      } catch (error) {
        logger.error('[ListingStore] Failed to add listing to store:', error);
      }
    }
  },
  
  updateListing: (id, updates) => {
    // BUG FIX: Validate listing exists before updating
    const existingListing = get().listings.find(l => l.id === id);
    if (!existingListing) {
      logger.warn('[ListingStore] Listing not found for update:', id);
      return;
    }
    
    // BUG FIX: Validate updates object is not empty
    if (!updates || Object.keys(updates).length === 0) {
      logger.warn('[ListingStore] No updates provided for listing:', id);
      return;
    }
    
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id ? { ...listing, ...updates } : listing
      )
    }));
    get().applyFilters();
  },
  
  deleteListing: (id) => {
    // BUG FIX: Validate listing exists before deleting
    const existingListing = get().listings.find(l => l.id === id);
    if (!existingListing) {
      logger.warn('[ListingStore] Listing not found for deletion:', id);
      return;
    }
    
    // BUG FIX: Use soft delete instead of hard delete to preserve data
    const now = new Date().toISOString();
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { ...listing, deletedAt: now }
          : listing
      )
    }));
    
    logger.info('[ListingStore] Listing soft deleted:', id);
    get().applyFilters();
  },

  deleteListingEarly: async (storeId, id) => {
    const now = new Date().toISOString();
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { ...listing, deletedAt: now }
          : listing
      )
    }));
    
    // Update store's deleted listings
    try {
      const { useStoreStore } = await import('@/store/storeStore');
      const { deleteListingEarly } = useStoreStore.getState();
      await deleteListingEarly(storeId, id);
    } catch (error) {
      logger.error('Failed to update store deleted listings:', error);
    }
    
    get().applyFilters();
  },
  
  promoteListing: async (id, type, duration) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const promotionEndDate = new Date();
    promotionEndDate.setDate(promotionEndDate.getDate() + duration);
    
    // Add grace period for non-store paid listings (2 days)
    const gracePeriodEndDate = new Date(promotionEndDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 2);
    
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { 
              ...listing, 
              isPremium: type === 'premium' || type === 'vip',
              isFeatured: type === 'featured' || type === 'vip',
              isVip: type === 'vip',
              adType: type,
              // Add promotion end date for future reference
              promotionEndDate: promotionEndDate.toISOString(),
              // Add grace period for non-store paid listings
              gracePeriodEndDate: gracePeriodEndDate.toISOString()
            } 
          : listing
      )
    }));
    get().applyFilters();
  },

  promoteListingInStore: async (id, type, price) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { 
              ...listing, 
              isPremium: type === 'premium' || type === 'vip',
              isFeatured: type === 'featured' || type === 'vip',
              isVip: type === 'vip',
              adType: type
            } 
          : listing
      )
    }));
    get().applyFilters();
  },

  incrementViewCount: (id) => {
    set(state => ({
      listings: state.listings.map(listing => {
        if (listing.id === id) {
          const newViews = listing.views + 1;
          const updatedListing = { ...listing, views: newViews };
          
          // Check if we should remove from featured based on purchased views
          if (listing.targetViewsForFeatured && newViews >= listing.targetViewsForFeatured) {
            updatedListing.isFeatured = false;
            updatedListing.targetViewsForFeatured = undefined;
            
            // Send notification that featured period ended
            setTimeout(() => {
              const { sendNotification } = useThemeStore.getState();
              sendNotification(
                'Ön sıra müddəti bitdi',
                `"${listing.title.az}" elanınız alınan baxış sayına çatdığı üçün ön sıralardan çıxarıldı.`
              );
            }, 100);
          }
          
          return updatedListing;
        }
        return listing;
      })
    }));
    get().applyFilters();
  },

  checkExpiringListings: () => {
    const { listings, userUnusedViews } = get();
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    listings.forEach(listing => {
      if (listing.deletedAt) return;
      
      const expiresAt = new Date(listing.expiresAt);
      const timeDiff = expiresAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Check if listing has expired
      if (daysRemaining <= 0) {
        // Handle unused views when listing expires
        if (listing.targetViewsForFeatured && listing.views < listing.targetViewsForFeatured) {
          const unusedViews = listing.targetViewsForFeatured - listing.views;
          const currentUnusedViews = userUnusedViews[listing.userId] || 0;
          
          set(state => ({
            userUnusedViews: {
              ...state.userUnusedViews,
              [listing.userId]: currentUnusedViews + unusedViews
            }
          }));
          
          // Send notification about unused views
          const { sendNotification } = useThemeStore.getState();
          sendNotification(
            'İstifadə olunmayan baxışlar saxlanıldı',
            `"${listing.title.az}" elanınızın müddəti bitdi. ${unusedViews} istifadə olunmayan baxış yeni elanlarınızda avtomatik tətbiq olunacaq.`
          );
        }
        
        // Mark listing as expired
        get().updateListing(listing.id, {
          isFeatured: false,
          targetViewsForFeatured: undefined,
          purchasedViews: undefined
        });
        
        return;
      }
      
      // Send notification if listing expires in 3 days or less
      if (daysRemaining <= 3 && daysRemaining > 0) {
        const { sendNotification } = useThemeStore.getState();
        sendNotification(
          'Elan müddəti bitir',
          `"${listing.title.az}" elanınızın müddəti ${daysRemaining} gündə bitəcək`
        );
      }
      
      // Check for expired promotions and grace periods
      if (listing.promotionEndDate) {
        const promotionEndDate = new Date(listing.promotionEndDate);
        if (now > promotionEndDate) {
          // Check if grace period exists for non-store paid listings
          if (listing.gracePeriodEndDate && !listing.storeId) {
            const gracePeriodEndDate = new Date(listing.gracePeriodEndDate);
            if (now > gracePeriodEndDate) {
              // Grace period ended, remove promotion
              get().updateListing(listing.id, {
                isPremium: false,
                isFeatured: false,
                isVip: false,
                adType: 'free',
                promotionEndDate: undefined,
                gracePeriodEndDate: undefined
              });
              
              const { sendNotification } = useThemeStore.getState();
              sendNotification(
                'Güzəşt müddəti bitdi',
                `"${listing.title.az}" elanınızın güzəşt müddəti bitdi və elan adi rejimə keçdi.`
              );
            } else {
              // In grace period, send notification
              const graceDaysRemaining = Math.ceil((gracePeriodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (graceDaysRemaining <= 1) {
                const { sendNotification } = useThemeStore.getState();
                sendNotification(
                  'Güzəşt müddəti bitir',
                  `"${listing.title.az}" elanınızın güzəşt müddəti ${graceDaysRemaining} gündə bitəcək`
                );
              }
            }
          } else {
            // No grace period or store listing, remove promotion immediately
            get().updateListing(listing.id, {
              isPremium: false,
              isFeatured: false,
              isVip: false,
              adType: 'free',
              promotionEndDate: undefined
            });
            
            const { sendNotification } = useThemeStore.getState();
            sendNotification(
              'Təşviq müddəti bitdi',
              `"${listing.title.az}" elanınızın təşviq müddəti bitdi və elan adi rejimə keçdi.`
            );
          }
        }
      }
    });
  },

  purchaseViews: async (id: string, viewCount: number) => {
    // BUG FIX: Validate viewCount
    if (!viewCount || viewCount <= 0 || !Number.isInteger(viewCount)) {
      logger.error('[ListingStore] Invalid view count:', viewCount);
      throw new Error('Baxış sayı müsbət tam ədəd olmalıdır');
    }
    
    // BUG FIX: Set reasonable maximum
    if (viewCount > 100000) {
      logger.error('[ListingStore] View count too high:', viewCount);
      throw new Error('Maksimum 100,000 baxış satın ala bilərsiniz');
    }
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = get();
    const listing = state.listings.find(l => l.id === id);
    
    // BUG FIX: Validate listing exists
    if (!listing) {
      logger.error('[ListingStore] Listing not found for view purchase:', id);
      throw new Error('Elan tapılmadı');
    }
    
    // BUG FIX: Check if listing is already deleted
    if (listing.deletedAt) {
      logger.error('[ListingStore] Cannot purchase views for deleted listing:', id);
      throw new Error('Silinmiş elan üçün baxış satın ala bilməzsiniz');
    }
    
    // Calculate the target view count (current views + purchased views)
    const currentViews = listing.views;
    const targetViews = currentViews + viewCount;
    
    // Add purchased views to the listing and make it featured
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { 
              ...listing, 
              purchasedViews: (listing.purchasedViews || 0) + viewCount,
              // Make featured immediately when views are purchased
              isFeatured: true,
              // Store the target view count for when to remove from featured
              targetViewsForFeatured: targetViews
            }
          : listing
      )
    }));
    
    get().applyFilters();
    
    // Send success notification
    const { sendNotification } = useThemeStore.getState();
    sendNotification(
      'Baxış satın alındı',
      `${viewCount} baxış uğurla satın alındı. Elanınız ${targetViews} baxışa çatana qədər ön sıralarda görünəcək.`
    );
  },

  applyCreativeEffects: async (id: string, effects: any[], effectEndDates: any[]) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = get();
    const listing = state.listings.find(l => l.id === id);
    if (!listing) return;
    
    // Apply creative effects to the listing
    set(state => ({
      listings: state.listings.map(listing => 
        listing.id === id 
          ? { 
              ...listing, 
              creativeEffects: effects.map((effect, index) => ({
                ...effect,
                endDate: effectEndDates[index].endDate.toISOString(),
                isActive: true
              }))
            }
          : listing
      )
    }));
    
    get().applyFilters();
    
    // Send success notification
    const { sendNotification } = useThemeStore.getState();
    sendNotification(
      'Kreativ effektlər tətbiq edildi',
      `${effects.length} kreativ effekt elanınıza uğurla tətbiq edildi.`
    );
  },

  getUserUnusedViews: (userId: string) => {
    const { userUnusedViews } = get();
    return userUnusedViews[userId] || 0;
  },

  transferUnusedViewsToNewListing: (userId: string, listingId: string) => {
    const { userUnusedViews } = get();
    const unusedViews = userUnusedViews[userId] || 0;
    
    if (unusedViews > 0) {
      // Clear unused views for this user
      set(state => ({
        userUnusedViews: {
          ...state.userUnusedViews,
          [userId]: 0
        }
      }));
      
      // Apply unused views to the new listing
      const state = get();
      const listing = state.listings.find(l => l.id === listingId);
      if (listing) {
        const targetViews = listing.views + unusedViews;
        
        set(state => ({
          listings: state.listings.map(listing => 
            listing.id === listingId 
              ? { 
                  ...listing, 
                  purchasedViews: (listing.purchasedViews || 0) + unusedViews,
                  isFeatured: true,
                  targetViewsForFeatured: targetViews
                }
              : listing
          )
        }));
        
        get().applyFilters();
      }
    }
  }
}));