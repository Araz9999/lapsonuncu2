import { create } from 'zustand';
import { Discount, Campaign, DiscountCode } from '@/types/discount';

interface DiscountStore {
  discounts: Discount[];
  campaigns: Campaign[];
  discountCodes: DiscountCode[];
  
  // Discount actions
  addDiscount: (discount: Omit<Discount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  toggleDiscountStatus: (id: string) => void;
  
  // Campaign actions
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  toggleCampaignStatus: (id: string) => void;
  
  // Discount code actions
  generateDiscountCode: (discountId: string, code?: string) => void;
  deleteDiscountCode: (id: string) => void;
  
  // Getters
  getStoreDiscounts: (storeId: string) => Discount[];
  getStoreCampaigns: (storeId: string) => Campaign[];
  getActiveDiscounts: (storeId: string) => Discount[];
  getActiveCampaigns: (storeId: string) => Campaign[];
  getDiscountCodes: (discountId: string) => DiscountCode[];
  getActiveDiscountsForListing: (listingId: string) => Discount[];
  getActiveCampaignsForListing: (listingId: string) => Campaign[];
}

// Sample discount data for testing
const sampleDiscounts: Discount[] = [
  {
    id: 'discount1',
    storeId: '1',
    title: 'Yay endirimi',
    description: 'Bütün elektronika məhsullarına 15% endirim',
    type: 'percentage',
    value: 15,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
    isActive: true,
    applicableListings: ['1', '2', '3'],
    maxDiscountAmount: 500,
    minPurchaseAmount: 100,
    usageLimit: 100,
    usedCount: 25,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 'discount2',
    storeId: '1',
    title: 'Flash Sale',
    description: 'Məhdud müddətli super endirim!',
    type: 'fixed_amount',
    value: 200,
    startDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
    endDate: new Date(Date.now() + 19 * 60 * 60 * 1000), // Ends in 19 hours
    isActive: true,
    applicableListings: ['1'],
    usageLimit: 50,
    usedCount: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export const useDiscountStore = create<DiscountStore>((set, get) => ({
  discounts: sampleDiscounts,
  campaigns: [],
  discountCodes: [],
  
  addDiscount: (discount) => {
    const newDiscount: Discount = {
      ...discount,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      discounts: [...state.discounts, newDiscount],
    }));
  },
  
  updateDiscount: (id, updates) => {
    set((state) => ({
      discounts: state.discounts.map((discount) =>
        discount.id === id
          ? { ...discount, ...updates, updatedAt: new Date() }
          : discount
      ),
    }));
  },
  
  deleteDiscount: (id) => {
    set((state) => ({
      discounts: state.discounts.filter((discount) => discount.id !== id),
      discountCodes: state.discountCodes.filter((code) => code.discountId !== id),
    }));
  },
  
  toggleDiscountStatus: (id) => {
    set((state) => ({
      discounts: state.discounts.map((discount) =>
        discount.id === id
          ? { ...discount, isActive: !discount.isActive, updatedAt: new Date() }
          : discount
      ),
    }));
  },
  
  addCampaign: (campaign) => {
    const newCampaign: Campaign = {
      ...campaign,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      campaigns: [...state.campaigns, newCampaign],
    }));
  },
  
  updateCampaign: (id, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id === id
          ? { ...campaign, ...updates, updatedAt: new Date() }
          : campaign
      ),
    }));
  },
  
  deleteCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
    }));
  },
  
  toggleCampaignStatus: (id) => {
    set((state) => ({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id === id
          ? { ...campaign, isActive: !campaign.isActive, updatedAt: new Date() }
          : campaign
      ),
    }));
  },
  
  generateDiscountCode: (discountId, code) => {
    const newCode: DiscountCode = {
      id: Date.now().toString(),
      discountId,
      code: code || Math.random().toString(36).substring(2, 8).toUpperCase(),
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
    };
    set((state) => ({
      discountCodes: [...state.discountCodes, newCode],
    }));
  },
  
  deleteDiscountCode: (id) => {
    set((state) => ({
      discountCodes: state.discountCodes.filter((code) => code.id !== id),
    }));
  },
  
  getStoreDiscounts: (storeId) => {
    return get().discounts.filter((discount) => discount.storeId === storeId);
  },
  
  getStoreCampaigns: (storeId) => {
    return get().campaigns.filter((campaign) => campaign.storeId === storeId);
  },
  
  getActiveDiscounts: (storeId) => {
    const now = new Date();
    return get().discounts.filter(
      (discount) =>
        discount.storeId === storeId &&
        discount.isActive &&
        discount.startDate <= now &&
        discount.endDate >= now
    );
  },
  
  getActiveCampaigns: (storeId) => {
    const now = new Date();
    return get().campaigns.filter(
      (campaign) =>
        campaign.storeId === storeId &&
        campaign.isActive &&
        campaign.startDate <= now &&
        campaign.endDate >= now
    );
  },
  
  getDiscountCodes: (discountId) => {
    return get().discountCodes.filter((code) => code.discountId === discountId);
  },
  
  getActiveDiscountsForListing: (listingId) => {
    const now = new Date();
    return get().discounts.filter(
      (discount) =>
        discount.isActive &&
        discount.startDate <= now &&
        discount.endDate >= now &&
        discount.applicableListings.includes(listingId)
    );
  },
  
  getActiveCampaignsForListing: (listingId) => {
    const now = new Date();
    return get().campaigns.filter(
      (campaign) =>
        campaign.isActive &&
        campaign.startDate <= now &&
        campaign.endDate >= now &&
        campaign.featuredListings.includes(listingId)
    );
  },
}));