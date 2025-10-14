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
import { transferProcedure } from "./routes/payriff/transfer/route";
import { topupProcedure } from "./routes/payriff/topup/route";
import { getWalletProcedure } from "./routes/payriff/getWallet/route";
import { getWalletByIdProcedure } from "./routes/payriff/getWalletById/route";
import { createOrderProcedure } from "./routes/payriff/createOrder/route";
import { createPaymentProcedure } from "./routes/payriff/createPayment/route";
import { getOrderProcedure } from "./routes/payriff/getOrder/route";
import { refundProcedure } from "./routes/payriff/refund/route";
import { completeProcedure } from "./routes/payriff/complete/route";
import { autoPayV3Procedure } from "./routes/payriff/autoPayV3/route";

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
    saveCard: saveCardProcedure,
    getSavedCards: getSavedCardsProcedure,
    deleteCard: deleteCardProcedure,
    createInvoice: createInvoiceProcedure,
    getInvoice: getInvoiceProcedure,
    transfer: transferProcedure,
    topup: topupProcedure,
    getWallet: getWalletProcedure,
    getWalletById: getWalletByIdProcedure,
    createOrder: createOrderProcedure,
    getOrder: getOrderProcedure,
    refund: refundProcedure,
    complete: completeProcedure,
    autoPayV3: autoPayV3Procedure,
  }),
});

export type AppRouter = typeof appRouter;
