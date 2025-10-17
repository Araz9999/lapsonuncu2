import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Report, ModerationAction, ModerationStats, SupportTicket, SupportResponse, ReportType, ReportStatus, ReportPriority, ModerationActionType, SupportCategory, TicketStatus } from '@/types/moderation';
import { User, ModeratorPermission } from '@/types/user';

interface ModerationState {
  reports: Report[];
  moderationActions: ModerationAction[];
  supportTickets: SupportTicket[];
  moderators: User[];
  stats: ModerationStats;
  
  // Report management
  createReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateReportStatus: (reportId: string, status: ReportStatus, moderatorId?: string, notes?: string) => void;
  assignReportToModerator: (reportId: string, moderatorId: string) => void;
  resolveReport: (reportId: string, resolution: string, moderatorId: string) => void;
  dismissReport: (reportId: string, reason: string, moderatorId: string) => void;
  
  // Moderation actions
  createModerationAction: (action: Omit<ModerationAction, 'id' | 'createdAt' | 'isActive'>) => void;
  deactivateModerationAction: (actionId: string) => void;
  
  // Support tickets
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'responses'>) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  assignTicketToModerator: (ticketId: string, moderatorId: string) => void;
  addTicketResponse: (ticketId: string, response: Omit<SupportResponse, 'id' | 'createdAt'>) => void;
  
  // Moderator management
  addModerator: (user: User, permissions: ModeratorPermission[]) => void;
  removeModerator: (userId: string) => void;
  updateModeratorPermissions: (userId: string, permissions: ModeratorPermission[]) => void;
  
  // Getters
  getReportsByStatus: (status: ReportStatus) => Report[];
  getReportsByModerator: (moderatorId: string) => Report[];
  getTicketsByStatus: (status: TicketStatus) => SupportTicket[];
  getTicketsByModerator: (moderatorId: string) => SupportTicket[];
  getUserModerationHistory: (userId: string) => ModerationAction[];
  
  // Statistics
  updateStats: () => void;
}

export const useModerationStore = create<ModerationState>()(
  persist(
    (set, get) => ({
      reports: [],
      moderationActions: [],
      supportTickets: [],
      moderators: [],
      stats: {
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        dismissedReports: 0,
        averageResolutionTime: 0,
        reportsByType: {
          spam: 0,
          inappropriate_content: 0,
          fake_listing: 0,
          harassment: 0,
          fraud: 0,
          copyright: 0,
          other: 0,
        },
        reportsByPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
        moderatorStats: {},
      },

      createReport: (reportData) => {
        const newReport: Report = {
          ...reportData,
          id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          status: 'pending',
          priority: reportData.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          reports: [...state.reports, newReport],
        }));

        get().updateStats();
      },

      updateReportStatus: (reportId, status, moderatorId, notes) => {
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status,
                  assignedModeratorId: moderatorId || report.assignedModeratorId,
                  moderatorNotes: notes || report.moderatorNotes,
                  updatedAt: new Date().toISOString(),
                }
              : report
          ),
        }));

        get().updateStats();
      },

      assignReportToModerator: (reportId, moderatorId) => {
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  assignedModeratorId: moderatorId,
                  status: 'in_review',
                  updatedAt: new Date().toISOString(),
                }
              : report
          ),
        }));
      },

      resolveReport: (reportId, resolution, moderatorId) => {
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: 'resolved',
                  resolution,
                  assignedModeratorId: moderatorId,
                  updatedAt: new Date().toISOString(),
                }
              : report
          ),
        }));

        get().updateStats();
      },

      dismissReport: (reportId, reason, moderatorId) => {
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: 'dismissed',
                  resolution: reason,
                  assignedModeratorId: moderatorId,
                  updatedAt: new Date().toISOString(),
                }
              : report
          ),
        }));

        get().updateStats();
      },

      createModerationAction: (actionData) => {
        const newAction: ModerationAction = {
          ...actionData,
          id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        set((state) => ({
          moderationActions: [...state.moderationActions, newAction],
        }));
      },

      deactivateModerationAction: (actionId) => {
        set((state) => ({
          moderationActions: state.moderationActions.map((action) =>
            action.id === actionId ? { ...action, isActive: false } : action
          ),
        }));
      },

      createSupportTicket: (ticketData) => {
        const newTicket: SupportTicket = {
          ...ticketData,
          id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responses: [],
        };

        set((state) => ({
          supportTickets: [...state.supportTickets, newTicket],
        }));
      },

      updateTicketStatus: (ticketId, status) => {
        set((state) => ({
          supportTickets: state.supportTickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        }));
      },

      assignTicketToModerator: (ticketId, moderatorId) => {
        set((state) => ({
          supportTickets: state.supportTickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  assignedModeratorId: moderatorId,
                  status: 'in_progress',
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        }));
      },

      addTicketResponse: (ticketId, responseData) => {
        const newResponse: SupportResponse = {
          ...responseData,
          id: `response_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          supportTickets: state.supportTickets.map((ticket) =>
            ticket.id === ticketId
              ? {
                  ...ticket,
                  responses: [...ticket.responses, newResponse],
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        }));
      },

      addModerator: (user, permissions) => {
        const moderatorUser: User = {
          ...user,
          role: 'moderator',
          moderatorInfo: {
            assignedDate: new Date().toISOString(),
            permissions,
            handledReports: 0,
            averageResponseTime: 0,
            isActive: true,
          },
        };

        set((state) => ({
          moderators: [...state.moderators, moderatorUser],
        }));
      },

      removeModerator: (userId) => {
        set((state) => ({
          moderators: state.moderators.filter((mod) => mod.id !== userId),
        }));
      },

      updateModeratorPermissions: (userId, permissions) => {
        set((state) => ({
          moderators: state.moderators.map((mod) =>
            mod.id === userId && mod.moderatorInfo
              ? {
                  ...mod,
                  moderatorInfo: {
                    ...mod.moderatorInfo,
                    permissions,
                  },
                }
              : mod
          ),
        }));
      },

      getReportsByStatus: (status) => {
        return get().reports.filter((report) => report.status === status);
      },

      getReportsByModerator: (moderatorId) => {
        return get().reports.filter((report) => report.assignedModeratorId === moderatorId);
      },

      getTicketsByStatus: (status) => {
        return get().supportTickets.filter((ticket) => ticket.status === status);
      },

      getTicketsByModerator: (moderatorId) => {
        return get().supportTickets.filter((ticket) => ticket.assignedModeratorId === moderatorId);
      },

      getUserModerationHistory: (userId) => {
        return get().moderationActions.filter((action) => action.targetUserId === userId);
      },

      updateStats: () => {
        const { reports, moderationActions } = get();
        
        const stats: ModerationStats = {
          totalReports: reports.length,
          pendingReports: reports.filter((r) => r.status === 'pending').length,
          resolvedReports: reports.filter((r) => r.status === 'resolved').length,
          dismissedReports: reports.filter((r) => r.status === 'dismissed').length,
          averageResolutionTime: 0, // Calculate based on resolved reports
          reportsByType: {
            spam: reports.filter((r) => r.type === 'spam').length,
            inappropriate_content: reports.filter((r) => r.type === 'inappropriate_content').length,
            fake_listing: reports.filter((r) => r.type === 'fake_listing').length,
            harassment: reports.filter((r) => r.type === 'harassment').length,
            fraud: reports.filter((r) => r.type === 'fraud').length,
            copyright: reports.filter((r) => r.type === 'copyright').length,
            other: reports.filter((r) => r.type === 'other').length,
          },
          reportsByPriority: {
            low: reports.filter((r) => r.priority === 'low').length,
            medium: reports.filter((r) => r.priority === 'medium').length,
            high: reports.filter((r) => r.priority === 'high').length,
            urgent: reports.filter((r) => r.priority === 'urgent').length,
          },
          moderatorStats: {},
        };

        set({ stats });
      },
    }),
    {
      name: 'moderation-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);