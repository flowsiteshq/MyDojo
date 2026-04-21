import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Send,
  Clock,
  Image as ImageIcon,
  X,
  RefreshCw,
  Trash2,
  ThumbsUp,
  MessageCircle,
  Share2,
  Facebook,
  Instagram,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_OPTIONS = [
  { value: "both", label: "Facebook + Instagram" },
  { value: "facebook", label: "Facebook only" },
  { value: "instagram", label: "Instagram only" },
];

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-800",
};

function PlatformBadge({ platforms }: { platforms: string }) {
  return (
    <div className="flex gap-1">
      {(platforms === "facebook" || platforms === "both") && (
        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
          <Facebook className="h-3 w-3" /> FB
        </span>
      )}
      {(platforms === "instagram" || platforms === "both") && (
        <span className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">
          <Instagram className="h-3 w-3" /> IG
        </span>
      )}
    </div>
  );
}

export default function AdminSocialMedia() {
  const [tab, setTab] = useState("compose");
  const [message, setMessage] = useState("");
  const [platforms, setPlatforms] = useState<"facebook" | "instagram" | "both">("both");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: config } = trpc.socialMedia.getConfig.useQuery();
  const { data: posts = [], refetch: refetchPosts } = trpc.socialMedia.listPosts.useQuery({ status: "all", limit: 50 });

  const uploadImage = trpc.socialMedia.uploadImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.url);
      setImageKey(data.key);
      toast.success("Image uploaded!");
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });

  const publishNow = trpc.socialMedia.publishNow.useMutation({
    onSuccess: () => {
      toast.success("Post published successfully!");
      resetForm();
      refetchPosts();
      setTab("history");
    },
    onError: (e) => toast.error(`Failed to publish: ${e.message}`),
  });

  const schedulePost = trpc.socialMedia.schedulePost.useMutation({
    onSuccess: () => {
      toast.success("Post scheduled!");
      resetForm();
      refetchPosts();
      setTab("history");
    },
    onError: (e) => toast.error(`Failed to schedule: ${e.message}`),
  });

  const deletePost = trpc.socialMedia.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      setDeleteConfirmId(null);
      refetchPosts();
    },
    onError: (e) => toast.error(e.message),
  });

  const refreshStats = trpc.socialMedia.refreshStats.useMutation({
    onSuccess: (stats) => {
      toast.success(`Stats updated: ${stats.likes} likes, ${stats.comments} comments, ${stats.shares} shares`);
      refetchPosts();
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setMessage("");
    setImagePreview(null);
    setImageUrl(null);
    setImageKey(null);
    setScheduleDate("");
    setScheduleTime("09:00");
    setIsScheduleMode(false);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setImagePreview(ev.target?.result as string);
      uploadImage.mutate({
        base64,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  function handlePublish() {
    if (!message.trim()) { toast.error("Please write a message"); return; }
    if (isScheduleMode) {
      if (!scheduleDate || !scheduleTime) { toast.error("Please set a date and time"); return; }
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (scheduledFor <= new Date()) { toast.error("Scheduled time must be in the future"); return; }
      schedulePost.mutate({
        message: message.trim(),
        imageUrl: imageUrl ?? undefined,
        imageKey: imageKey ?? undefined,
        platforms,
        scheduledFor,
      });
    } else {
      publishNow.mutate({
        message: message.trim(),
        imageUrl: imageUrl ?? undefined,
        imageKey: imageKey ?? undefined,
        platforms,
      });
    }
  }

  const charCount = message.length;
  const maxChars = 63206;
  const isOverLimit = charCount > maxChars;
  const isPending = publishNow.isPending || schedulePost.isPending;

  const publishedPosts = posts.filter(p => p.status === "published");
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const failedPosts = posts.filter(p => p.status === "failed");

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
            <p className="text-sm text-gray-500 mt-1">Post to Facebook and Instagram from one place</p>
          </div>
          <div className="flex items-center gap-2">
            {config?.facebookConfigured ? (
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Facebook connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" /> Facebook not configured
              </span>
            )}
            {config?.instagramConfigured ? (
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Instagram connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" /> Instagram not set up
              </span>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Post
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Published
              {publishedPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{publishedPosts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
              {scheduledPosts.length > 0 && (
                <Badge className="ml-1 text-xs bg-blue-600">{scheduledPosts.length}</Badge>
              )}
            </TabsTrigger>
            {failedPosts.length > 0 && (
              <TabsTrigger value="failed" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Failed
                <Badge variant="destructive" className="ml-1 text-xs">{failedPosts.length}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Compose Tab ── */}
          <TabsContent value="compose">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Platform selector */}
                <div className="flex items-center gap-4 mb-5">
                  <Label className="text-sm font-medium text-gray-700 shrink-0">Post to:</Label>
                  <Select value={platforms} onValueChange={(v) => setPlatforms(v as typeof platforms)}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <Textarea
                    placeholder="What's happening at MyDojo? Share a class update, belt promotion, event, or motivational post..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="resize-none text-base leading-relaxed"
                  />
                  <div className={`text-xs mt-1.5 text-right ${isOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                  </div>
                </div>

                {/* Image upload */}
                <div className="mb-5">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Post preview"
                        className="max-h-64 rounded-lg border border-gray-200 object-contain" loading="lazy" />
                      <button
                        onClick={() => { setImagePreview(null); setImageUrl(null); setImageKey(null); }}
                        className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      {uploadImage.isPending && (
                        <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                          <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Add photo
                      {platforms !== "facebook" && (
                        <span className="text-xs text-amber-600">(required for Instagram)</span>
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>

                {/* Schedule toggle */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setIsScheduleMode(false)}
                      className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${!isScheduleMode ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Send className="h-3.5 w-3.5" /> Post now
                    </button>
                    <button
                      onClick={() => setIsScheduleMode(true)}
                      className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${isScheduleMode ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      <Calendar className="h-3.5 w-3.5" /> Schedule
                    </button>
                  </div>

                  {isScheduleMode && (
                    <div className="flex gap-3 items-center">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="w-40"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Time</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button onClick={resetForm} className="text-sm text-gray-400 hover:text-gray-600">
                  Clear
                </button>
                <Button
                  onClick={handlePublish}
                  disabled={isPending || isOverLimit || !message.trim() || uploadImage.isPending}
                  className={isScheduleMode ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-900 hover:bg-gray-800"}
                >
                  {isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> {isScheduleMode ? "Scheduling…" : "Publishing…"}</>
                  ) : isScheduleMode ? (
                    <><Clock className="h-4 w-4 mr-2" /> Schedule Post</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Publish Now</>
                  )}
                </Button>
              </div>
            </div>

            {/* Tips */}
            {!config?.facebookConfigured && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Facebook not configured
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  To enable posting, add your <code className="bg-amber-100 px-1 rounded">FACEBOOK_PAGE_ID</code> in Settings → Secrets. Your Page Access Token is already set.
                </p>
              </div>
            )}
            {config?.facebookConfigured && !config?.instagramConfigured && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram not connected
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  To enable Instagram posting, add your <code className="bg-blue-100 px-1 rounded">INSTAGRAM_BUSINESS_ACCOUNT_ID</code> in Settings → Secrets. This is your Instagram Business Account ID (not username).
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── Post History Tab ── */}
          <TabsContent value="history">
            <PostList
              posts={publishedPosts}
              emptyMessage="No published posts yet."
              onDelete={(id) => setDeleteConfirmId(id)}
              onRefreshStats={(id, fbId) => refreshStats.mutate({ id, facebookPostId: fbId })}
              refreshing={refreshStats.isPending}
            />
          </TabsContent>

          {/* ── Scheduled Tab ── */}
          <TabsContent value="scheduled">
            <PostList
              posts={scheduledPosts}
              emptyMessage="No scheduled posts."
              onDelete={(id) => setDeleteConfirmId(id)}
              showScheduledTime
            />
          </TabsContent>

          {/* ── Failed Tab ── */}
          <TabsContent value="failed">
            <PostList
              posts={failedPosts}
              emptyMessage="No failed posts."
              onDelete={(id) => setDeleteConfirmId(id)}
              showError
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
            <DialogDescription>This will permanently remove the post record. Published posts on Facebook/Instagram will not be affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId !== null && deletePost.mutate({ id: deleteConfirmId })}
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// ─── Post List Component ──────────────────────────────────────────────────────
type Post = {
  id: number;
  message: string;
  imageUrl?: string | null;
  platforms: string;
  status: string;
  publishedAt?: Date | null;
  scheduledFor?: Date | null;
  facebookPostId?: string | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  errorMessage?: string | null;
  createdByName?: string | null;
  createdAt: Date;
};

function PostList({
  posts,
  emptyMessage,
  onDelete,
  onRefreshStats,
  refreshing,
  showScheduledTime,
  showError,
}: {
  posts: Post[];
  emptyMessage: string;
  onDelete: (id: number) => void;
  onRefreshStats?: (id: number, fbId: string) => void;
  refreshing?: boolean;
  showScheduledTime?: boolean;
  showError?: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Platform + status badges */}
              <div className="flex items-center gap-2 mb-2">
                <PlatformBadge platforms={post.platforms} />
                <Badge className={`text-xs ${STATUS_COLORS[post.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {post.status}
                </Badge>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-4 mb-3">{post.message}</p>

              {/* Image thumbnail */}
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post"
                  className="h-24 w-auto rounded-lg object-cover border border-gray-100 mb-3" loading="lazy" />
              )}

              {/* Engagement stats */}
              {post.status === "published" && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {post.likes ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comments ?? 0}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> {post.shares ?? 0}</span>
                  {post.facebookPostId && onRefreshStats && (
                    <button
                      onClick={() => onRefreshStats(post.id, post.facebookPostId!)}
                      disabled={refreshing}
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                    </button>
                  )}
                </div>
              )}

              {/* Scheduled time */}
              {showScheduledTime && post.scheduledFor && (
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  Scheduled for {new Date(post.scheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}

              {/* Error */}
              {showError && post.errorMessage && (
                <p className="text-xs text-red-600 flex items-start gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {post.errorMessage}
                </p>
              )}

              {/* Meta */}
              <p className="text-xs text-gray-400 mt-2">
                {post.publishedAt
                  ? `Published ${new Date(post.publishedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                  : `Created ${new Date(post.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                {post.createdByName && ` · by ${post.createdByName}`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              {post.facebookPostId && (
                <a
                  href={`https://www.facebook.com/${post.facebookPostId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Facebook className="h-3.5 w-3.5" /> View
                </a>
              )}
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
