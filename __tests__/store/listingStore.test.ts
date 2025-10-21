/**
 * Unit tests for listing store
 * @module __tests__/store/listingStore
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useListingStore } from '@/store/listingStore';
import type { Listing } from '@/types/listing';

describe('ListingStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const { result } = renderHook(() => useListingStore());
    act(() => {
      result.current.clearListings();
    });
  });

  describe('addListing', () => {
    test('should add a new listing', () => {
      const { result } = renderHook(() => useListingStore());
      
      const newListing: Partial<Listing> = {
        title: { az: 'Test', ru: 'Тест' },
        description: { az: 'Desc', ru: 'Описание' },
        price: 100,
        categoryId: 1
      };

      act(() => {
        result.current.addListing(newListing as Listing);
      });

      expect(result.current.listings.length).toBeGreaterThan(0);
      expect(result.current.listings[0].title.az).toBe('Test');
    });

    test('should generate unique IDs for listings', () => {
      const { result } = renderHook(() => useListingStore());
      
      const listing1: Partial<Listing> = {
        title: { az: 'Test 1', ru: 'Тест 1' },
        price: 100
      };
      
      const listing2: Partial<Listing> = {
        title: { az: 'Test 2', ru: 'Тест 2' },
        price: 200
      };

      act(() => {
        result.current.addListing(listing1 as Listing);
        result.current.addListing(listing2 as Listing);
      });

      const ids = result.current.listings.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length); // All IDs should be unique
    });
  });

  describe('updateListing', () => {
    test('should update an existing listing', () => {
      const { result } = renderHook(() => useListingStore());
      
      let listingId: string;

      act(() => {
        const listing: Partial<Listing> = {
          title: { az: 'Original', ru: 'Оригинал' },
          price: 100
        };
        listingId = result.current.addListing(listing as Listing);
      });

      act(() => {
        result.current.updateListing(listingId, {
          title: { az: 'Updated', ru: 'Обновлено' },
          price: 150
        });
      });

      const updated = result.current.listings.find(l => l.id === listingId);
      expect(updated?.title.az).toBe('Updated');
      expect(updated?.price).toBe(150);
    });

    test('should not modify other listings when updating', () => {
      const { result } = renderHook(() => useListingStore());
      
      let listingId1: string, listingId2: string;

      act(() => {
        listingId1 = result.current.addListing({ title: { az: 'First', ru: 'Первый' }, price: 100 } as Listing);
        listingId2 = result.current.addListing({ title: { az: 'Second', ru: 'Второй' }, price: 200 } as Listing);
      });

      act(() => {
        result.current.updateListing(listingId1, { price: 150 });
      });

      const listing2 = result.current.listings.find(l => l.id === listingId2);
      expect(listing2?.price).toBe(200); // Should remain unchanged
    });
  });

  describe('deleteListing', () => {
    test('should soft delete a listing', () => {
      const { result } = renderHook(() => useListingStore());
      
      let listingId: string;

      act(() => {
        listingId = result.current.addListing({ title: { az: 'Test', ru: 'Тест' }, price: 100 } as Listing);
      });

      act(() => {
        result.current.deleteListing(listingId);
      });

      const deleted = result.current.listings.find(l => l.id === listingId);
      expect(deleted).toBeUndefined(); // Should be removed from active listings
    });
  });

  describe('getFilteredListings', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useListingStore());
      
      act(() => {
        result.current.addListing({
          title: { az: 'Cheap Item', ru: 'Дешевый' },
          price: 50,
          categoryId: 1,
          location: { az: 'Baku', ru: 'Баку' }
        } as Listing);
        
        result.current.addListing({
          title: { az: 'Expensive Item', ru: 'Дорогой' },
          price: 500,
          categoryId: 2,
          location: { az: 'Ganja', ru: 'Гянджа' }
        } as Listing);
      });
    });

    test('should filter by price range', () => {
      const { result } = renderHook(() => useListingStore());
      
      const filtered = result.current.getFilteredListings({
        priceRange: { min: 0, max: 100 }
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].price).toBe(50);
    });

    test('should filter by category', () => {
      const { result } = renderHook(() => useListingStore());
      
      const filtered = result.current.getFilteredListings({
        categoryId: 1
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].categoryId).toBe(1);
    });

    test('should filter by search query', () => {
      const { result } = renderHook(() => useListingStore());
      
      const filtered = result.current.getFilteredListings({
        query: 'Cheap'
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].title.az).toContain('Cheap');
    });
  });

  describe('incrementViewCount', () => {
    test('should increment view count', () => {
      const { result } = renderHook(() => useListingStore());
      
      let listingId: string;

      act(() => {
        listingId = result.current.addListing({
          title: { az: 'Test', ru: 'Тест' },
          price: 100,
          views: 0
        } as Listing);
      });

      act(() => {
        result.current.incrementViewCount(listingId);
      });

      const listing = result.current.listings.find(l => l.id === listingId);
      expect(listing?.views).toBe(1);
    });

    test('should handle multiple increments', () => {
      const { result } = renderHook(() => useListingStore());
      
      let listingId: string;

      act(() => {
        listingId = result.current.addListing({
          title: { az: 'Test', ru: 'Тест' },
          price: 100,
          views: 5
        } as Listing);
      });

      act(() => {
        result.current.incrementViewCount(listingId);
        result.current.incrementViewCount(listingId);
        result.current.incrementViewCount(listingId);
      });

      const listing = result.current.listings.find(l => l.id === listingId);
      expect(listing?.views).toBe(8);
    });
  });
});
