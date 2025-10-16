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
      login: (user) => set({ currentUser: user, isAuthenticated: true }),
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
        const { walletBalance } = get();
        set({ walletBalance: walletBalance + amount });
      },
      addBonus: (amount) => {
        const { bonusBalance } = get();
        set({ bonusBalance: bonusBalance + amount });
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
      updatePrivacySettings: (settings) => {
        const { currentUser } = get();
        if (currentUser) {
          set({
            currentUser: {
              ...currentUser,
              privacySettings: {
                ...currentUser.privacySettings,
                ...settings
              }
            }
          });
        }
      },
      blockUser: (userId) => {
        const { blockedUsers } = get();
        if (!blockedUsers.includes(userId)) {
          set({ blockedUsers: [...blockedUsers, userId] });
        }
      },
      unblockUser: (userId) => {
        const { blockedUsers } = get();
        set({ blockedUsers: blockedUsers.filter(id => id !== userId) });
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