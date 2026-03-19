import { useState } from "react";
// Promo Blast v1.1 - St. Patrick's Day campaign
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Megaphone, Send, Users, UserCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const TEMPLATES = [
  {
    name: "🥊 Kickboxing Special",
    leadMessage: "🥊 Ready to burn up to 800 calories in one class? MyDojo's Adult Kickboxing is now enrolling! Get your first month FREE when you sign up this week. All fitness levels welcome. Call (877) 4-MYDOJO or visit mydojoma.com to claim your spot!",
    staffMessage: "🥊 Kickboxing promo is live! First month FREE for new enrollments this week. Push it to your contacts and let's fill the class! 💪 - MyDojo Team",
  },
  {
    name: "☀️ Summer Camp",
    leadMessage: "☀️ Summer Camp spots are filling fast at MyDojo! Give your child an unforgettable summer of martial arts, fitness & fun. Early bird pricing available — limited spots! Call (877) 4-MYDOJO or visit mydojoma.com to register today!",
    staffMessage: "☀️ Summer Camp promo is live! Early bird pricing available. Remind your contacts and let's fill those spots! 🥋 - MyDojo Team",
  },
  {
    name: "🥋 Karate for Kids",
    leadMessage: "🥋 Build confidence, discipline & focus in your child! MyDojo's Karate program for all ages is now enrolling. Try a FREE class this week — no commitment needed. Call (877) 4-MYDOJO or visit mydojoma.com to schedule your free trial!",
    staffMessage: "🥋 Kids Karate promo is live! Free trial class for new students. Share with parents you know — let's grow the kids program! 💪 - MyDojo Team",
  },
];

export default function AdminPromoBlast() {
  const [leadMessage, setLeadMessage] = useState(TEMPLATES[0].leadMessage);
  const [staffMessage, setStaffMessage] = useState(TEMPLATES[0].staffMessage);
  const [sendToLeads, setSendToLeads] = useState(true);
  const [sendToStaff, setSendToStaff] = useState(true);
  const [excludeEnrolled, setExcludeEnrolled] = useState(true);
  const [result, setResult] = useState<{ successCount: number; failCount: number; errors: string[] } | null>(null);

  const sendBlast = trpc.admin.sendPromoBlast.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success(`✅ ${data.successCount} messages sent${data.failCount > 0 ? `, ${data.failCount} failed` : ""}`);
    },
    onError: (err) => {
      toast.error(`Error sending blast: ${err.message}`);
    },
  });

  const handleTemplate = (tpl: typeof TEMPLATES[0]) => {
    setLeadMessage(tpl.leadMessage);
    setStaffMessage(tpl.staffMessage);
    setResult(null);
  };

  const handleSend = () => {
    if (!sendToLeads && !sendToStaff) {
      toast.error("Please select at least one recipient group.");
      return;
    }
    if (leadMessage.length < 10) {
      toast.error("Please enter a longer message (at least 10 characters).");
      return;
    }
    sendBlast.mutate({
      message: leadMessage,
      staffMessage: staffMessage || undefined,
      sendToLeads,
      sendToStaff,
      excludeEnrolled,
    });
  };

  return (
    <AdminLayout>
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Promo Blast</h1>
          <p className="text-muted-foreground text-sm">Send a promotional SMS to leads and/or staff — all ages welcome</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">Quick Templates</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl) => (
            <Button
              key={tpl.name}
              variant="outline"
              size="sm"
              onClick={() => handleTemplate(tpl)}
              className="text-xs"
            >
              {tpl.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Lead Message */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-1 block">
          Message to Leads
          <span className="text-muted-foreground font-normal ml-2">({leadMessage.length}/500 chars)</span>
        </Label>
        <Textarea
          value={leadMessage}
          onChange={(e) => setLeadMessage(e.target.value)}
          placeholder="Type your promotional message for leads..."
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
      </div>

      {/* Staff Message */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-1 block">
          Message to Staff
          <span className="text-muted-foreground font-normal ml-2">(optional — uses lead message if blank)</span>
        </Label>
        <Textarea
          value={staffMessage}
          onChange={(e) => setStaffMessage(e.target.value)}
          placeholder="Type a different message for staff (or leave blank to use the same message)..."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
      </div>

      {/* Options */}
      <div className="bg-muted/40 rounded-lg p-4 mb-6 space-y-3">
        <p className="text-sm font-medium">Send To</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="sendToLeads" className="text-sm cursor-pointer">All Leads</Label>
          </div>
          <Switch id="sendToLeads" checked={sendToLeads} onCheckedChange={setSendToLeads} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="sendToStaff" className="text-sm cursor-pointer">All Staff</Label>
          </div>
          <Switch id="sendToStaff" checked={sendToStaff} onCheckedChange={setSendToStaff} />
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <Label htmlFor="excludeEnrolled" className="text-sm cursor-pointer text-muted-foreground">
            Exclude already-enrolled students
          </Label>
          <Switch id="excludeEnrolled" checked={excludeEnrolled} onCheckedChange={setExcludeEnrolled} />
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={sendBlast.isPending}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {sendBlast.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending messages...
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Send Promo Blast
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg border ${result.failCount === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failCount === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className="font-semibold text-sm">Blast Complete</span>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              ✓ {result.successCount} sent
            </Badge>
            {result.failCount > 0 && (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                ✗ {result.failCount} failed
              </Badge>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
