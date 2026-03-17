import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import {
  getNotificationPermission,
  isSubscribedToPushNotifications,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/pushNotifications";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function NotificationSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isSubscribedToPushNotifications();
    setIsSubscribed(subscribed);
    setPermission(getNotificationPermission());
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPushNotifications();
      
      // In production, you would send this subscription to your backend
      // await trpc.notifications.subscribe.mutate({ subscription: subscription.toJSON() });
      
      setIsSubscribed(true);
      setPermission('granted');
      toast.success('Notifications enabled! You\'ll receive updates about classes and events.');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Failed to enable notifications. Please check your browser settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPushNotifications();
      
      // In production, you would notify your backend
      // await trpc.notifications.unsubscribe.mutate();
      
      setIsSubscribed(false);
      toast.success('Notifications disabled.');
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('Failed to disable notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Blocked
          </CardTitle>
          <CardDescription>
            You've blocked notifications for this site. To receive updates, please enable notifications in your browser settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Stay Updated
        </CardTitle>
        <CardDescription>
          Get notified about new classes, schedule changes, and special events.{" "}
          <Link href="/settings/notifications">
            <span className="text-primary hover:underline cursor-pointer">Customize preferences</span>
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <Button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <BellOff className="mr-2 h-4 w-4" />
            {isLoading ? 'Unsubscribing...' : 'Disable Notifications'}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full"
          >
            <Bell className="mr-2 h-4 w-4" />
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
