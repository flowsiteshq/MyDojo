import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Pause, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function MembershipChangeRequestDialog() {
  const [open, setOpen] = useState(false);
  const [requestType, setRequestType] = useState<"pause" | "cancel">("pause");
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();

  const requestChangeMutation = trpc.member.requestChange.useMutation({
    onSuccess: () => {
      toast.success("Your request has been submitted and is pending admin approval.");
      setOpen(false);
      setReason("");
      setRequestType("pause");
      // Invalidate queries to refresh the dashboard
      utils.member.getChangeRequests.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (reason.length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    requestChangeMutation.mutate({
      requestType,
      reason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Manage Membership
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Membership Change</DialogTitle>
          <DialogDescription>
            Submit a request to pause or cancel your membership. An admin will review your request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Request Type</Label>
            <RadioGroup value={requestType} onValueChange={(value) => setRequestType(value as "pause" | "cancel")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="pause" id="pause" />
                <Label htmlFor="pause" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Pause className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Pause Membership</p>
                    <p className="text-sm text-gray-600">Temporarily suspend your membership</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="cancel" id="cancel" />
                <Label htmlFor="cancel" className="flex items-center gap-2 cursor-pointer flex-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium">Cancel Membership</p>
                    <p className="text-sm text-gray-600">Permanently end your membership</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="reason">Reason for Request *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed explanation for your request (minimum 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-sm text-gray-600">
              {reason.length}/10 characters minimum
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Your request will be reviewed by an admin. You will be notified once a decision has been made.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={requestChangeMutation.isPending || reason.length < 10}
          >
            {requestChangeMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
