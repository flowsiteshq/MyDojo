import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Send, MessageCircle, ChevronLeft, Loader2, Inbox, Plus, X } from "lucide-react";

// ── Token helpers (matches MemberDashboard2 useTokens) ───────────────────────
function useTokens(isDark: boolean) {
  return isDark
    ? {
        bg: "bg-[#0f0f0f]",
        cardBg: "bg-[#1a1a1a] border-white/10",
        headerBg: "bg-[#141414] border-white/10",
        textPrimary: "text-white",
        textSecondary: "text-white/60",
        textMuted: "text-white/40",
        inputBg: "bg-[#2a2a2a] border-white/10 text-white placeholder-white/30 focus:border-[#E11D2A]/60",
        myBubble: "bg-[#E11D2A] text-white",
        theirBubble: "bg-[#2a2a2a] text-white",
        hoverRow: "hover:bg-white/5",
        activeRow: "bg-[#E11D2A]/10 border-l-2 border-[#E11D2A]",
        divider: "border-white/10",
        sendBtn: "bg-[#E11D2A] hover:bg-[#c01020] text-white",
        emptyIcon: "text-white/20",
        badge: "bg-[#E11D2A] text-white",
        timestamp: "text-white/30",
      }
    : {
        bg: "bg-gray-50",
        cardBg: "bg-white border-gray-200",
        headerBg: "bg-white border-gray-200",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-500",
        textMuted: "text-gray-400",
        inputBg: "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#E11D2A]",
        myBubble: "bg-[#E11D2A] text-white",
        theirBubble: "bg-gray-100 text-gray-900",
        hoverRow: "hover:bg-gray-50",
        activeRow: "bg-red-50 border-l-2 border-[#E11D2A]",
        divider: "border-gray-200",
        badge: "bg-[#E11D2A] text-white",
        timestamp: "text-gray-400",
        emptyIcon: "text-gray-300",
        sendBtn: "bg-[#E11D2A] hover:bg-[#c01020] text-white",
      };
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Types inferred from tRPC ──────────────────────────────────────────────────
type ConvWithMeta = {
  id: number;
  type: "staff" | "student";
  title: string | null;
  createdBy: number;
  enrollmentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderRole: "admin" | "staff" | "user";
    body: string;
    readAt: Date | null;
    createdAt: Date;
  } | null;
  unreadCount: number;
};

type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: "admin" | "staff" | "user";
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

interface MessagesTabProps {
  isDark: boolean;
  currentUserId?: number;
}

export function MessagesTab({ isDark, currentUserId }: MessagesTabProps) {
  const t = useTokens(isDark);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: conversations = [], isLoading: convsLoading } =
    trpc.member.getConversations.useQuery(undefined, {
      refetchInterval: 15_000,
    });

  const { data: messages = [], isLoading: msgsLoading } =
    trpc.member.getMessages.useQuery(
      { conversationId: selectedConvId! },
      {
        enabled: selectedConvId !== null,
        refetchInterval: 10_000,
      }
    );

  // ── New conversation state ────────────────────────────────────────────────
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newMsgText, setNewMsgText] = useState("");

  const createConvMutation = trpc.member.createConversation.useMutation({
    onSuccess: (data) => {
      setNewMsgText("");
      setShowNewMsg(false);
      utils.member.getConversations.invalidate();
      utils.member.getUnreadMessageCount.invalidate();
      setSelectedConvId(data.conversationId);
      setMobileShowThread(true);
    },
  });

  const handleCreateConv = () => {
    const text = newMsgText.trim();
    if (!text || createConvMutation.isPending) return;
    createConvMutation.mutate({ message: text });
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const sendMutation = trpc.member.sendMessage.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.member.getMessages.invalidate({ conversationId: selectedConvId! });
      utils.member.getConversations.invalidate();
      utils.member.getUnreadMessageCount.invalidate();
    },
  });

  const markReadMutation = trpc.member.markConversationRead.useMutation({
    onSuccess: () => {
      utils.member.getConversations.invalidate();
      utils.member.getUnreadMessageCount.invalidate();
    },
  });

  // ── Auto-scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mark as read when conversation is opened ──────────────────────────────
  useEffect(() => {
    if (selectedConvId !== null) {
      markReadMutation.mutate({ conversationId: selectedConvId });
    }
  }, [selectedConvId]);

  // ── Auto-select first conversation on desktop ─────────────────────────────
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;

  const handleSend = () => {
    const text = replyText.trim();
    if (!text || !selectedConvId || sendMutation.isPending) return;
    sendMutation.mutate({ conversationId: selectedConvId, body: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openConv = (id: number) => {
    setSelectedConvId(id);
    setMobileShowThread(true);
  };

  // ── Conversation list item ─────────────────────────────────────────────────
  const ConvItem = ({ conv }: { conv: ConvWithMeta }) => {
    const isActive = conv.id === selectedConvId;
    const title = conv.title || "Conversation";
    const lastMsg = conv.lastMessage;
    const preview = lastMsg
      ? (lastMsg.senderRole !== "user" ? "Instructor: " : "You: ") +
        lastMsg.body.slice(0, 60) +
        (lastMsg.body.length > 60 ? "…" : "")
      : "No messages yet";

    return (
      <button
        onClick={() => openConv(conv.id)}
        className={`w-full text-left px-4 py-3.5 transition-all border-b ${t.divider} ${
          isActive ? t.activeRow : t.hoverRow
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#E11D2A] to-red-800 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {title.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold truncate ${t.textPrimary}`}>{title}</span>
              <span className={`text-[11px] flex-shrink-0 ${t.timestamp}`}>
                {formatTime(lastMsg?.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className={`text-xs truncate ${t.textSecondary}`}>{preview}</p>
              {conv.unreadCount > 0 && (
                <span
                  className={`flex-shrink-0 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 ${t.badge}`}
                >
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  };

  // ── Message bubble ─────────────────────────────────────────────────────────
  const Bubble = ({ msg }: { msg: Message }) => {
    const isMe = msg.senderRole === "user";
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
        {!isMe && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#E11D2A] to-red-800 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shadow-sm">
            {msg.senderName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
          {!isMe && (
            <span className={`text-[11px] font-medium mb-1 ml-1 ${t.textSecondary}`}>
              {msg.senderName}
            </span>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              isMe
                ? "rounded-tr-sm " + t.myBubble
                : "rounded-tl-sm " + t.theirBubble
            }`}
          >
            {msg.body}
          </div>
          <span className={`text-[10px] mt-1 ${isMe ? "mr-1" : "ml-1"} ${t.timestamp}`}>
            {formatFullTime(msg.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const EmptyInbox = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        <Inbox className={`h-8 w-8 ${t.emptyIcon}`} />
      </div>
      <div>
        <p className={`font-semibold ${t.textPrimary}`}>No messages yet</p>
        <p className={`text-sm mt-1 ${t.textSecondary}`}>
          Send a message to your instructor to get started!
        </p>
      </div>
      <button
        onClick={() => setShowNewMsg(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E11D2A] text-white text-sm font-semibold hover:bg-[#c01020] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Message Instructor
      </button>
    </div>
  );

  const NoConvSelected = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        <MessageCircle className={`h-8 w-8 ${t.emptyIcon}`} />
      </div>
      <p className={`text-sm ${t.textSecondary}`}>Select a conversation to read messages</p>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className={`relative flex h-full rounded-2xl overflow-hidden border ${t.cardBg}`} style={{ minHeight: 520 }}>
      {/* ── New Message Modal ── */}
      {showNewMsg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-2xl">
          <div className={`w-full max-w-sm mx-4 rounded-2xl shadow-2xl border p-5 ${t.cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`font-bold text-base ${t.textPrimary}`}>Message Your Instructor</h4>
              <button onClick={() => setShowNewMsg(false)} className={`p-1 rounded-lg ${t.hoverRow}`}>
                <X className={`h-4 w-4 ${t.textSecondary}`} />
              </button>
            </div>
            <textarea
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
              placeholder="Type your message here…"
              rows={4}
              className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E11D2A]/20 ${t.inputBg}`}
              autoFocus
            />
            {createConvMutation.isError && (
              <p className="text-xs text-red-500 mt-2">
                {createConvMutation.error?.message ?? "Failed to send. Please try again."}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowNewMsg(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${isDark ? "border-white/10 text-white/60 hover:bg-white/5" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConv}
                disabled={!newMsgText.trim() || createConvMutation.isPending}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#E11D2A] text-white hover:bg-[#c01020] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createConvMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── LEFT: Conversation list ── */}
      <div
        className={`flex-shrink-0 w-full sm:w-72 border-r flex flex-col ${t.divider} ${
          mobileShowThread ? "hidden sm:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-4 border-b ${t.headerBg} ${t.divider} flex items-center justify-between`}>
          <div>
            <h3 className={`font-bold text-base ${t.textPrimary}`}>Messages</h3>
            <p className={`text-xs mt-0.5 ${t.textSecondary}`}>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowNewMsg(true)}
            title="New message"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className={`h-6 w-6 animate-spin ${t.textMuted}`} />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyInbox />
          ) : (
            conversations.map((conv) => <ConvItem key={conv.id} conv={conv} />)
          )}
        </div>
      </div>

      {/* ── RIGHT: Thread ── */}
      <div
        className={`flex-1 flex flex-col ${t.bg} ${
          mobileShowThread ? "flex" : "hidden sm:flex"
        }`}
      >
        {/* Thread header */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${t.headerBg} ${t.divider}`}>
          {/* Mobile back button */}
          <button
            className={`sm:hidden p-1 rounded-lg mr-1 ${t.hoverRow}`}
            onClick={() => setMobileShowThread(false)}
          >
            <ChevronLeft className={`h-5 w-5 ${t.textSecondary}`} />
          </button>

          {selectedConv ? (
            <>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E11D2A] to-red-800 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                {(selectedConv.title || "C").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${t.textPrimary}`}>
                  {selectedConv.title || "Conversation"}
                </p>
                <p className={`text-xs ${t.textSecondary}`}>Instructor</p>
              </div>
            </>
          ) : (
            <p className={`text-sm ${t.textSecondary}`}>Select a conversation</p>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!selectedConvId ? (
            <NoConvSelected />
          ) : msgsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className={`h-6 w-6 animate-spin ${t.textMuted}`} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageCircle className={`h-10 w-10 ${t.emptyIcon}`} />
              <p className={`text-sm ${t.textSecondary}`}>No messages in this conversation yet.</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Reply input */}
        {selectedConvId && (
          <div className={`px-4 py-3 border-t ${t.divider} ${t.headerBg}`}>
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className={`flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#E11D2A]/20 ${t.inputBg}`}
                style={{ maxHeight: 120, overflowY: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim() || sendMutation.isPending}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${t.sendBtn}`}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
