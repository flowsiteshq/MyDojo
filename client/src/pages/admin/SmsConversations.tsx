import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Search,
  Phone,
  Plus,
  Megaphone,
  RefreshCw,
  ChevronRight,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export default function SmsConversations() {
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"conversations" | "campaigns" | "quicksend">("conversations");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<"lead_followup" | "re_engagement" | "custom">("lead_followup");
  const [campaignTemplate, setCampaignTemplate] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: conversations, refetch: refetchConvs } = trpc.aiSms.listConversations.useQuery({
    limit: 50,
    offset: 0,
    search: debouncedSearch || undefined,
  });

  const { data: convDetail, refetch: refetchDetail } = trpc.aiSms.getConversation.useQuery(
    { conversationId: selectedConvId! },
    { enabled: !!selectedConvId, refetchInterval: 5000 }
  );

  const { data: campaigns, refetch: refetchCampaigns } = trpc.aiSms.listCampaigns.useQuery(undefined, {
    enabled: activeTab === "campaigns",
  });

  const sendMsg = trpc.aiSms.sendManualMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchDetail();
    },
    onError: (e) => toast.error("Send failed: " + e.message),
  });

  const toggleAi = trpc.aiSms.toggleAi.useMutation({
    onSuccess: () => refetchDetail(),
  });

  const createCampaign = trpc.aiSms.createCampaign.useMutation({
    onSuccess: () => {
      toast.success("Campaign created!");
      setCampaignName("");
      setCampaignTemplate("");
      refetchCampaigns();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const launchCampaign = trpc.aiSms.launchCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent to ${data.sentCount} contacts!`);
      refetchCampaigns();
    },
    onError: (e) => toast.error("Launch failed: " + e.message),
  });

  const quickSend = trpc.aiSms.sendQuickSms.useMutation({
    onSuccess: () => {
      toast.success("Message sent!");
      setQuickPhone("");
      setQuickMessage("");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convDetail?.messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId) return;
    sendMsg.mutate({ conversationId: selectedConvId, message: messageText.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MyDojo AI SMS Assistant</h1>
            <p className="text-sm text-gray-500">Manage AI-powered text conversations with members</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "conversations" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("conversations")}
            className={activeTab === "conversations" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-1" /> Conversations
          </Button>
          <Button
            variant={activeTab === "campaigns" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("campaigns")}
            className={activeTab === "campaigns" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <Megaphone className="w-4 h-4 mr-1" /> Campaigns
          </Button>
          <Button
            variant={activeTab === "quicksend" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("quicksend")}
            className={activeTab === "quicksend" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <Send className="w-4 h-4 mr-1" /> Quick Send
          </Button>
        </div>
      </div>

      {/* Conversations Tab */}
      {activeTab === "conversations" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations?.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No conversations yet. Send a message to get started.
                </div>
              )}
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    selectedConvId === conv.id ? "bg-red-50 border-l-2 border-l-red-600" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {conv.contactName || conv.phone}
                      </span>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-red-600 text-white text-xs ml-1">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{conv.phone}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {conv.aiEnabled ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AI Active
                        </span>
                      ) : (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> Human Mode
                        </span>
                      )}
                      {conv.optedOut && (
                        <span className="text-xs text-red-500">Opted Out</span>
                      )}
                    </div>
                    {(conv as any).bookingState === "confirmed" && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <CalendarCheck className="w-3 h-3" /> Trial Booked
                      </span>
                    )}
                    {(conv as any).bookingState && (conv as any).bookingState !== "idle" && (conv as any).bookingState !== "confirmed" && (
                      <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                        <ClipboardList className="w-3 h-3" /> Booking in progress
                      </span>
                    )}
                    {conv.lastMessageAt && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-3" />
                </button>
              ))}
            </div>
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => refetchConvs()}
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          {selectedConvId && convDetail ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {convDetail.conversation.contactName || convDetail.conversation.phone}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {convDetail.conversation.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Booking status summary in header */}
                  {(convDetail.conversation as any).bookingState === "confirmed" && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      <div className="text-xs">
                        <div className="font-semibold text-emerald-700">Trial Booked via SMS</div>
                        <div className="text-emerald-600">
                          {(convDetail.conversation as any).bookingProgram || "Program TBD"}
                          {(convDetail.conversation as any).bookingPreferredTime ? ` · ${(convDetail.conversation as any).bookingPreferredTime}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                  {(convDetail.conversation as any).bookingState && (convDetail.conversation as any).bookingState !== "idle" && (convDetail.conversation as any).bookingState !== "confirmed" && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      <div className="text-xs">
                        <div className="font-semibold text-amber-700">Booking In Progress</div>
                        <div className="text-amber-600 capitalize">{((convDetail.conversation as any).bookingState ?? "").replace("awaiting_", "Waiting for: ")}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ai-toggle" className="text-sm text-gray-600">
                      AI Replies
                    </Label>
                    <Switch
                      id="ai-toggle"
                      checked={convDetail.conversation.aiEnabled}
                      onCheckedChange={(checked) =>
                        toggleAi.mutate({ conversationId: selectedConvId, aiEnabled: checked })
                      }
                    />
                  </div>
                  {convDetail.conversation.optedOut && (
                    <Badge variant="destructive">Opted Out</Badge>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {convDetail.messages.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-12">
                    No messages yet. Send the first message below.
                  </div>
                )}
                {convDetail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        msg.direction === "outbound"
                          ? msg.senderType === "ai"
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-red-600 text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <div>{msg.body}</div>
                      <div
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          msg.direction === "outbound" ? "text-white/70 justify-end" : "text-gray-400"
                        }`}
                      >
                        {msg.direction === "outbound" && msg.senderType === "ai" && (
                          <Bot className="w-3 h-3" />
                        )}
                        {msg.direction === "outbound" && msg.senderType === "human" && (
                          <User className="w-3 h-3" />
                        )}
                        {format(new Date(msg.createdAt), "h:mm a")}
                        {msg.status === "failed" && (
                          <span className="text-red-300 ml-1">Failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t p-4">
                {convDetail.conversation.optedOut ? (
                  <div className="text-center text-sm text-red-500 py-2">
                    This contact has opted out of SMS messages.
                  </div>
                ) : (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="resize-none min-h-[60px] max-h-[120px]"
                      rows={2}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sendMsg.isPending}
                      className="bg-red-600 hover:bg-red-700 h-[60px] px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {convDetail.conversation.aiEnabled
                    ? "AI is handling replies automatically. Toggle off to take over manually."
                    : "You are in manual mode. AI replies are paused."}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a contact from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Create Campaign */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-600" />
                Create New Campaign
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    placeholder="e.g. Summer Re-engagement"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Campaign Type</Label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value as any)}
                    className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="lead_followup">Lead Follow-up (new/contacted leads)</option>
                    <option value="re_engagement">Re-engagement (inactive 30+ days)</option>
                    <option value="custom">Custom (all opted-in contacts)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Label>Message Template</Label>
                <p className="text-xs text-gray-500 mb-1">Use {"{{name}}"} to personalize with the contact's name</p>
                <Textarea
                  placeholder="Hi {{name}}! This is MyDojo. We'd love to have you back on the mat..."
                  value={campaignTemplate}
                  onChange={(e) => setCampaignTemplate(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <div className="text-xs text-gray-400 mt-1">{campaignTemplate.length}/1600 characters</div>
              </div>
              <Button
                onClick={() =>
                  createCampaign.mutate({
                    name: campaignName,
                    type: campaignType,
                    messageTemplate: campaignTemplate,
                  })
                }
                disabled={!campaignName || !campaignTemplate || createCampaign.isPending}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Campaign
              </Button>
            </div>

            {/* Campaign List */}
            <div className="bg-white rounded-xl border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-gray-900">All Campaigns</h2>
                <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </div>
              {!campaigns?.length && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No campaigns yet. Create one above.
                </div>
              )}
              {campaigns?.map((c) => (
                <div key={c.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Type: {c.type.replace("_", " ")} ·{" "}
                      {c.sentCount != null ? `Sent to ${c.sentCount} contacts` : "Not sent yet"}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-md truncate">{c.messageTemplate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        c.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : c.status === "running"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {c.status}
                    </Badge>
                    {c.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => launchCampaign.mutate({ campaignId: c.id })}
                        disabled={launchCampaign.isPending}
                      >
                        <Megaphone className="w-3 h-3 mr-1" /> Launch
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Send Tab */}
      {activeTab === "quicksend" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Send className="w-5 h-5 text-red-600" />
                Send a Quick SMS
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Send a one-off message to any phone number. The AI will handle replies automatically.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+1 (832) 555-0123"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Hi! This is MyDojo. We'd love to invite you to a free class..."
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    className="mt-1 min-h-[100px]"
                  />
                  <div className="text-xs text-gray-400 mt-1">{quickMessage.length}/1600 characters</div>
                </div>
                <Button
                  onClick={() =>
                    quickSend.mutate({ phone: quickPhone, message: quickMessage })
                  }
                  disabled={!quickPhone || !quickMessage || quickSend.isPending}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {quickSend.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                How the AI SMS Assistant Works
              </h3>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• Messages are sent from your <strong>(877) 4-MYDOJO</strong> number</li>
                <li>• When a member replies, the AI responds automatically</li>
                <li>• The AI knows your schedule, programs, pricing, and location</li>
                <li>• Reply <strong>STOP</strong> opts the member out immediately</li>
                <li>• Reply <strong>HUMAN</strong> or <strong>AGENT</strong> transfers to manual mode</li>
                <li>• Toggle AI off in any conversation to take over manually</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
