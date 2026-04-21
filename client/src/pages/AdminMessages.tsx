import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Users,
  Send,
  Plus,
  Trash2,
  ChevronLeft,
  User,
  Shield,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationType = "staff" | "student";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: "admin" | "staff" | "user";
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

interface Conversation {
  id: number;
  type: ConversationType;
  title: string | null;
  createdBy: number;
  enrollmentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: Message | null;
  unreadCount: number;
  studentInfo: { id: number; customerName: string; photoUrl: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} loading="lazy" />;
  }
  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────

function ConvItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const displayName = conv.type === "student" && conv.studentInfo
    ? conv.studentInfo.customerName
    : conv.title ?? "Untitled";
  const photoUrl = conv.type === "student" ? conv.studentInfo?.photoUrl : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? "bg-red-50 border-l-4 border-l-red-600" : ""
      }`}
    >
      <Avatar name={displayName} photoUrl={photoUrl} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 truncate text-sm">{displayName}</span>
          {conv.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(conv.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {conv.lastMessage ? conv.lastMessage.body : "No messages yet"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <Badge className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
          {conv.unreadCount}
        </Badge>
      )}
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: number }) {
  const isOwn = msg.senderId === currentUserId;
  const roleIcon = msg.senderRole === "admin" ? (
    <Shield className="w-3 h-3 text-red-500" />
  ) : msg.senderRole === "staff" ? (
    <Users className="w-3 h-3 text-blue-500" />
  ) : (
    <User className="w-3 h-3 text-gray-400" />
  );

  return (
    <div className={`flex gap-2 mb-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isOwn ? "bg-red-100" : "bg-gray-100"
      }`}>
        {roleIcon}
      </div>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{msg.senderName}</span>
          <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
        </div>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwn
              ? "bg-red-600 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-900 rounded-tl-sm"
          }`}
        >
          {msg.body}
        </div>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({
  conv,
  currentUserId,
  onBack,
  onDelete,
}: {
  conv: Conversation;
  currentUserId: number;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages = [], isLoading } = trpc.admin.getMessages.useQuery(
    { conversationId: conv.id },
    { refetchInterval: 3000 }
  );

  const sendMessage = trpc.admin.sendMessage.useMutation({
    onMutate: async ({ body }) => {
      await utils.admin.getMessages.cancel({ conversationId: conv.id });
      const prev = utils.admin.getMessages.getData({ conversationId: conv.id });
      const optimistic: Message = {
        id: -Date.now(),
        conversationId: conv.id,
        senderId: currentUserId,
        senderName: "You",
        senderRole: "admin",
        body,
        readAt: null,
        createdAt: new Date(),
      };
      utils.admin.getMessages.setData({ conversationId: conv.id }, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.admin.getMessages.setData({ conversationId: conv.id }, ctx.prev);
      }
      toast.error("Failed to send message");
    },
    onSettled: () => {
      utils.admin.getMessages.invalidate({ conversationId: conv.id });
      utils.admin.getConversations.invalidate();
    },
  });

  const markRead = trpc.admin.markConversationRead.useMutation();

  const deleteConv = trpc.admin.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted");
      onDelete();
      utils.admin.getConversations.invalidate();
    },
    onError: () => toast.error("Failed to delete conversation"),
  });

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening
  useEffect(() => {
    if (conv.unreadCount > 0) {
      markRead.mutate({ conversationId: conv.id });
    }
  }, [conv.id]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    sendMessage.mutate({ conversationId: conv.id, body });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayName =
    conv.type === "student" && conv.studentInfo
      ? conv.studentInfo.customerName
      : conv.title ?? "Untitled";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Avatar
          name={displayName}
          photoUrl={conv.type === "student" ? conv.studentInfo?.photoUrl : null}
          size="md"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{displayName}</h2>
          <p className="text-xs text-gray-500">
            {conv.type === "staff" ? "Staff Chat" : "Student Message"}
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Delete this conversation? This cannot be undone.")) {
              deleteConv.mutate({ id: conv.id });
            }
          }}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {(messages as Message[]).map((msg) => (
              <MessageBubble key={msg.id} msg={msg} currentUserId={currentUserId} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-32 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className="bg-red-600 hover:bg-red-700 text-white h-10 px-4 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

function NewConversationModal({
  open,
  onClose,
  type,
  students,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  type: ConversationType;
  students: { id: number; customerName: string }[];
  onCreated: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Auto-focus search when modal opens
  useEffect(() => {
    if (open && type === "student") {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open, type]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setSelectedStudentId(null);
      setSelectedStudentName("");
      setStudentSearch("");
      setInitialMessage("");
    }
  }, [open]);

  const filteredStudents = studentSearch.trim()
    ? students.filter((s) =>
        s.customerName.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students;

  const createConv = trpc.admin.createConversation.useMutation({
    onSuccess: (data) => {
      toast.success("Conversation created!");
      utils.admin.getConversations.invalidate();
      onCreated(data.id);
      onClose();
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to create conversation");
    },
  });

  const handleSelectStudent = (student: { id: number; customerName: string }) => {
    setSelectedStudentId(student.id);
    setSelectedStudentName(student.customerName);
    setStudentSearch("");
  };

  const handleClearStudent = () => {
    setSelectedStudentId(null);
    setSelectedStudentName("");
    setStudentSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleCreate = () => {
    if (type === "staff" && !title.trim()) {
      toast.error("Please enter a conversation title");
      return;
    }
    if (type === "student" && !selectedStudentId) {
      toast.error("Please select a student");
      return;
    }
    if (!initialMessage.trim()) {
      toast.error("Please enter an initial message");
      return;
    }

    createConv.mutate({
      type,
      title: type === "student" ? selectedStudentName : title.trim(),
      enrollmentId: type === "student" ? selectedStudentId ?? undefined : undefined,
      initialMessage: initialMessage.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "staff" ? "New Staff Chat" : "Message a Student"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {type === "staff" ? (
            <div>
              <Label>Conversation Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Discussion"
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label className="mb-1.5 block">Select Student</Label>

              {/* Selected student chip */}
              {selectedStudentId ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(selectedStudentName)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                    {selectedStudentName}
                  </span>
                  <button
                    onClick={handleClearStudent}
                    className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Change student"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      ref={searchRef}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search by name…"
                      className="pl-9"
                    />
                    {studentSearch && (
                      <button
                        onClick={() => setStudentSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable student list */}
                  <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                      {filteredStudents.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          {studentSearch ? `No students match "${studentSearch}"` : "No students found"}
                        </div>
                      ) : (
                        filteredStudents.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleSelectStudent(s)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                              {getInitials(s.customerName)}
                            </div>
                            <span className="text-sm text-gray-900 truncate">{s.customerName}</span>
                          </button>
                        ))
                      )}
                    </div>
                    {filteredStudents.length > 0 && (
                      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
                          {studentSearch ? ` matching "${studentSearch}"` : " total"}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <Label>First Message</Label>
            <Textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Type your message…"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createConv.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {createConv.isPending ? "Creating…" : "Start Conversation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMessages() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ConversationType>("staff");
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [convSearch, setConvSearch] = useState("");

  const { data: allConversations = [], isLoading } = trpc.admin.getConversations.useQuery(
    { type: "all" },
    { refetchInterval: 5000 }
  );

  const { data: allStudents = [] } = trpc.admin.getAllStudents.useQuery();

  const conversations = (allConversations as Conversation[]).filter(
    (c) => c.type === activeTab
  );

  // Filter conversations by search query
  const filteredConversations = convSearch.trim()
    ? conversations.filter((c) => {
        const name =
          c.type === "student" && c.studentInfo
            ? c.studentInfo.customerName
            : c.title ?? "";
        return name.toLowerCase().includes(convSearch.toLowerCase());
      })
    : conversations;

  const activeConv = (allConversations as Conversation[]).find((c) => c.id === activeConvId) ?? null;

  const staffUnread = (allConversations as Conversation[])
    .filter((c) => c.type === "staff")
    .reduce((sum, c) => sum + c.unreadCount, 0);

  const studentUnread = (allConversations as Conversation[])
    .filter((c) => c.type === "student")
    .reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)] -m-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Left Panel: Conversation List */}
        <div
          className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r border-gray-200 ${
            activeConv ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab("staff"); setActiveConvId(null); setConvSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "staff"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Chat
              {staffUnread > 0 && (
                <Badge className="bg-red-600 text-white text-xs px-1.5 py-0 rounded-full">
                  {staffUnread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("student"); setActiveConvId(null); setConvSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === "student"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Students
              {studentUnread > 0 && (
                <Badge className="bg-red-600 text-white text-xs px-1.5 py-0 rounded-full">
                  {studentUnread}
                </Badge>
              )}
            </button>
          </div>

          {/* Search bar + New button */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            {/* Search conversations */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder={activeTab === "staff" ? "Search chats…" : "Search students…"}
                className="pl-8 h-8 text-sm"
              />
              {convSearch && (
                <button
                  onClick={() => setConvSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* New conversation button */}
            <Button
              onClick={() => setShowNewModal(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 text-sm h-8"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "staff" ? "New Staff Chat" : "Message a Student"}
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-4 text-center">
                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">
                  {convSearch
                    ? `No results for "${convSearch}"`
                    : activeTab === "staff"
                    ? "No staff chats yet. Start a conversation with your team."
                    : "No student messages yet. Send a message to a student."}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Chat View */}
        <div
          className={`flex-1 flex flex-col ${
            activeConv ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConv && user ? (
            <ChatView
              conv={activeConv}
              currentUserId={user.id}
              onBack={() => setActiveConvId(null)}
              onDelete={() => setActiveConvId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-gray-500">Select a conversation</p>
              <p className="text-sm mt-1">
                Choose a conversation from the list or start a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        type={activeTab}
        students={(allStudents as { id: number; name: string }[]).map(s => ({ id: s.id, customerName: s.name })) ?? []}
        onCreated={(id) => {
          setActiveConvId(id);
          setShowNewModal(false);
        }}
      />
    </AdminLayout>
  );
}
