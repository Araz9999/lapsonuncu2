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
    // ===== VALIDATION START =====
    
    // 1. Check required fields
    if (!discount.storeId || typeof discount.storeId !== 'string') {
      throw new Error('Mağaza ID-si tələb olunur');
    }
    
    if (!discount.title || typeof discount.title !== 'string' || discount.title.trim().length === 0) {
      throw new Error('Endirim başlığı tələb olunur');
    }
    
    if (discount.title.trim().length > 100) {
      throw new Error('Başlıq maksimum 100 simvol ola bilər');
    }
    
    // 2. Type validation
    const validTypes = ['percentage', 'fixed_amount', 'buy_x_get_y'];
    if (!validTypes.includes(discount.type)) {
      throw new Error('Endirim növü düzgün deyil');
    }
    
    // 3. Value validation
    if (typeof discount.value !== 'number' || isNaN(discount.value) || !isFinite(discount.value)) {
      throw new Error('Endirim dəyəri düzgün deyil');
    }
    
    if (discount.type === 'percentage') {
      if (discount.value < 1 || discount.value > 99) {
        throw new Error('Faiz endirimi 1-99 arasında olmalıdır');
      }
    } else if (discount.type === 'fixed_amount') {
      if (discount.value <= 0) {
        throw new Error('Endirim məbləği müsbət olmalıdır');
      }
      if (discount.value > 10000) {
        throw new Error('Endirim məbləği maksimum 10,000 AZN ola bilər');
      }
    }
    
    // 4. Date validation
    if (!(discount.startDate instanceof Date) || isNaN(discount.startDate.getTime())) {
      throw new Error('Başlama tarixi etibarsızdır');
    }
    
    if (!(discount.endDate instanceof Date) || isNaN(discount.endDate.getTime())) {
      throw new Error('Bitmə tarixi etibarsızdır');
    }
    
    if (discount.startDate >= discount.endDate) {
      throw new Error('Başlama tarixi bitmə tarixindən əvvəl olmalıdır');
    }
    
    const maxDuration = 365 * 24 * 60 * 60 * 1000;
    if (discount.endDate.getTime() - discount.startDate.getTime() > maxDuration) {
      throw new Error('Endirim müddəti maksimum 1 il ola bilər');
    }
    
    // 5. Listings validation
    if (!Array.isArray(discount.applicableListings) || discount.applicableListings.length === 0) {
      throw new Error('Ən azı bir məhsul seçin');
    }
    
    // 6. Optional fields validation
    if (discount.minPurchaseAmount !== undefined) {
      if (typeof discount.minPurchaseAmount !== 'number' || discount.minPurchaseAmount < 0) {
        throw new Error('Minimum alış məbləği düzgün deyil');
      }
    }
    
    if (discount.maxDiscountAmount !== undefined) {
      if (typeof discount.maxDiscountAmount !== 'number' || discount.maxDiscountAmount <= 0) {
        throw new Error('Maksimum endirim məbləği düzgün deyil');
      }
    }
    
    if (discount.usageLimit !== undefined) {
      if (typeof discount.usageLimit !== 'number' || discount.usageLimit <= 0 || !Number.isInteger(discount.usageLimit)) {
        throw new Error('İstifadə limiti tam ədəd olmalıdır');
      }
    }
    
    // ===== VALIDATION END =====
    
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