import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, AlertTriangle, User, Mail } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminMembershipRequests() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null);
  const utils = trpc.useUtils();

  const { data: requests, isLoading } = trpc.member.getPendingRequests.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const approveMutation = trpc.member.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved successfully");
      setSelectedRequest(null);
      setAdminNotes("");
      setActionType(null);
      utils.member.getPendingRequests.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const denyMutation = trpc.member.denyRequest.useMutation({
    onSuccess: () => {
      toast.success("Request denied successfully");
      setSelectedRequest(null);
      setAdminNotes("");
      setActionType(null);
      utils.member.getPendingRequests.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAction = () => {
    if (!selectedRequest) return;

    if (actionType === "approve") {
      approveMutation.mutate({
        requestId: selectedRequest.id,
        adminNotes: adminNotes || undefined,
      });
    } else if (actionType === "deny") {
      denyMutation.mutate({
        requestId: selectedRequest.id,
        adminNotes: adminNotes || undefined,
      });
    }
  };

  const openActionDialog = (request: any, action: "approve" | "deny") => {
    setSelectedRequest(request);
    setActionType(action);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="container max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription className="text-lg">
                You do not have permission to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <Button onClick={() => setLocation("/")}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Membership Change Requests</h1>
            <p className="text-gray-600 mt-2">Review and manage pending requests</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Requests List */}
        {!requests || requests.length === 0 ? (
          <Card className="border-2">
            <CardContent className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-600">There are no membership change requests to review at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        request.requestType === "pause" 
                          ? "bg-blue-100" 
                          : "bg-red-100"
                      }`}>
                        {request.requestType === "pause" ? (
                          <Clock className={`h-6 w-6 ${
                            request.requestType === "pause" 
                              ? "text-blue-600" 
                              : "text-red-600"
                          }`} />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="capitalize">
                          {request.requestType} Request
                        </CardTitle>
                        <CardDescription>
                          Submitted on {format(new Date(request.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Member Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Member</p>
                        <p className="font-semibold">{request.memberName || request.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{request.memberEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Reason for Request</Label>
                    <p className="mt-2 p-4 bg-white border rounded-lg text-gray-900">
                      {request.reason}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => openActionDialog(request, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openActionDialog(request, "deny")}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Confirmation Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => {
          setSelectedRequest(null);
          setAdminNotes("");
          setActionType(null);
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve" : "Deny"} Request
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "This will approve the membership change request and update the member's status."
                  : "This will deny the membership change request. The member will be notified."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add any notes or comments about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes("");
                  setActionType(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={approveMutation.isPending || denyMutation.isPending}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={actionType === "deny" ? "destructive" : "default"}
              >
                {(approveMutation.isPending || denyMutation.isPending) 
                  ? "Processing..." 
                  : `Confirm ${actionType === "approve" ? "Approval" : "Denial"}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
