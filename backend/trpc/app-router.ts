import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getConversations from "./routes/liveChat/getConversations/route";
import getMessages from "./routes/liveChat/getMessages/route";
import createConversation from "./routes/liveChat/createConversation/route";
import sendMessage from "./routes/liveChat/sendMessage/route";
import markAsRead from "./routes/liveChat/markAsRead/route";
import closeConversation from "./routes/liveChat/closeConversation/route";
import { registerProcedure } from "./routes/auth/register/route";
import { loginProcedure } from "./routes/auth/login/route";
import { verifyEmailProcedure } from "./routes/auth/verifyEmail/route";
import { resendVerificationProcedure } from "./routes/auth/resendVerification/route";
import { forgotPasswordProcedure } from "./routes/auth/forgotPassword/route";
import { resetPasswordProcedure } from "./routes/auth/resetPassword/route";
import { saveCardProcedure } from "./routes/payriff/saveCard/route";
import { getSavedCardsProcedure } from "./routes/payriff/getSavedCards/route";
import { deleteCardProcedure } from "./routes/payriff/deleteCard/route";
import { createInvoiceProcedure } from "./routes/payriff/createInvoice/route";
import { getInvoiceProcedure } from "./routes/payriff/getInvoice/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    register: registerProcedure,
    login: loginProcedure,
    verifyEmail: verifyEmailProcedure,
    resendVerification: resendVerificationProcedure,
    forgotPassword: forgotPasswordProcedure,
    resetPassword: resetPasswordProcedure,
  }),
  liveChat: createTRPCRouter({
    getConversations,
    getMessages,
    createConversation,
    sendMessage,
    markAsRead,
    closeConversation,
  }),
  payriff: createTRPCRouter({
    saveCard: saveCardProcedure,
    getSavedCards: getSavedCardsProcedure,
    deleteCard: deleteCardProcedure,
    createInvoice: createInvoiceProcedure,
    getInvoice: getInvoiceProcedure,
  }),
});

export type AppRouter = typeof appRouter;
