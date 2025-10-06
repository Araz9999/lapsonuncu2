import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getConversations from "./routes/liveChat/getConversations/route";
import getMessages from "./routes/liveChat/getMessages/route";
import createConversation from "./routes/liveChat/createConversation/route";
import sendMessage from "./routes/liveChat/sendMessage/route";
import markAsRead from "./routes/liveChat/markAsRead/route";
import closeConversation from "./routes/liveChat/closeConversation/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  liveChat: createTRPCRouter({
    getConversations,
    getMessages,
    createConversation,
    sendMessage,
    markAsRead,
    closeConversation,
  }),
});

export type AppRouter = typeof appRouter;
