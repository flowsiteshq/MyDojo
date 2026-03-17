import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UserPlus, Mail, Clock, CheckCircle2, XCircle, Trash2, Copy, Users, Shield, RefreshCw, Bell, Phone, BellOff, MessageSquare } from "lucide-react";

export default function AdminStaff() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "admin">("staff");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  // Staff notification phone editing state
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editNotify, setEditNotify] = useState(true);

  const { data: invites, isLoading, refetch } = trpc.admin.listStaffInvites.useQuery();
  const { data: staffList, refetch: refetchStaff } = trpc.commissions.getStaffList.useQuery();

  const createInvite = trpc.admin.createStaffInvite.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation sent successfully!");
      setLastInviteUrl(data.inviteUrl);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("staff");
      refetch();
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to send invitation");
    },
  });

  const revokeInvite = trpc.admin.revokeStaffInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      refetch();
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to revoke invitation");
    },
  });

  const resendInvite = trpc.admin.resendStaffInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent! The link has been refreshed for another 48 hours.");
      refetch();
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to resend invitation");
    },
  });

  const testStaffNotification = trpc.admin.testStaffNotification.useMutation({
    onSuccess: () => {
      toast.success("Test SMS sent to all staff with notifications enabled!");
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to send test SMS");
    },
  });

  const updateStaffPhone = trpc.commissions.adminUpdateStaffPhone.useMutation({
    onSuccess: () => {
      toast.success("Notification settings saved");
      setEditingStaffId(null);
      refetchStaff();
    },
    onError: (err: unknown) => {
      toast.error((err as { message?: string })?.message || "Failed to save settings");
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    createInvite.mutate({ email: inviteEmail.trim(), name: inviteName.trim() || undefined, role: inviteRole });
  };

  const startEditStaff = (staff: { id: number; phone: string | null; leadSmsNotify: number }) => {
    setEditingStaffId(staff.id);
    setEditPhone(staff.phone || "");
    setEditNotify(staff.leadSmsNotify === 1);
  };

  const saveStaffPhone = (userId: number) => {
    updateStaffPhone.mutate({ userId, phone: editPhone || undefined, leadSmsNotify: editNotify });
  };

  const pendingCount = invites?.filter((i: { accepted: number; expiresAt: Date | string }) => !i.accepted && new Date() < new Date(i.expiresAt)).length ?? 0;
  const acceptedCount = invites?.filter((i: { accepted: number }) => i.accepted).length ?? 0;

  return (
    <AdminLayout>
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Invite and manage your dojo staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50 gap-2"
            onClick={() => testStaffNotification.mutate()}
            disabled={testStaffNotification.isPending}
          >
            <MessageSquare className="h-4 w-4" />
            {testStaffNotification.isPending ? "Sending..." : "Test SMS"}
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{invites?.length ?? 0}</p>
              <p className="text-sm text-gray-500">Total Invites</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedCount}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead SMS Notifications */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-600" />
            Lead SMS Notifications
          </CardTitle>
          <CardDescription>
            When a new lead comes in (from GHL, Facebook, website, or manual entry), staff members with a phone number and notifications enabled will receive an instant text message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!staffList || staffList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No staff members yet. Invite staff to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {staffList.map((staff) => (
                <div key={staff.id} className="py-4">
                  {editingStaffId === staff.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <span className="text-red-700 font-bold text-sm">{(staff.name || staff.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name || staff.email}</p>
                          <p className="text-xs text-gray-400">{staff.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">Notification Phone Number</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                            <Input
                              placeholder="+1 (832) 555-1234"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 block">Receive Lead Alerts</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Switch
                              checked={editNotify}
                              onCheckedChange={setEditNotify}
                              id={`notify-${staff.id}`}
                            />
                            <Label htmlFor={`notify-${staff.id}`} className="text-sm cursor-pointer">
                              {editNotify ? "Enabled" : "Disabled"}
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pl-10">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => saveStaffPhone(staff.id)}
                          disabled={updateStaffPhone.isPending}
                        >
                          {updateStaffPhone.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingStaffId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <span className="text-red-700 font-bold text-sm">{(staff.name || staff.email || "?")[0].toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{staff.name || staff.email}</p>
                          <p className="text-xs text-gray-400 truncate">{staff.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {staff.phone ? (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {staff.phone}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                No phone set
                              </span>
                            )}
                            {staff.phone && (
                              staff.leadSmsNotify === 1 ? (
                                <Badge className="bg-green-100 text-green-700 border-0 text-xs gap-1">
                                  <Bell className="h-3 w-3" /> Alerts on
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-500 border-0 text-xs gap-1">
                                  <BellOff className="h-3 w-3" /> Alerts off
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Shield className="h-3 w-3" />
                          {staff.role === "admin" ? "Admin" : "Staff"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => startEditStaff({ id: staff.id, phone: staff.phone ?? null, leadSmsNotify: staff.leadSmsNotify ?? 1 })}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading invitations...</div>
          ) : !invites || invites.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No invitations sent yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Invite Staff Member" to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {invites.map((invite: { id: number; name: string | null; email: string; accepted: number; expiresAt: Date | string; createdAt: Date | string; inviteRole: string; token: string }) => {
                const isExpired = new Date() > new Date(invite.expiresAt);
                const statusLabel = invite.accepted ? "Accepted" : isExpired ? "Expired" : "Pending";
                const statusColor = invite.accepted
                  ? "bg-green-100 text-green-700"
                  : isExpired
                  ? "bg-gray-100 text-gray-500"
                  : "bg-yellow-100 text-yellow-700";

                return (
                  <div key={invite.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-full ${invite.accepted ? "bg-green-100" : isExpired ? "bg-gray-100" : "bg-yellow-100"}`}>
                        {invite.accepted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : isExpired ? (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {invite.name || invite.email}
                        </p>
                        {invite.name && (
                          <p className="text-sm text-gray-500 truncate">{invite.email}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Sent {new Date(invite.createdAt).toLocaleDateString()} ·{" "}
                          {isExpired ? "Expired" : `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`${statusColor} border-0 text-xs`}>{statusLabel}</Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Shield className="h-3 w-3" />
                        {invite.inviteRole === "admin" ? "Admin" : "Staff"}
                      </Badge>
                      {!invite.accepted && !isExpired && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                          title="Copy invite link"
                          onClick={() => navigator.clipboard.writeText(`https://mydojoma.com/staff-invite?token=${invite.token}`).then(() => toast.success("Invite link copied!"))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {!invite.accepted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-green-600"
                          title="Resend invite email"
                          onClick={() => resendInvite.mutate({ id: invite.id })}
                          disabled={resendInvite.isPending && resendInvite.variables?.id === invite.id}
                        >
                          {resendInvite.isPending && resendInvite.variables?.id === invite.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {!invite.accepted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          title="Revoke invite"
                          onClick={() => revokeInvite.mutate({ id: invite.id })}
                          disabled={revokeInvite.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-red-600" />
              Invite Staff Member
            </DialogTitle>
          </DialogHeader>

          {lastInviteUrl ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Invitation sent!</p>
                <p className="text-sm text-green-600 mt-1">An email has been sent with the invite link.</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Invite link (backup)</Label>
                <div className="flex gap-2">
                  <Input value={lastInviteUrl} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(lastInviteUrl).then(() => toast.success("Copied!"))}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => { setLastInviteUrl(null); setShowInviteModal(false); }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input
                  id="invite-name"
                  placeholder="e.g. Sarah Johnson"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="invite-email">Email address *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="staff@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                />
              </div>
              <div>
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "staff" | "admin")}>
                  <SelectTrigger id="invite-role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff — can view students, attendance, and schedule</SelectItem>
                    <SelectItem value="admin">Admin — full access including billing and settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-400">
                The invite link expires in 48 hours. The staff member will need to log in with their Manus account to accept.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSendInvite}
                  disabled={createInvite.isPending}
                >
                  {createInvite.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
