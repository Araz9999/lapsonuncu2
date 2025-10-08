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
import { createPaymentProcedure } from "./routes/payriff/createPayment/route";
import { getTransactionStatusProcedure } from "./routes/payriff/getTransactionStatus/route";
import { verifyPaymentProcedure } from "./routes/payriff/verifyPayment/route";

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
    createPayment: createPaymentProcedure,
    getTransactionStatus: getTransactionStatusProcedure,
    verifyPayment: verifyPaymentProcedure,
  }),
});

export type AppRouter = typeof appRouter;
