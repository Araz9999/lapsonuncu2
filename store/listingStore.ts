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
  archiveListing: (id: string) => Promise<void>;
  reactivateListing: (id: string, packageId: string) => Promise<void>;
  getArchivedListings: (userId: string) => Listing[];
  getExpiringListings: (userId: string, days: number) => Listing[];
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
    
    // ✅ Early return if no filters applied (optimization)
    const hasFilters = 
      (searchQuery && searchQuery.trim()) ||
      selectedCategory ||
      selectedSubcategory ||
      priceRange.min !== null ||
      priceRange.max !== null ||
      sortBy;
    
    if (!hasFilters) {
      set({ filteredListings: filtered });
      return;
    }
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      
      // ✅ Validate and sanitize search query
      if (normalizedQuery.length > 200) {
        logger.warn('[ListingStore] Search query too long, truncating');
        // Don't filter if query is invalid
        set({ filteredListings: [] });
        return;
      }
      
      filtered = filtered.filter(listing => {
        // ✅ Safe property access with null checks
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
      // ✅ Validate min is a valid number
      const minPrice = typeof priceRange.min === 'number' && isFinite(priceRange.min) && priceRange.min >= 0 
        ? priceRange.min 
        : 0;
      
      filtered = filtered.filter(listing => {
        // ✅ Validate listing price is a valid number
        const listingPrice = typeof listing.price === 'number' && isFinite(listing.price) 
          ? listing.price 
          : 0;
        
        return listingPrice >= minPrice;
      });
    }
    
    if (priceRange.max !== null) {
      // ✅ Validate max is a valid number
      const maxPrice = typeof priceRange.max === 'number' && isFinite(priceRange.max) && priceRange.max >= 0
        ? priceRange.max 
        : Infinity;
      
      filtered = filtered.filter(listing => {
        // ✅ Validate listing price is a valid number
        const listingPrice = typeof listing.price === 'number' && isFinite(listing.price) 
          ? listing.price 
          : 0;
        
        return listingPrice <= maxPrice;
      });
    }
    
    // Apply sorting with VIP/Premium/Featured priority (create a copy to avoid mutation)
    filtered = [...filtered].sort((a, b) => {
      // ✅ CORRECT PRIORITY ORDER: VIP > Featured > Premium
      
      // First priority: VIP listings (highest tier)
      if (a.isVip && !b.isVip) return -1;
      if (b.isVip && !a.isVip) return 1;
      
      // Second priority: Featured listings (with or without purchased views)
      if (a.isFeatured && !b.isFeatured) return -1;
      if (b.isFeatured && !a.isFeatured) return 1;
      
      // Third priority: Premium listings
      if (a.isPremium && !b.isPremium) return -1;
      if (b.isPremium && !a.isPremium) return 1;
      
      // Fourth priority: Featured with purchased views (boost within same tier)
      if (a.isFeatured && a.purchasedViews && !b.purchasedViews) return -1;
      if (b.isFeatured && b.purchasedViews && !a.purchasedViews) return 1;
      
      // Apply user-selected sorting for same-tier listings
      if (sortBy) {
        switch (sortBy) {
          case 'date': {
            // ✅ Validate dates before comparison
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            
            // ✅ Handle invalid dates
            if (isNaN(dateA) && isNaN(dateB)) return 0;
            if (isNaN(dateA)) return 1; // Invalid dates go to bottom
            if (isNaN(dateB)) return -1;
            
            return dateB - dateA; // Newest first
          }
          case 'price-asc': {
            // ✅ Validate prices before comparison
            const priceA = typeof a.price === 'number' && isFinite(a.price) ? a.price : 0;
            const priceB = typeof b.price === 'number' && isFinite(b.price) ? b.price : 0;
            return priceA - priceB;
          }
          case 'price-desc': {
            // ✅ Validate prices before comparison
            const priceA = typeof a.price === 'number' && isFinite(a.price) ? a.price : 0;
            const priceB = typeof b.price === 'number' && isFinite(b.price) ? b.price : 0;
            return priceB - priceA;
          }
        }
      }
      
      // Default: sort by date (newest first)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      // ✅ Handle invalid dates
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1; // Invalid dates go to bottom
      if (isNaN(dateB)) return -1;
      
      return dateB - dateA; // Newest first
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
    try {
      // ✅ VALIDATION START
      
      // 1. Validate ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        logger.error('[promoteListing] Invalid listing ID:', id);
        throw new Error('Invalid listing ID');
      }
      
      // 2. Validate type
      const validTypes = ['premium', 'vip', 'featured'];
      if (!type || !validTypes.includes(type)) {
        logger.error('[promoteListing] Invalid promotion type:', type);
        throw new Error('Invalid promotion type. Must be: premium, vip, or featured');
      }
      
      // 3. Validate duration
      if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) {
        logger.error('[promoteListing] Invalid duration:', duration);
        throw new Error('Duration must be a positive number');
      }
      
      if (duration > 365) {
        logger.error('[promoteListing] Duration too long:', duration);
        throw new Error('Duration cannot exceed 365 days');
      }
      
      // 4. Find listing
      const { listings } = get();
      const listing = listings.find(l => l.id === id);
      
      if (!listing) {
        logger.error('[promoteListing] Listing not found:', id);
        throw new Error('Listing not found');
      }
      
      // 5. Check if listing is deleted
      if (listing.deletedAt) {
        logger.error('[promoteListing] Cannot promote deleted listing:', id);
        throw new Error('Cannot promote a deleted listing');
      }
      
      // 6. Check if listing is expired
      const now = new Date();
      const expiryDate = new Date(listing.expiresAt);
      if (expiryDate < now) {
        logger.error('[promoteListing] Cannot promote expired listing:', id);
        throw new Error('Cannot promote an expired listing');
      }
      
      // 7. Check for existing active promotion
      if (listing.promotionEndDate) {
        const currentPromotionEnd = new Date(listing.promotionEndDate);
        if (currentPromotionEnd > now) {
          logger.warn('[promoteListing] Listing already has active promotion:', {
            id,
            currentEnd: currentPromotionEnd.toISOString()
          });
          // We'll extend it instead of throwing error
        }
      }
      
      // ✅ VALIDATION END
      
      logger.info('[promoteListing] Promoting listing:', { id, type, duration });
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate promotion end date
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
      
      logger.info('[promoteListing] Promotion successful:', {
        id,
        type,
        endsAt: promotionEndDate.toISOString()
      });
    } catch (error) {
      logger.error('[promoteListing] Error:', error);
      throw error; // Re-throw for UI handling
    }
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
    // ✅ Validate ID
    if (!id || typeof id !== 'string') {
      logger.error('[incrementViewCount] Invalid ID:', id);
      return;
    }
    
    set(state => ({
      listings: state.listings.map(listing => {
        if (listing.id === id) {
          // ✅ Validate current views count
          const currentViews = typeof listing.views === 'number' && isFinite(listing.views) 
            ? listing.views 
            : 0;
          
          const newViews = currentViews + 1;
          
          // ✅ Sanity check: prevent unreasonably high view counts
          if (newViews > 10000000) { // 10 million max
            logger.warn('[incrementViewCount] View count too high, not incrementing:', { id, newViews });
            return listing;
          }
          
          const updatedListing = { ...listing, views: newViews };
          
          // Check if we should remove from featured based on purchased views
          if (listing.targetViewsForFeatured && 
              typeof listing.targetViewsForFeatured === 'number' &&
              newViews >= listing.targetViewsForFeatured) {
            updatedListing.isFeatured = false;
            updatedListing.targetViewsForFeatured = undefined;
            
            // Send notification that featured period ended
            setTimeout(() => {
              try {
                const { sendNotification } = useThemeStore.getState();
                if (sendNotification && typeof sendNotification === 'function') {
                  const title = listing.title && typeof listing.title === 'object' 
                    ? (listing.title.az || listing.title.en || listing.title.ru || 'Elanınız')
                    : 'Elanınız';
                  
                  sendNotification(
                    'Ön sıra müddəti bitdi',
                    `"${title}" elanınız alınan baxış sayına çatdığı üçün ön sıralardan çıxarıldı.`
                  );
                }
              } catch (error) {
                logger.error('[incrementViewCount] Failed to send notification:', error);
              }
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
    try {
      const { listings, userUnusedViews } = get();
      
      // ✅ Validate listings array
      if (!listings || !Array.isArray(listings)) {
        logger.error('[checkExpiringListings] Invalid listings array');
        return;
      }
      
      const now = new Date();
      
      // ✅ Validate current time
      if (isNaN(now.getTime())) {
        logger.error('[checkExpiringListings] Invalid current time');
        return;
      }
      
      logger.debug('[checkExpiringListings] Checking', listings.length, 'listings at', now.toISOString());
      
      // Track sent notifications to prevent duplicates
      const sentNotifications = new Set<string>();
      
      listings.forEach(listing => {
        // Skip deleted listings
        if (listing.deletedAt) return;
        
        // ✅ Validate listing data
        if (!listing.id || !listing.expiresAt || !listing.userId) {
          logger.warn('[checkExpiringListings] Invalid listing data:', listing.id);
          return;
        }
        
        const expiresAt = new Date(listing.expiresAt);
        
        // ✅ Validate expiration date
        if (isNaN(expiresAt.getTime())) {
          logger.error('[checkExpiringListings] Invalid expiresAt for listing:', listing.id);
          return;
        }
        
        const timeDiff = expiresAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        // ===== EXPIRED LISTINGS (0 or negative days) =====
        if (daysRemaining <= 0) {
          logger.info('[checkExpiringListings] Listing expired:', {
            id: listing.id,
            title: listing.title?.az || 'Unknown',
            daysRemaining
          });
          
          // Handle unused views when listing expires
          if (listing.targetViewsForFeatured && listing.views < listing.targetViewsForFeatured) {
            const unusedViews = listing.targetViewsForFeatured - listing.views;
            
            // ✅ Validate unusedViews calculation
            if (unusedViews > 0 && isFinite(unusedViews)) {
              const currentUnusedViews = userUnusedViews[listing.userId] || 0;
              
              set(state => ({
                userUnusedViews: {
                  ...state.userUnusedViews,
                  [listing.userId]: currentUnusedViews + unusedViews
                }
              }));
              
              // Send notification about unused views
              try {
                const { sendNotification } = useThemeStore.getState();
                if (sendNotification && typeof sendNotification === 'function') {
                  sendNotification(
                    'İstifadə olunmayan baxışlar saxlanıldı',
                    `"${listing.title?.az || 'Elanınız'}" elanınızın müddəti bitdi. ${unusedViews} istifadə olunmayan baxış yeni elanlarınızda avtomatik tətbiq olunacaq.`
                  );
                }
              } catch (notifError) {
                logger.error('[checkExpiringListings] Failed to send notification:', notifError);
              }
            }
          }
          
          // ✅ AUTO-ARCHIVE: Move expired listing to archived state
          get().updateListing(listing.id, {
            isFeatured: false,
            targetViewsForFeatured: undefined,
            purchasedViews: undefined,
            archivedAt: now.toISOString(),  // ✅ Mark as archived
            isArchived: true  // ✅ New field for archived status
          });
          
          logger.info('[checkExpiringListings] Listing auto-archived:', listing.id);
          
          return;
        }
        
        // ===== EXPIRING SOON NOTIFICATIONS =====
        
        // ✅ Send notification 7 days before expiration
        if (daysRemaining === 7) {
          const notifKey = `${listing.id}-7days`;
          if (!sentNotifications.has(notifKey)) {
            sentNotifications.add(notifKey);
            
            try {
              const { sendNotification } = useThemeStore.getState();
              if (sendNotification && typeof sendNotification === 'function') {
                sendNotification(
                  '📅 Elan müddəti bitir - 7 gün qalıb',
                  `"${listing.title?.az || 'Elanınız'}" elanınızın müddəti 7 gündə bitəcək.\n\n💡 İndi yeniləsəniz 15% endirim əldə edərsiniz!`
                );
                logger.info('[checkExpiringListings] Sent 7-day notification for:', listing.id);
              }
            } catch (notifError) {
              logger.error('[checkExpiringListings] Failed to send 7-day notification:', notifError);
            }
          }
        }
        
        // ✅ Send notification 3 days before expiration
        if (daysRemaining === 3) {
          const notifKey = `${listing.id}-3days`;
          if (!sentNotifications.has(notifKey)) {
            sentNotifications.add(notifKey);
            
            try {
              const { sendNotification } = useThemeStore.getState();
              if (sendNotification && typeof sendNotification === 'function') {
                sendNotification(
                  '⚠️ Elan müddəti bitir - 3 gün qalıb',
                  `"${listing.title?.az || 'Elanınız'}" elanınızın müddəti 3 gündə bitəcək.\n\n💡 İndi yeniləsəniz 10% endirim əldə edərsiniz!`
                );
                logger.info('[checkExpiringListings] Sent 3-day notification for:', listing.id);
              }
            } catch (notifError) {
              logger.error('[checkExpiringListings] Failed to send 3-day notification:', notifError);
            }
          }
        }
        
        // ✅ Send notification 1 day before expiration
        if (daysRemaining === 1) {
          const notifKey = `${listing.id}-1day`;
          if (!sentNotifications.has(notifKey)) {
            sentNotifications.add(notifKey);
            
            try {
              const { sendNotification } = useThemeStore.getState();
              if (sendNotification && typeof sendNotification === 'function') {
                sendNotification(
                  '🔴 SON GÜN! Elan sabah bitir',
                  `"${listing.title?.az || 'Elanınız'}" elanınızın müddəti SABAH bitəcək!\n\n💡 Dərhal yeniləsəniz 5% endirim əldə edərsiniz!`
                );
                logger.info('[checkExpiringListings] Sent 1-day notification for:', listing.id);
              }
            } catch (notifError) {
              logger.error('[checkExpiringListings] Failed to send 1-day notification:', notifError);
            }
          }
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
    // ===== VALIDATION START =====
    
    // ✅ 1. Validate viewCount
    if (!viewCount || viewCount <= 0 || !Number.isInteger(viewCount)) {
      logger.error('[ListingStore] Invalid view count:', viewCount);
      throw new Error('Baxış sayı müsbət tam ədəd olmalıdır');
    }
    
    // ✅ 2. Check minimum (10 views)
    if (viewCount < 10) {
      logger.error('[ListingStore] View count too low:', viewCount);
      throw new Error('Minimum 10 baxış satın ala bilərsiniz');
    }
    
    // ✅ 3. Set reasonable maximum
    if (viewCount > 100000) {
      logger.error('[ListingStore] View count too high:', viewCount);
      throw new Error('Maksimum 100,000 baxış satın ala bilərsiniz');
    }
    
    // ✅ 4. Calculate cost
    const cost = viewCount * 0.01;
    if (!isFinite(cost) || cost <= 0) {
      logger.error('[ListingStore] Invalid cost calculation:', cost);
      throw new Error('Məbləğ hesablana bilmədi');
    }
    
    // ✅ 5. Check balance
    const { walletBalance, bonusBalance } = useUserStore.getState();
    const totalBalance = (typeof walletBalance === 'number' && isFinite(walletBalance) ? walletBalance : 0) + 
                         (typeof bonusBalance === 'number' && isFinite(bonusBalance) ? bonusBalance : 0);
    
    if (cost > totalBalance) {
      logger.error('[ListingStore] Insufficient balance:', { cost, totalBalance });
      throw new Error(`Kifayət qədər balans yoxdur. Lazım: ${cost.toFixed(2)} AZN, Balans: ${totalBalance.toFixed(2)} AZN`);
    }
    
    const state = get();
    const listing = state.listings.find(l => l.id === id);
    
    // ✅ 6. Validate listing exists
    if (!listing) {
      logger.error('[ListingStore] Listing not found for view purchase:', id);
      throw new Error('Elan tapılmadı');
    }
    
    // ✅ 7. Check if listing is already deleted
    if (listing.deletedAt) {
      logger.error('[ListingStore] Cannot purchase views for deleted listing:', id);
      throw new Error('Silinmiş elan üçün baxış satın ala bilməzsiniz');
    }
    
    // ===== VALIDATION END =====
    
    // ✅ 8. Deduct from balance
    const { spendFromWallet, spendFromBonus } = useUserStore.getState();
    let remainingCost = cost;
    
    // Spend from bonus first
    if (bonusBalance > 0 && remainingCost > 0) {
      const bonusToSpend = Math.min(bonusBalance, remainingCost);
      spendFromBonus(bonusToSpend);
      remainingCost -= bonusToSpend;
    }
    
    // Then spend from wallet
    if (remainingCost > 0) {
      spendFromWallet(remainingCost);
    }
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    logger.info('[ListingStore] Creative effects applied successfully:', { 
      listingId: id,
      effectCount: effects.length
    });
    
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
  },

  archiveListing: async (id: string) => {
    try {
      // ✅ VALIDATION START
      
      // 1. Validate ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        logger.error('[archiveListing] Invalid listing ID:', id);
        throw new Error('Invalid listing ID');
      }
      
      // 2. Find listing
      const { listings } = get();
      const listing = listings.find(l => l.id === id);
      
      if (!listing) {
        logger.error('[archiveListing] Listing not found:', id);
        throw new Error('Listing not found');
      }
      
      // 3. Check if already deleted
      if (listing.deletedAt) {
        logger.warn('[archiveListing] Listing already deleted:', id);
        throw new Error('Cannot archive a deleted listing');
      }
      
      // 4. Check if already archived
      if (listing.isArchived || listing.archivedAt) {
        logger.warn('[archiveListing] Listing already archived:', id);
        throw new Error('Listing is already archived');
      }
      
      // ✅ VALIDATION END
      
      logger.info('[archiveListing] Archiving listing:', id);
      
      const now = new Date().toISOString();
      
      get().updateListing(id, {
        isArchived: true,
        archivedAt: now,
        isFeatured: false,
        isPremium: false,
        isVip: false
      });
      
      logger.info('[archiveListing] Listing archived successfully:', id);
    } catch (error) {
      logger.error('[archiveListing] Error:', error);
      throw error;
    }
  },

  reactivateListing: async (id: string, packageId: string) => {
    try {
      // ✅ VALIDATION START
      
      // 1. Validate ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        logger.error('[reactivateListing] Invalid listing ID:', id);
        throw new Error('Invalid listing ID');
      }
      
      // 2. Validate packageId
      if (!packageId || typeof packageId !== 'string' || packageId.trim().length === 0) {
        logger.error('[reactivateListing] Invalid package ID:', packageId);
        throw new Error('Invalid package ID');
      }
      
      // 3. Find package
      const { adPackages } = await import('@/constants/adPackages');
      const renewalPackage = adPackages.find(p => p.id === packageId);
      
      if (!renewalPackage) {
        logger.error('[reactivateListing] Package not found:', packageId);
        throw new Error('Renewal package not found');
      }
      
      // 4. Validate package data
      if (!renewalPackage.duration || renewalPackage.duration <= 0 || !isFinite(renewalPackage.duration)) {
        logger.error('[reactivateListing] Invalid package duration:', renewalPackage.duration);
        throw new Error('Invalid package duration');
      }
      
      if (renewalPackage.duration > 365) {
        logger.error('[reactivateListing] Package duration too long:', renewalPackage.duration);
        throw new Error('Package duration cannot exceed 365 days');
      }
      
      // 5. Find listing
      const { listings } = get();
      const listing = listings.find(l => l.id === id);
      
      if (!listing) {
        logger.error('[reactivateListing] Listing not found:', id);
        throw new Error('Listing not found');
      }
      
      // 6. Check if deleted
      if (listing.deletedAt) {
        logger.warn('[reactivateListing] Cannot reactivate deleted listing:', id);
        throw new Error('Cannot reactivate a deleted listing');
      }
      
      // 7. Check if archived
      if (!listing.isArchived && !listing.archivedAt) {
        logger.warn('[reactivateListing] Listing is not archived:', id);
        throw new Error('Listing is not archived');
      }
      
      // ✅ VALIDATION END
      
      logger.info('[reactivateListing] Reactivating listing:', {
        id,
        packageId,
        duration: renewalPackage.duration
      });
      
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + (renewalPackage.duration * 24 * 60 * 60 * 1000));
      
      get().updateListing(id, {
        isArchived: false,
        archivedAt: undefined,
        expiresAt: newExpiresAt.toISOString(),
        adType: renewalPackage.id as any
      });
      
      logger.info('[reactivateListing] Listing reactivated successfully:', {
        id,
        newExpiresAt: newExpiresAt.toISOString()
      });
    } catch (error) {
      logger.error('[reactivateListing] Error:', error);
      throw error;
    }
  },

  getArchivedListings: (userId: string) => {
    try {
      // ✅ Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        logger.error('[getArchivedListings] Invalid userId:', userId);
        return [];
      }
      
      const { listings } = get();
      
      // ✅ Validate listings array
      if (!listings || !Array.isArray(listings)) {
        logger.error('[getArchivedListings] Invalid listings array');
        return [];
      }
      
      const archivedListings = listings.filter(l => 
        l.userId === userId && 
        !l.deletedAt &&
        (l.isArchived || l.archivedAt)
      );
      
      logger.debug('[getArchivedListings] Found archived listings:', archivedListings.length);
      
      return archivedListings;
    } catch (error) {
      logger.error('[getArchivedListings] Error:', error);
      return [];
    }
  },

  getExpiringListings: (userId: string, days: number) => {
    try {
      // ✅ Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        logger.error('[getExpiringListings] Invalid userId:', userId);
        return [];
      }
      
      // ✅ Validate days
      if (typeof days !== 'number' || !isFinite(days) || days < 0) {
        logger.error('[getExpiringListings] Invalid days:', days);
        return [];
      }
      
      if (days > 365) {
        logger.error('[getExpiringListings] Days too large:', days);
        return [];
      }
      
      const { listings } = get();
      
      // ✅ Validate listings array
      if (!listings || !Array.isArray(listings)) {
        logger.error('[getExpiringListings] Invalid listings array');
        return [];
      }
      
      const now = new Date();
      const targetDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const expiringListings = listings.filter(l => {
        if (l.userId !== userId) return false;
        if (l.deletedAt) return false;
        if (l.isArchived || l.archivedAt) return false;
        
        const expiresAt = new Date(l.expiresAt);
        
        // Check if expiration date is valid
        if (isNaN(expiresAt.getTime())) {
          logger.warn('[getExpiringListings] Invalid expiresAt for listing:', l.id);
          return false;
        }
        
        // Check if listing expires within the specified days
        return expiresAt <= targetDate && expiresAt > now;
      });
      
      logger.debug('[getExpiringListings] Found expiring listings:', {
        userId,
        days,
        count: expiringListings.length
      });
      
      return expiringListings;
    } catch (error) {
      logger.error('[getExpiringListings] Error:', error);
      return [];
    }
  },
}));