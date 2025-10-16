export interface SocialProvider {
  provider: 'google' | 'facebook' | 'vk';
  socialId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface DBUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  passwordHash?: string;
  socialProviders: SocialProvider[];
  role: 'user' | 'moderator' | 'admin';
  balance: number;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: string;
}

class UserDatabase {
  private users: Map<string, DBUser> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private socialIndex: Map<string, string> = new Map();
  private verificationTokenIndex: Map<string, string> = new Map();
  private passwordResetTokenIndex: Map<string, string> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultUsers();
    this.startCleanupTask();
  }

  /**
   * BUG FIX: Periodically clean up expired tokens to prevent memory leaks
   */
  private startCleanupTask() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  /**
   * BUG FIX: Remove expired tokens from memory
   */
  private cleanupExpiredTokens() {
    const now = new Date();
    let cleanedCount = 0;

    // Clean up verification tokens
    for (const [token, userId] of this.verificationTokenIndex.entries()) {
      const user = this.users.get(userId);
      if (user?.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < now) {
        this.verificationTokenIndex.delete(token);
        cleanedCount++;
      }
    }

    // Clean up password reset tokens
    for (const [token, userId] of this.passwordResetTokenIndex.entries()) {
      const user = this.users.get(userId);
      if (user?.passwordResetTokenExpiry && new Date(user.passwordResetTokenExpiry) < now) {
        this.passwordResetTokenIndex.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[DB] Cleaned up ${cleanedCount} expired tokens`);
    }
  }

  /**
   * BUG FIX: Cleanup method for graceful shutdown
   */
  public cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private initializeDefaultUsers() {
    const defaultUser: DBUser = {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      phone: '+1234567890',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passwordHash: 'demo-password-hash',
      socialProviders: [],
      role: 'user',
      balance: 0,
    };

    this.users.set(defaultUser.id, defaultUser);
    this.emailIndex.set(defaultUser.email.toLowerCase(), defaultUser.id);
  }

  async findByEmail(email: string): Promise<DBUser | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findById(id: string): Promise<DBUser | null> {
    return this.users.get(id) || null;
  }

  async findBySocialId(provider: string, socialId: string): Promise<DBUser | null> {
    const key = `${provider}:${socialId}`;
    const userId = this.socialIndex.get(key);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async createUser(userData: Partial<DBUser>): Promise<DBUser> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const user: DBUser = {
      id,
      email: userData.email || '',
      name: userData.name || 'User',
      avatar: userData.avatar,
      phone: userData.phone,
      verified: userData.verified || false,
      createdAt: now,
      updatedAt: now,
      passwordHash: userData.passwordHash,
      socialProviders: userData.socialProviders || [],
      role: userData.role || 'user',
      balance: userData.balance || 0,
    };

    this.users.set(id, user);
    
    if (user.email) {
      this.emailIndex.set(user.email.toLowerCase(), id);
    }

    user.socialProviders.forEach(provider => {
      const key = `${provider.provider}:${provider.socialId}`;
      this.socialIndex.set(key, id);
    });

    console.log(`[DB] Created user: ${user.id} (${user.email})`);
    return user;
  }

  async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: DBUser = {
      ...user,
      ...updates,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);

    if (updates.email && updates.email !== user.email) {
      this.emailIndex.delete(user.email.toLowerCase());
      this.emailIndex.set(updates.email.toLowerCase(), id);
    }

    console.log(`[DB] Updated user: ${id}`);
    return updatedUser;
  }

  async addSocialProvider(userId: string, provider: SocialProvider): Promise<DBUser | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const existingProviderIndex = user.socialProviders.findIndex(
      p => p.provider === provider.provider
    );

    if (existingProviderIndex >= 0) {
      user.socialProviders[existingProviderIndex] = provider;
    } else {
      user.socialProviders.push(provider);
    }

    const key = `${provider.provider}:${provider.socialId}`;
    this.socialIndex.set(key, userId);

    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    console.log(`[DB] Added ${provider.provider} provider to user: ${userId}`);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // BUG FIX: Remove from all indexes to prevent stale references
    this.emailIndex.delete(user.email.toLowerCase());
    
    user.socialProviders.forEach(provider => {
      const key = `${provider.provider}:${provider.socialId}`;
      this.socialIndex.delete(key);
    });

    // BUG FIX: Clean up token indexes
    if (user.verificationToken) {
      this.verificationTokenIndex.delete(user.verificationToken);
    }
    if (user.passwordResetToken) {
      this.passwordResetTokenIndex.delete(user.passwordResetToken);
    }

    this.users.delete(id);
    console.log(`[DB] Deleted user: ${id}`);
    return true;
  }

  async getAllUsers(): Promise<DBUser[]> {
    return Array.from(this.users.values());
  }

  async findByVerificationToken(token: string): Promise<DBUser | null> {
    const userId = this.verificationTokenIndex.get(token);
    if (!userId) return null;
    const user = this.users.get(userId);
    if (!user) return null;

    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      return null;
    }

    return user;
  }

  async findByPasswordResetToken(token: string): Promise<DBUser | null> {
    const userId = this.passwordResetTokenIndex.get(token);
    if (!userId) return null;
    const user = this.users.get(userId);
    if (!user) return null;

    if (user.passwordResetTokenExpiry && new Date(user.passwordResetTokenExpiry) < new Date()) {
      return null;
    }

    return user;
  }

  async setVerificationToken(userId: string, token: string, expiryHours: number = 24): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);

    user.verificationToken = token;
    user.verificationTokenExpiry = expiry.toISOString();
    user.updatedAt = new Date().toISOString();

    this.users.set(userId, user);
    this.verificationTokenIndex.set(token, userId);

    console.log(`[DB] Set verification token for user: ${userId}`);
    return true;
  }

  async setPasswordResetToken(userId: string, token: string, expiryHours: number = 1): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);

    user.passwordResetToken = token;
    user.passwordResetTokenExpiry = expiry.toISOString();
    user.updatedAt = new Date().toISOString();

    this.users.set(userId, user);
    this.passwordResetTokenIndex.set(token, userId);

    console.log(`[DB] Set password reset token for user: ${userId}`);
    return true;
  }

  async verifyEmail(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    if (user.verificationToken) {
      this.verificationTokenIndex.delete(user.verificationToken);
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    user.updatedAt = new Date().toISOString();

    this.users.set(userId, user);

    console.log(`[DB] Verified email for user: ${userId}`);
    return true;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    if (user.passwordResetToken) {
      this.passwordResetTokenIndex.delete(user.passwordResetToken);
    }

    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    user.updatedAt = new Date().toISOString();

    this.users.set(userId, user);

    console.log(`[DB] Updated password for user: ${userId}`);
    return true;
  }
}

export const userDB = new UserDatabase();
