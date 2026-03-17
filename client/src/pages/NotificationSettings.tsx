import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Bell, BellOff, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Link } from "wouter";

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState({
    classUpdates: true,
    scheduleChanges: true,
    specialEvents: true,
    promotions: true,
    generalNews: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = trpc.notifications.getPreferences.useQuery(undefined, {
    enabled: !!user,
  });

  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved successfully!");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Failed to save preferences: " + error.message);
    },
  });

  useEffect(() => {
    if (data) {
      setPreferences({
        classUpdates: data.classUpdates === 1,
        scheduleChanges: data.scheduleChanges === 1,
        specialEvents: data.specialEvents === 1,
        promotions: data.promotions === 1,
        generalNews: data.generalNews === 1,
      });
    }
  }, [data]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      classUpdates: preferences.classUpdates ? 1 : 0,
      scheduleChanges: preferences.scheduleChanges ? 1 : 0,
      specialEvents: preferences.specialEvents ? 1 : 0,
      promotions: preferences.promotions ? 1 : 0,
      generalNews: preferences.generalNews ? 1 : 0,
    });
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
            STAY IN THE <span className="text-primary">LOOP</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Sign in to customize your notification preferences and never miss important updates about classes, events, and special offers at MyDojo.
          </p>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="text-white font-bold mb-2">Class Updates</h3>
              <p className="text-gray-400 text-sm">Get notified about new classes and instructor changes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="text-white font-bold mb-2">Schedule Changes</h3>
              <p className="text-gray-400 text-sm">Stay informed about cancellations and time changes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="text-white font-bold mb-2">Special Events</h3>
              <p className="text-gray-400 text-sm">Never miss tournaments, belt testing, and workshops</p>
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

  const notificationTypes = [
    {
      key: "classUpdates" as const,
      title: "Class Updates",
      description: "Get notified about new classes, instructor changes, and class-related announcements.",
      icon: "📚",
    },
    {
      key: "scheduleChanges" as const,
      title: "Schedule Changes",
      description: "Receive alerts about class cancellations, time changes, or location updates.",
      icon: "📅",
    },
    {
      key: "specialEvents" as const,
      title: "Special Events",
      description: "Stay informed about tournaments, belt testing, seminars, and special workshops.",
      icon: "🎉",
    },
    {
      key: "promotions" as const,
      title: "Promotions & Offers",
      description: "Get exclusive deals, membership discounts, and special promotional offers.",
      icon: "💰",
    },
    {
      key: "generalNews" as const,
      title: "General News",
      description: "Receive updates about dojo news, community highlights, and success stories.",
      icon: "📰",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-heading font-bold text-black mb-2">
            Notification Settings
          </h1>
          <p className="text-gray-600">
            Customize which notifications you want to receive from MyDojo.
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which types of notifications you'd like to receive. You can change these settings at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map((type, index) => (
              <div key={type.key}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{type.icon}</span>
                      <Label htmlFor={type.key} className="text-base font-semibold cursor-pointer">
                        {type.title}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">{type.description}</p>
                  </div>
                  <Switch
                    id={type.key}
                    checked={preferences[type.key]}
                    onCheckedChange={() => handleToggle(type.key)}
                  />
                </div>
                {index < notificationTypes.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}

            {/* Save Button */}
            <div className="pt-6 flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> To receive push notifications, you must also enable browser notifications
                in the footer of any page. These settings only control which types of notifications you receive.
              </p>
              <p className="text-sm text-blue-900 mt-2">
                <Link href="/notifications">
                  <span className="text-primary hover:underline cursor-pointer font-semibold">View notification history →</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? <Link href="/contact"><span className="text-primary hover:underline cursor-pointer">Contact us</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
