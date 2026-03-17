import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package,
  Pencil,
  Plus,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Trash2,
  Calculator,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PackageFormState {
  name: string;
  monthlyPrice: string;
  enrollmentFee: string;
  description: string;
  benefits: string; // newline-separated
  invitationOnly: boolean;
  fluidpayPlanId: string;
}

const emptyForm = (): PackageFormState => ({
  name: "",
  monthlyPrice: "",
  enrollmentFee: "99.00",
  description: "",
  benefits: "",
  invitationOnly: false,
  fluidpayPlanId: "",
});

function formFromPackage(pkg: {
  name: string;
  monthlyPrice: string;
  enrollmentFee: string;
  description?: string | null;
  benefits?: string | null;
  invitationOnly: number;
  fluidpayPlanId?: string | null;
}): PackageFormState {
  let benefitLines = "";
  if (pkg.benefits) {
    try {
      const arr = JSON.parse(pkg.benefits);
      benefitLines = Array.isArray(arr) ? arr.join("\n") : pkg.benefits;
    } catch {
      benefitLines = pkg.benefits;
    }
  }
  return {
    name: pkg.name,
    monthlyPrice: parseFloat(pkg.monthlyPrice as string).toFixed(2),
    enrollmentFee: parseFloat(pkg.enrollmentFee as string).toFixed(2),
    description: pkg.description ?? "",
    benefits: benefitLines,
    invitationOnly: pkg.invitationOnly === 1,
    fluidpayPlanId: pkg.fluidpayPlanId ?? "",
  };
}

// ─── Package Form Dialog ──────────────────────────────────────────────────────

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  editingId: number | null;
  initialForm: PackageFormState;
  onSaved: () => void;
}

function PackageDialog({ open, onClose, editingId, initialForm, onSaved }: PackageDialogProps) {
  const [form, setForm] = useState<PackageFormState>(initialForm);
  const utils = trpc.useUtils();

  // Reset form whenever dialog opens with new data
  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setForm(initialForm);
  };

  const updateMutation = trpc.admin.updatePackage.useMutation({
    onSuccess: () => {
      toast.success("Package updated successfully.");
      utils.admin.getPackages.invalidate();
      onSaved();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Failed to update package"),
  });

  const createMutation = trpc.admin.createPackage.useMutation({
    onSuccess: () => {
      toast.success("Package created successfully.");
      utils.admin.getPackages.invalidate();
      onSaved();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Failed to create package"),
  });

  const monthly = parseFloat(form.monthlyPrice) || 0;
  const enrollment = parseFloat(form.enrollmentFee) || 0;
  const downPayment = monthly + enrollment;

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Package name is required."); return; }
    if (isNaN(monthly) || monthly < 0) { toast.error("Monthly price must be a valid number."); return; }
    if (isNaN(enrollment) || enrollment < 0) { toast.error("Enrollment fee must be a valid number."); return; }

    const benefitsArr = form.benefits
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    if (editingId !== null) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        monthlyPrice: monthly,
        enrollmentFee: enrollment,
        description: form.description,
        benefits: benefitsArr,
        invitationOnly: form.invitationOnly,
        fluidpayPlanId: form.fluidpayPlanId,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        monthlyPrice: monthly,
        enrollmentFee: enrollment,
        description: form.description,
        benefits: benefitsArr,
        invitationOnly: form.invitationOnly,
        fluidpayPlanId: form.fluidpayPlanId,
      });
    }
  };

  const isPending = updateMutation.isPending || createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { handleOpen(o); if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId !== null ? "Edit Package" : "New Package"}</DialogTitle>
          <DialogDescription>
            Down payment is automatically calculated as Monthly Price + Enrollment Fee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Package Name */}
          <div className="space-y-1">
            <Label htmlFor="pkg-name">Package Name</Label>
            <Input
              id="pkg-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Foundation"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="pkg-monthly">Monthly Price ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pkg-monthly"
                  className="pl-8"
                  value={form.monthlyPrice}
                  onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                  placeholder="149.00"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pkg-enrollment">Enrollment Fee ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pkg-enrollment"
                  className="pl-8"
                  value={form.enrollmentFee}
                  onChange={(e) => setForm({ ...form, enrollmentFee: e.target.value })}
                  placeholder="99.00"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Auto-calculated down payment */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Down payment (charged on day 1):
            </span>
            <span className="font-bold text-sm ml-auto">
              ${downPayment.toFixed(2)}
            </span>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="pkg-desc">Description</Label>
            <Textarea
              id="pkg-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Month-to-month program for beginners. Cancel with 60-day notice."
              rows={2}
            />
          </div>

          {/* Benefits */}
          <div className="space-y-1">
            <Label htmlFor="pkg-benefits">Benefits (one per line)</Label>
            <Textarea
              id="pkg-benefits"
              value={form.benefits}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              placeholder={"1 White Traditional Karate Gi\n2x 30min Martial Arts Classes Weekly\n$49 Certification Fee"}
              rows={5}
            />
          </div>

          {/* Fluid Pay Plan ID */}
          <div className="space-y-1">
            <Label htmlFor="pkg-fp-plan">Fluid Pay Plan ID</Label>
            <Input
              id="pkg-fp-plan"
              value={form.fluidpayPlanId}
              onChange={(e) => setForm({ ...form, fluidpayPlanId: e.target.value })}
              placeholder="fp_plan_xxxxxxxx"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Required for automatic monthly billing via Fluid Pay recurring subscriptions.
            </p>
          </div>

          {/* Invitation Only */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Invitation Only</Label>
              <p className="text-xs text-muted-foreground">
                Hide from public enrollment — staff must enroll members manually.
              </p>
            </div>
            <Switch
              checked={form.invitationOnly}
              onCheckedChange={(v) => setForm({ ...form, invitationOnly: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
            {editingId !== null ? "Save Changes" : "Create Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────

interface PackageCardProps {
  pkg: {
    id: number;
    name: string;
    monthlyPrice: string;
    enrollmentFee: string;
    downPayment: string;
    description?: string | null;
    benefits?: string | null;
    invitationOnly: number;
    isActive: number;
    fluidpayPlanId?: string | null;
  };
  onEdit: () => void;
  onToggleActive: () => void;
  isToggling: boolean;
}

function PackageCard({ pkg, onEdit, onToggleActive, isToggling }: PackageCardProps) {
  const monthly = parseFloat(pkg.monthlyPrice as string);
  const enrollment = parseFloat(pkg.enrollmentFee as string);
  const downPayment = parseFloat(pkg.downPayment as string);
  const isActive = pkg.isActive === 1;
  const isInviteOnly = pkg.invitationOnly === 1;

  let benefits: string[] = [];
  if (pkg.benefits) {
    try { benefits = JSON.parse(pkg.benefits); } catch { benefits = []; }
  }

  // Verify math
  const expectedDown = monthly + enrollment;
  const mathCorrect = Math.abs(downPayment - expectedDown) < 0.01;

  return (
    <Card className={`relative ${!isActive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {pkg.name}
              {isInviteOnly && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Invite Only
                </Badge>
              )}
              {!isActive && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </CardTitle>
            {pkg.description && (
              <CardDescription className="mt-1">{pkg.description}</CardDescription>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing breakdown */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly price</span>
            <span className="font-medium">${monthly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Enrollment fee (one-time)</span>
            <span className="font-medium">${enrollment.toFixed(2)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between text-sm font-bold">
            <span className="flex items-center gap-1">
              Total due on day 1
              {!mathCorrect && (
                <span className="text-red-500 text-xs font-normal ml-1">(math error!)</span>
              )}
            </span>
            <span className={mathCorrect ? "text-green-700" : "text-red-600"}>
              ${downPayment.toFixed(2)}
            </span>
          </div>
          {!mathCorrect && (
            <p className="text-xs text-red-500">
              Expected ${expectedDown.toFixed(2)} — click Edit to recalculate.
            </p>
          )}
        </div>

        {/* Benefits */}
        {benefits.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Included Benefits
            </p>
            <ul className="space-y-1">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Fluid Pay Plan */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fluid Pay Plan ID</span>
          {pkg.fluidpayPlanId ? (
            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
              {pkg.fluidpayPlanId}
            </code>
          ) : (
            <span className="text-red-500 text-xs">Not set — recurring billing disabled</span>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-sm text-muted-foreground">
            {isActive ? "Visible to members" : "Hidden from enrollment"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleActive}
            disabled={isToggling}
            className={isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
          >
            {isToggling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isActive ? (
              <><XCircle className="h-4 w-4 mr-1" />Deactivate</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-1" />Activate</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPackages() {
  const { data: packages, isLoading, refetch } = trpc.admin.getPackages.useQuery();
  const utils = trpc.useUtils();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogForm, setDialogForm] = useState<PackageFormState>(emptyForm());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const updateMutation = trpc.admin.updatePackage.useMutation({
    onSuccess: () => {
      utils.admin.getPackages.invalidate();
      setTogglingId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update");
      setTogglingId(null);
    },
  });

  const handleEdit = (pkg: NonNullable<typeof packages>[0]) => {
    setEditingId(pkg.id);
    setDialogForm(formFromPackage({
      ...pkg,
      monthlyPrice: pkg.monthlyPrice as string,
      enrollmentFee: pkg.enrollmentFee as string,
    }));
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setDialogForm(emptyForm());
    setDialogOpen(true);
  };

  const handleToggleActive = (pkg: NonNullable<typeof packages>[0]) => {
    setTogglingId(pkg.id);
    updateMutation.mutate({ id: pkg.id, isActive: pkg.isActive === 0 });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Membership Packages
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage pricing, benefits, and availability. Down payment is always auto-calculated as
              <strong> Monthly Price + Enrollment Fee</strong>.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleNew}>
              <Plus className="h-4 w-4 mr-1" />
              New Package
            </Button>
          </div>
        </div>

        {/* Pricing rule callout */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <Calculator className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <strong>Auto-calculated down payment:</strong> The amount charged on enrollment day is
            always <em>Monthly Price + Enrollment Fee</em>. You never need to enter it manually —
            the system computes it for you and prevents pricing errors.
          </div>
        </div>

        {/* Package grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading packages…
          </div>
        ) : !packages || packages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold">No packages yet</p>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first membership package to get started.
              </p>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-1" />
                Create Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg as Parameters<typeof PackageCard>[0]["pkg"]}
                onEdit={() => handleEdit(pkg)}
                onToggleActive={() => handleToggleActive(pkg)}
                isToggling={togglingId === pkg.id}
              />
            ))}
          </div>
        )}

        {/* Edit / Create dialog */}
        <PackageDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          editingId={editingId}
          initialForm={dialogForm}
          onSaved={() => refetch()}
        />
      </div>
    </AdminLayout>
  );
}
