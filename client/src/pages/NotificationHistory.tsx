import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Bell, BellOff, Check, CheckCheck, Loader2, Mail, MailOpen, Trash2, Calendar, Gift, Newspaper, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

type NotificationType = "classUpdates" | "scheduleChanges" | "specialEvents" | "promotions" | "generalNews" | "all";

export default function NotificationHistory() {
  const { user, loading: authLoading } = useAuth();
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");

  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notificationHistory.list.useQuery(
    {
      type: typeFilter === "all" ? undefined : typeFilter,
      isRead: readFilter === "all" ? undefined : readFilter === "read" ? 1 : 0,
      limit: 50,
    },
    {
      enabled: !!user,
    }
  );

  const { data: unreadData } = trpc.notificationHistory.unreadCount.useQuery(undefined, {
    enabled: !!user,
  });

  const markAsReadMutation = trpc.notificationHistory.markAsRead.useMutation({
    onSuccess: () => {
      utils.notificationHistory.list.invalidate();
      utils.notificationHistory.unreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notificationHistory.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notificationHistory.list.invalidate();
      utils.notificationHistory.unreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.notificationHistory.delete.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      utils.notificationHistory.list.invalidate();
      utils.notificationHistory.unreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDelete = (notificationId: number) => {
    deleteMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "classUpdates":
        return <Bell className="h-4 w-4" />;
      case "scheduleChanges":
        return <Calendar className="h-4 w-4" />;
      case "specialEvents":
        return <AlertCircle className="h-4 w-4" />;
      case "promotions":
        return <Gift className="h-4 w-4" />;
      case "generalNews":
        return <Newspaper className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "classUpdates":
        return "Class Updates";
      case "scheduleChanges":
        return "Schedule Changes";
      case "specialEvents":
        return "Special Events";
      case "promotions":
        return "Promotions";
      case "generalNews":
        return "General News";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "classUpdates":
        return "bg-blue-100 text-blue-800";
      case "scheduleChanges":
        return "bg-orange-100 text-orange-800";
      case "specialEvents":
        return "bg-purple-100 text-purple-800";
      case "promotions":
        return "bg-green-100 text-green-800";
      case "generalNews":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg" 
            alt="MyDojo Training" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-primary/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          {/* Icon */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-primary rounded-full">
            <img src="/images/logo-white.png" alt="MyDojo" className="h-16 w-16" />
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-white mb-6">
            YOUR NOTIFICATION <span className="text-primary">HISTORY</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Sign in to view all your past notifications and stay on top of everything happening at MyDojo.
          </p>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">📜</div>
              <h3 className="text-white font-bold mb-2">Full History</h3>
              <p className="text-gray-400 text-sm">Access all your past notifications in one place</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-white font-bold mb-2">Smart Filters</h3>
              <p className="text-gray-400 text-sm">Filter by type and read status to find what you need</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-white font-bold mb-2">Easy Management</h3>
              <p className="text-gray-400 text-sm">Mark as read or delete notifications with one click</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            asChild 
            className="bg-primary hover:bg-primary/90 text-white text-lg px-12 py-8 h-auto font-heading uppercase tracking-wider shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <a href="/login">Sign In to Continue</a>
          </Button>

          {/* Back Link */}
          <div className="mt-8">
            <Link href="/">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                ← Back to Home
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-bold text-black mb-2">
                Notification History
              </h1>
              <p className="text-gray-600">
                View and manage all your past notifications from MyDojo.
              </p>
            </div>
            {unreadData && unreadData.count > 0 && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {unreadData.count} Unread
              </Badge>
            )}
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as NotificationType)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="classUpdates">Class Updates</SelectItem>
                    <SelectItem value="scheduleChanges">Schedule Changes</SelectItem>
                    <SelectItem value="specialEvents">Special Events</SelectItem>
                    <SelectItem value="promotions">Promotions</SelectItem>
                    <SelectItem value="generalNews">General News</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={readFilter} onValueChange={(value) => setReadFilter(value as "all" | "read" | "unread")}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {unreadData && unreadData.count > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={notification.isRead === 0 ? "border-l-4 border-l-primary bg-white" : "bg-white"}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getTypeColor(notification.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(notification.type)}
                            {getTypeLabel(notification.type)}
                          </span>
                        </Badge>
                        {notification.isRead === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Mail className="mr-1 h-3 w-3" />
                            Unread
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {notification.isRead === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <MailOpen className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Notifications
              </h3>
              <p className="text-gray-600 mb-6">
                {typeFilter !== "all" || readFilter !== "all"
                  ? "No notifications match your current filters."
                  : "You don't have any notifications yet."}
              </p>
              {(typeFilter !== "all" || readFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter("all");
                    setReadFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Link */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Want to customize which notifications you receive?{" "}
            <Link href="/settings/notifications">
              <span className="text-primary hover:underline cursor-pointer">
                Go to Notification Settings
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
