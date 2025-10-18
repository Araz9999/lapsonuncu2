import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/user';

import { logger } from '@/utils/logger';
interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  favorites: string[];
  freeAdsThisMonth: number;
  lastFreeAdDate: string | null;
  walletBalance: number;
  bonusBalance: number;
  blockedUsers: string[];
  nudgeHistory: Record<string, string>; // userId -> last nudge date
  mutedUsers: string[];
  followedUsers: string[];
  favoriteUsers: string[];
  trustedUsers: string[];
  reportedUsers: string[];
  subscribedUsers: string[];
  userNotes: Record<string, string>; // userId -> note
  login: (user: User) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  canPostFreeAd: () => boolean;
  incrementFreeAds: () => void;
  addToWallet: (amount: number) => void;
  addBonus: (amount: number) => void;
  spendFromWallet: (amount: number) => boolean;
  spendFromBonus: (amount: number) => boolean;
  spendFromBalance: (amount: number) => boolean;
  getTotalBalance: () => number;
  canAfford: (amount: number) => boolean;
  updateUserBalance: (userId: string, amount: number) => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'avatar'>>) => void;
  updatePrivacySettings: (settings: Partial<User['privacySettings']>) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isUserBlocked: (userId: string) => boolean;
  canNudgeUser: (userId: string) => boolean;
  nudgeUser: (userId: string) => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  isUserMuted: (userId: string) => boolean;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isUserFollowed: (userId: string) => boolean;
  addToFavoriteUsers: (userId: string) => void;
  removeFromFavoriteUsers: (userId: string) => void;
  isUserFavorite: (userId: string) => boolean;
  trustUser: (userId: string) => void;
  untrustUser: (userId: string) => void;
  isUserTrusted: (userId: string) => boolean;
  reportUser: (userId: string, reason: string) => void;
  isUserReported: (userId: string) => boolean;
  subscribeToUser: (userId: string) => void;
  unsubscribeFromUser: (userId: string) => void;
  isSubscribedToUser: (userId: string) => boolean;
  addUserNote: (userId: string, note: string) => void;
  removeUserNote: (userId: string) => void;
  getUserNote: (userId: string) => string | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      favorites: [],
      freeAdsThisMonth: 0,
      lastFreeAdDate: null,
      walletBalance: 0,
      bonusBalance: 0,
      blockedUsers: [],
      nudgeHistory: {},
      mutedUsers: [],
      followedUsers: [],
      favoriteUsers: [],
      trustedUsers: [],
      reportedUsers: [],
      subscribedUsers: [],
      userNotes: {},
      login: (user) => {
        // Ensure privacySettings has default values
        const userWithDefaults = {
          ...user,
          privacySettings: {
            hidePhoneNumber: false,
            allowDirectContact: true,
            onlyAppMessaging: false,
            ...user.privacySettings,
          },
        };
        set({ currentUser: userWithDefaults, isAuthenticated: true });
      },
      logout: () => set({ 
        currentUser: null, 
        isAuthenticated: false,
        freeAdsThisMonth: 0,
        lastFreeAdDate: null,
        walletBalance: 0,
        bonusBalance: 0,
        blockedUsers: [],
        nudgeHistory: {},
        mutedUsers: [],
        followedUsers: [],
        favoriteUsers: [],
        trustedUsers: [],
        reportedUsers: [],
        subscribedUsers: [],
        userNotes: {}
      }),
      toggleFavorite: (listingId) => {
        const { favorites } = get();
        if (favorites.includes(listingId)) {
          set({ favorites: favorites.filter(id => id !== listingId) });
        } else {
          set({ favorites: [...favorites, listingId] });
        }
      },
      canPostFreeAd: () => {
        const { freeAdsThisMonth, lastFreeAdDate } = get();
        const now = new Date();
        const lastDate = lastFreeAdDate ? new Date(lastFreeAdDate) : null;
        
        // Reset counter if it's a new month
        if (!lastDate || 
            lastDate.getMonth() !== now.getMonth() || 
            lastDate.getFullYear() !== now.getFullYear()) {
          set({ freeAdsThisMonth: 0 });
          return true;
        }
        
        return freeAdsThisMonth < 3;
      },
      incrementFreeAds: () => {
        const { freeAdsThisMonth } = get();
        set({ 
          freeAdsThisMonth: freeAdsThisMonth + 1,
          lastFreeAdDate: new Date().toISOString()
        });
      },
      addToWallet: (amount) => {
        // ===== VALIDATION START =====
        
        // 1. Check if amount is a number
        if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
          logger.error('[UserStore] Invalid amount for addToWallet:', amount);
          throw new Error('Məbləğ düzgün deyil');
        }
        
        // 2. Check if amount is positive
        if (amount <= 0) {
          logger.error('[UserStore] Amount must be positive:', amount);
          throw new Error('Məbləğ müsbət olmalıdır');
        }
        
        // 3. Check maximum single transaction (100,000 AZN)
        if (amount > 100000) {
          logger.error('[UserStore] Amount too large:', amount);
          throw new Error('Məbləğ çox böyükdür (maks 100,000 AZN)');
        }
        
        // 4. Check resulting balance won't overflow
        const { walletBalance } = get();
        const newBalance = walletBalance + amount;
        
        if (!isFinite(newBalance) || newBalance > 1000000) {
          logger.error('[UserStore] New balance would be too large:', newBalance);
          throw new Error('Maksimum balans limiti (1,000,000 AZN)');
        }
        
        // ===== VALIDATION END =====
        
        logger.info('[UserStore] Adding to wallet:', { amount, oldBalance: walletBalance, newBalance });
        set({ walletBalance: newBalance });
      },
      addBonus: (amount) => {
        // ===== VALIDATION START =====
        
        // 1. Check if amount is a number
        if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
          logger.error('[UserStore] Invalid amount for addBonus:', amount);
          throw new Error('Bonus məbləği düzgün deyil');
        }
        
        // 2. Check if amount is positive
        if (amount <= 0) {
          logger.error('[UserStore] Bonus amount must be positive:', amount);
          throw new Error('Bonus məbləği müsbət olmalıdır');
        }
        
        // 3. Check maximum single bonus (10,000 AZN)
        if (amount > 10000) {
          logger.error('[UserStore] Bonus amount too large:', amount);
          throw new Error('Bonus məbləği çox böyükdür (maks 10,000 AZN)');
        }
        
        // 4. Check resulting balance won't overflow
        const { bonusBalance } = get();
        const newBalance = bonusBalance + amount;
        
        if (!isFinite(newBalance) || newBalance > 100000) {
          logger.error('[UserStore] New bonus balance would be too large:', newBalance);
          throw new Error('Maksimum bonus limiti (100,000 AZN)');
        }
        
        // ===== VALIDATION END =====
        
        logger.info('[UserStore] Adding bonus:', { amount, oldBalance: bonusBalance, newBalance });
        set({ bonusBalance: newBalance });
      },
      spendFromWallet: (amount) => {
        const { walletBalance } = get();
        if (walletBalance >= amount) {
          set({ walletBalance: walletBalance - amount });
          return true;
        }
        return false;
      },
      spendFromBonus: (amount) => {
        const { bonusBalance } = get();
        if (bonusBalance >= amount) {
          set({ bonusBalance: bonusBalance - amount });
          return true;
        }
        return false;
      },
      spendFromBalance: (amount) => {
        const { walletBalance, bonusBalance } = get();
        const totalBalance = walletBalance + bonusBalance;
        
        if (totalBalance >= amount) {
          let remainingAmount = amount;
          let newBonusBalance = bonusBalance;
          let newWalletBalance = walletBalance;
          
          // First spend from bonus balance
          if (bonusBalance > 0) {
            const bonusToSpend = Math.min(bonusBalance, remainingAmount);
            newBonusBalance = bonusBalance - bonusToSpend;
            remainingAmount -= bonusToSpend;
          }
          
          // Then spend from wallet balance if needed
          if (remainingAmount > 0) {
            newWalletBalance = walletBalance - remainingAmount;
          }
          
          // Atomically update both balances in a single set() call to avoid race conditions
          set({ 
            bonusBalance: newBonusBalance,
            walletBalance: newWalletBalance 
          });
          
          return true;
        }
        return false;
      },
      getTotalBalance: () => {
        const { walletBalance, bonusBalance } = get();
        return walletBalance + bonusBalance;
      },
      canAfford: (amount) => {
        const { walletBalance, bonusBalance } = get();
        return (walletBalance + bonusBalance) >= amount;
      },
      updateUserBalance: async (userId, amount) => {
        const { currentUser } = get();
        if (currentUser && currentUser.id === userId) {
          const newBalance = Math.max(0, currentUser.balance + amount);
          set({ 
            currentUser: { ...currentUser, balance: newBalance }
          });
        }
      },
      updateUserProfile: (updates) => {
        // ===== VALIDATION START =====
        
        // ✅ 1. Check if updates is an object
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
          logger.error('[UserStore] Invalid updates object');
          throw new Error('Yeniləmələr düzgün deyil');
        }
        
        // ✅ 2. Validate allowed keys only
        const allowedKeys = ['name', 'email', 'phone', 'avatar'];
        const invalidKeys = Object.keys(updates).filter(key => !allowedKeys.includes(key));
        
        if (invalidKeys.length > 0) {
          logger.warn('[UserStore] Invalid profile update keys:', invalidKeys);
          throw new Error(`Yanlış sahə: ${invalidKeys.join(', ')}`);
        }
        
        // ✅ 3. Validate name
        if ('name' in updates) {
          const name = updates.name;
          if (typeof name !== 'string') {
            throw new Error('Ad mətn olmalıdır');
          }
          
          const trimmedName = name.trim();
          if (trimmedName.length < 2) {
            throw new Error('Ad ən azı 2 simvol olmalıdır');
          }
          if (trimmedName.length > 100) {
            throw new Error('Ad maksimum 100 simvol ola bilər');
          }
          
          updates.name = trimmedName;
        }
        
        // ✅ 4. Validate email
        if ('email' in updates) {
          const email = updates.email;
          if (typeof email !== 'string') {
            throw new Error('Email mətn olmalıdır');
          }
          
          const trimmedEmail = email.trim().toLowerCase();
          const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          
          if (!emailRegex.test(trimmedEmail)) {
            throw new Error('Email formatı düzgün deyil');
          }
          if (trimmedEmail.length > 255) {
            throw new Error('Email maksimum 255 simvol ola bilər');
          }
          
          updates.email = trimmedEmail;
        }
        
        // ✅ 5. Validate phone
        if ('phone' in updates) {
          const phone = updates.phone;
          if (typeof phone !== 'string') {
            throw new Error('Telefon mətn olmalıdır');
          }
          
          const cleanedPhone = phone.replace(/[^\d+]/g, '');
          if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
            throw new Error('Telefon nömrəsi 10-15 rəqəm olmalıdır');
          }
          
          updates.phone = cleanedPhone;
        }
        
        // ✅ 6. Validate avatar
        if ('avatar' in updates) {
          const avatar = updates.avatar;
          if (typeof avatar !== 'string') {
            throw new Error('Avatar URL mətn olmalıdır');
          }
          
          const trimmedAvatar = avatar.trim();
          if (trimmedAvatar.length > 500) {
            throw new Error('Avatar URL çox uzundur');
          }
          
          // Basic URL validation
          try {
            new URL(trimmedAvatar);
          } catch {
            throw new Error('Avatar URL düzgün deyil');
          }
          
          updates.avatar = trimmedAvatar;
        }
        
        // ✅ 7. Check if user is logged in
        const { currentUser } = get();
        if (!currentUser) {
          logger.error('[UserStore] No user logged in');
          throw new Error('İstifadəçi daxil olmayıb');
        }
        
        // ===== VALIDATION END =====
        
        logger.info('[UserStore] Updating user profile:', Object.keys(updates));
        
        set({
          currentUser: {
            ...currentUser,
            ...updates
          }
        });
      },
      updatePrivacySettings: (settings) => {
        // ===== VALIDATION START =====
        
        // ✅ 1. Check if settings is an object
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
          logger.error('[UserStore] Invalid settings object');
          throw new Error('Tənzimləmələr düzgün deyil');
        }
        
        // ✅ 2. Validate allowed keys only
        const allowedKeys = ['hidePhoneNumber', 'allowDirectContact', 'onlyAppMessaging'];
        const invalidKeys = Object.keys(settings).filter(key => !allowedKeys.includes(key));
        
        if (invalidKeys.length > 0) {
          logger.warn('[UserStore] Invalid privacy settings keys:', invalidKeys);
          // Remove invalid keys
          invalidKeys.forEach(key => delete (settings as any)[key]);
        }
        
        // ✅ 3. Validate values are booleans
        for (const key of Object.keys(settings)) {
          const value = (settings as any)[key];
          if (typeof value !== 'boolean') {
            logger.error('[UserStore] Privacy setting value must be boolean:', key, value);
            throw new Error(`Tənzimləmə dəyəri yanlışdır: ${key}`);
          }
        }
        
        // ✅ 4. Check conflicting settings
        if ('onlyAppMessaging' in settings && 'allowDirectContact' in settings) {
          if (settings.onlyAppMessaging === true && settings.allowDirectContact === true) {
            logger.warn('[UserStore] Conflicting privacy settings: both onlyAppMessaging and allowDirectContact are true');
            // Resolve conflict: onlyAppMessaging takes precedence
            settings.allowDirectContact = false;
          }
        }
        
        // ✅ 5. Check if user is logged in
        const { currentUser } = get();
        if (!currentUser) {
          logger.error('[UserStore] No user logged in');
          throw new Error('İstifadəçi daxil olmayıb');
        }
        
        // ===== VALIDATION END =====
        
        logger.info('[UserStore] Updating privacy settings:', settings);
        
        set({
          currentUser: {
            ...currentUser,
            privacySettings: {
              ...currentUser.privacySettings,
              ...settings
            }
          }
        });
      },
      blockUser: (userId) => {
        // BUG FIX: Validate userId
        if (!userId || typeof userId !== 'string') {
          logger.error('[UserStore] Invalid userId for blocking');
          return;
        }
        
        // BUG FIX: Don't allow blocking yourself
        const { currentUser } = get();
        if (currentUser && currentUser.id === userId) {
          logger.warn('[UserStore] Cannot block yourself');
          return;
        }
        
        const { blockedUsers } = get();
        if (!blockedUsers.includes(userId)) {
          set({ blockedUsers: [...blockedUsers, userId] });
          logger.info('[UserStore] User blocked:', userId);
        }
      },
      unblockUser: (userId) => {
        // BUG FIX: Validate userId
        if (!userId || typeof userId !== 'string') {
          logger.error('[UserStore] Invalid userId for unblocking');
          return;
        }
        
        const { blockedUsers } = get();
        set({ blockedUsers: blockedUsers.filter(id => id !== userId) });
        logger.info('[UserStore] User unblocked:', userId);
      },
      isUserBlocked: (userId) => {
        const { blockedUsers } = get();
        return blockedUsers.includes(userId);
      },
      canNudgeUser: (userId) => {
        const { nudgeHistory } = get();
        const lastNudge = nudgeHistory[userId];
        if (!lastNudge) return true;
        
        const lastNudgeDate = new Date(lastNudge);
        const now = new Date();
        const diffInHours = (now.getTime() - lastNudgeDate.getTime()) / (1000 * 60 * 60);
        
        return diffInHours >= 24; // Can nudge once per day
      },
      nudgeUser: (userId) => {
        const { nudgeHistory } = get();
        set({ 
          nudgeHistory: {
            ...nudgeHistory,
            [userId]: new Date().toISOString()
          }
        });
      },
      muteUser: (userId) => {
        const { mutedUsers } = get();
        if (!mutedUsers.includes(userId)) {
          set({ mutedUsers: [...mutedUsers, userId] });
        }
      },
      unmuteUser: (userId) => {
        const { mutedUsers } = get();
        set({ mutedUsers: mutedUsers.filter(id => id !== userId) });
      },
      isUserMuted: (userId) => {
        const { mutedUsers } = get();
        return mutedUsers.includes(userId);
      },
      followUser: (userId) => {
        const { followedUsers } = get();
        if (!followedUsers.includes(userId)) {
          set({ followedUsers: [...followedUsers, userId] });
        }
      },
      unfollowUser: (userId) => {
        const { followedUsers } = get();
        set({ followedUsers: followedUsers.filter(id => id !== userId) });
      },
      isUserFollowed: (userId) => {
        const { followedUsers } = get();
        return followedUsers.includes(userId);
      },
      addToFavoriteUsers: (userId) => {
        const { favoriteUsers } = get();
        if (!favoriteUsers.includes(userId)) {
          set({ favoriteUsers: [...favoriteUsers, userId] });
        }
      },
      removeFromFavoriteUsers: (userId) => {
        const { favoriteUsers } = get();
        set({ favoriteUsers: favoriteUsers.filter(id => id !== userId) });
      },
      isUserFavorite: (userId) => {
        const { favoriteUsers } = get();
        return favoriteUsers.includes(userId);
      },
      trustUser: (userId) => {
        const { trustedUsers } = get();
        if (!trustedUsers.includes(userId)) {
          set({ trustedUsers: [...trustedUsers, userId] });
        }
      },
      untrustUser: (userId) => {
        const { trustedUsers } = get();
        set({ trustedUsers: trustedUsers.filter(id => id !== userId) });
      },
      isUserTrusted: (userId) => {
        const { trustedUsers } = get();
        return trustedUsers.includes(userId);
      },
      reportUser: (userId, reason) => {
        const { reportedUsers } = get();
        if (!reportedUsers.includes(userId)) {
          set({ reportedUsers: [...reportedUsers, userId] });
          logger.debug(`User ${userId} reported for: ${reason}`);
        }
      },
      isUserReported: (userId) => {
        const { reportedUsers } = get();
        return reportedUsers.includes(userId);
      },
      subscribeToUser: (userId) => {
        const { subscribedUsers } = get();
        if (!subscribedUsers.includes(userId)) {
          set({ subscribedUsers: [...subscribedUsers, userId] });
        }
      },
      unsubscribeFromUser: (userId) => {
        const { subscribedUsers } = get();
        set({ subscribedUsers: subscribedUsers.filter(id => id !== userId) });
      },
      isSubscribedToUser: (userId) => {
        const { subscribedUsers } = get();
        return subscribedUsers.includes(userId);
      },
      addUserNote: (userId, note) => {
        const { userNotes } = get();
        set({ 
          userNotes: {
            ...userNotes,
            [userId]: note
          }
        });
      },
      removeUserNote: (userId) => {
        const { userNotes } = get();
        const newNotes = { ...userNotes };
        delete newNotes[userId];
        set({ userNotes: newNotes });
      },
      getUserNote: (userId) => {
        const { userNotes } = get();
        return userNotes[userId] || null;
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);