import { useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Link2, Plus, Copy, ToggleLeft, ToggleRight, Trash2, RefreshCw,
  DollarSign, Repeat, ShoppingBag, Eye, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle2, XCircle, Clock, Loader2, Send, Mail, Phone,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentType = "one_time" | "recurring" | "merchandise";
type BillingInterval = "weekly" | "monthly" | "yearly";

interface MerchandiseItem {
  name: string;
  price: number;
  quantity: number;
}

interface CreateFormState {
  type: PaymentType;
  title: string;
  description: string;
  amount: string;
  billingInterval: BillingInterval;
  billingCycles: string;
  merchandiseItems: MerchandiseItem[];
  requiresShipping: boolean;
  expiresAt: string;
}

const defaultForm = (): CreateFormState => ({
  type: "one_time",
  title: "",
  description: "",
  amount: "",
  billingInterval: "monthly",
  billingCycles: "",
  merchandiseItems: [{ name: "", price: 0, quantity: 1 }],
  requiresShipping: false,
  expiresAt: "",
});

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PaymentType }) {
  const map: Record<PaymentType, { label: string; className: string }> = {
    one_time: { label: "One-Time", className: "bg-blue-100 text-blue-800 border-blue-200" },
    recurring: { label: "Recurring", className: "bg-purple-100 text-purple-800 border-purple-200" },
    merchandise: { label: "Merchandise", className: "bg-amber-100 text-amber-800 border-amber-200" },
  };
  const { label, className } = map[type];
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: number }) {
  return isActive
    ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
    : <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Inactive</Badge>;
}

// ─── Payments Detail Dialog ───────────────────────────────────────────────────

function LinkDetailDialog({ linkId, onClose }: { linkId: number; onClose: () => void }) {
  const { data: rawData, isLoading } = trpc.customPayments.getById.useQuery({ id: linkId });
  const data = rawData as (typeof rawData & {
    type: PaymentType;
    isActive: number;
    amount: string | null;
    billingInterval: string | null;
    expiresAt: Date | null;
    merchandiseItems: MerchandiseItem[] | null;
    payments: Array<{
      id: number;
      customerName: string;
      customerEmail: string | null;
      amountCharged: string;
      status: string;
      createdAt: Date;
    }>;
  }) | undefined;

  const copyLink = () => {
    if (!data) return;
    const url = `${window.location.origin}/pay/${data.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {data?.title || "Payment Link Details"}
          </DialogTitle>
          <DialogDescription>
            View payment history and manage this link.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Link URL */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="text-xs flex-1 truncate">{window.location.origin}/pay/{data.token}</code>
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`/pay/${data.token}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                </a>
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <TypeBadge type={data.type as PaymentType} /></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge isActive={data.isActive as number} /></div>
              {data.amount != null && <div><span className="text-muted-foreground">Amount:</span> <strong>${parseFloat(String(data.amount)).toFixed(2)}</strong>{data.billingInterval ? `/${String(data.billingInterval)}` : ""}</div>}
              <div><span className="text-muted-foreground">Uses:</span> <strong>{data.useCount}</strong></div>
              {data.expiresAt != null && <div><span className="text-muted-foreground">Expires:</span> {format(new Date(String(data.expiresAt)), "MMM d, yyyy")}</div>}
            </div>

            {/* Merchandise items */}
            {data.type === "merchandise" && data.merchandiseItems && (
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-1">
                  {(data.merchandiseItems as MerchandiseItem[]).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments table */}
            <div>
              <p className="text-sm font-medium mb-2">Payment History ({data.payments?.length || 0})</p>
              {data.payments && data.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{p.customerName}</div>
                          {p.customerEmail && <div className="text-xs text-muted-foreground">{p.customerEmail}</div>}
                        </TableCell>
                        <TableCell className="font-medium">${parseFloat(p.amountCharged as string).toFixed(2)}</TableCell>
                        <TableCell>
                          {p.status === "approved" ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
                          ) : p.status === "declined" ? (
                            <span className="flex items-center gap-1 text-red-600 text-xs"><XCircle className="h-3.5 w-3.5" /> Declined</span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600 text-xs"><Clock className="h-3.5 w-3.5" /> {p.status}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(p.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No payments yet</p>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Link Dialog ───────────────────────────────────────────────────────

function CreateLinkDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (token: string) => void }) {
  const [form, setForm] = useState<CreateFormState>(defaultForm());
  const utils = trpc.useUtils();

  const createMutation = trpc.customPayments.create.useMutation({
    onSuccess: (data) => {
      toast.success("Payment link created!");
      utils.customPayments.list.invalidate();
      onCreated(data.token);
    },
    onError: (err) => toast.error(err.message || "Failed to create payment link"),
  });

  const addItem = () => setForm(f => ({ ...f, merchandiseItems: [...f.merchandiseItems, { name: "", price: 0, quantity: 1 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, merchandiseItems: f.merchandiseItems.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: keyof MerchandiseItem, value: string | number) =>
    setForm(f => ({ ...f, merchandiseItems: f.merchandiseItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const merchandiseTotal = form.merchandiseItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.type === "one_time" && !form.amount) { toast.error("Amount is required"); return; }
    if (form.type === "recurring" && (!form.amount || !form.billingInterval)) { toast.error("Amount and billing interval are required"); return; }
    if (form.type === "merchandise" && form.merchandiseItems.some(i => !i.name.trim())) { toast.error("All item names are required"); return; }

    createMutation.mutate({
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      amount: form.type !== "merchandise" ? parseFloat(form.amount) : undefined,
      billingInterval: form.type === "recurring" ? form.billingInterval : undefined,
      billingCycles: form.type === "recurring" && form.billingCycles ? parseInt(form.billingCycles) : undefined,
      merchandiseItems: form.type === "merchandise" ? form.merchandiseItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })) : undefined,
      requiresShipping: form.requiresShipping,
      expiresAt: form.expiresAt || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Payment Link
          </DialogTitle>
          <DialogDescription>
            Generate a shareable payment link for customers to pay via FluidPay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Payment Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(["one_time", "recurring", "merchandise"] as PaymentType[]).map((t) => {
              const icons = { one_time: DollarSign, recurring: Repeat, merchandise: ShoppingBag };
              const labels = { one_time: "One-Time", recurring: "Recurring", merchandise: "Merchandise" };
              const Icon = icons[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.type === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={
                form.type === "one_time" ? "e.g. Registration Fee" :
                form.type === "recurring" ? "e.g. Monthly Kickboxing Membership" :
                "e.g. Dojo Gear Bundle"
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Shown to the customer on the payment page"
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* One-Time: Amount */}
          {form.type === "one_time" && (
            <div className="space-y-1.5">
              <Label>Amount ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="149.00"
                />
              </div>
            </div>
          )}

          {/* Recurring: Amount + Interval */}
          {form.type === "recurring" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount ($) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="149.00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Billing Interval *</Label>
                  <Select value={form.billingInterval} onValueChange={(v) => setForm(f => ({ ...f, billingInterval: v as BillingInterval }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Number of Billing Cycles <span className="text-muted-foreground text-xs">(blank = unlimited)</span></Label>
                <Input
                  type="number"
                  min="1"
                  value={form.billingCycles}
                  onChange={(e) => setForm(f => ({ ...f, billingCycles: e.target.value }))}
                  placeholder="Leave blank for ongoing"
                />
              </div>
              {form.amount && (
                <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
                  Customer pays <strong>${parseFloat(form.amount || "0").toFixed(2)}</strong> today, then <strong>${parseFloat(form.amount || "0").toFixed(2)}/{form.billingInterval}</strong> automatically.
                </div>
              )}
            </div>
          )}

          {/* Merchandise: Items */}
          {form.type === "merchandise" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Items *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {form.merchandiseItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_60px_32px] gap-2 items-end">
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Item Name</Label>}
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(i, "name", e.target.value)}
                        placeholder="e.g. Gi Uniform"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Price ($)</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price || ""}
                        onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Qty</Label>}
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(i)}
                      disabled={form.merchandiseItems.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              {merchandiseTotal > 0 && (
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded text-sm font-medium text-amber-800">
                  <span>Total</span>
                  <span>${merchandiseTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="cursor-pointer">Requires Shipping Address</Label>
                  <p className="text-xs text-muted-foreground">Customer must provide a shipping address</p>
                </div>
                <Switch
                  checked={form.requiresShipping}
                  onCheckedChange={(v) => setForm(f => ({ ...f, requiresShipping: v }))}
                />
              </div>
            </div>
          )}

          {/* Optional Expiry */}
          <div className="space-y-1.5">
            <Label>Link Expiry Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              type="date"
              value={form.expiresAt}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Success Dialog ───────────────────────────────────────────────────────────

function SuccessDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const url = `${window.location.origin}/pay/${token}`;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Payment Link Created!
          </DialogTitle>
          <DialogDescription>
            Share this link with your customer to collect payment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Payment URL</p>
            <code className="text-sm break-all">{url}</code>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={copy}>
              {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            <Button variant="outline" asChild>
              <a href={`/pay/${token}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" /> Preview
              </a>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Send Link Dialog ────────────────────────────────────────────────────────

function SendLinkDialog({ link, onClose }: { link: { id: number; title: string; token: string }; onClose: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sentVia, setSentVia] = useState<{ sms: boolean; email: boolean }>({ sms: false, email: false });

  const sendMutation = trpc.customPayments.sendLink.useMutation({
    onSuccess: (data) => {
      setSent(true);
      setSentVia({ sms: data.smsSent, email: data.emailSent });
      if (data.smsSent && data.emailSent) toast.success("Link sent via SMS and email!");
      else if (data.smsSent) toast.success("Link sent via SMS!");
      else if (data.emailSent) toast.success("Link sent via email!");
      else toast.success("Link delivery queued.");
    },
    onError: (err) => toast.error(err.message || "Failed to send link"),
  });

  const handleSend = () => {
    if (!phone.trim() && !email.trim()) {
      toast.error("Enter a phone number or email address");
      return;
    }
    sendMutation.mutate({
      id: link.id,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customMessage: customMessage.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Payment Link
          </DialogTitle>
          <DialogDescription>
            Send <strong>{link.title}</strong> to a customer via SMS or email.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-lg">Link Sent!</p>
            <div className="flex gap-3 text-sm text-muted-foreground">
              {sentVia.sms && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> SMS delivered</span>}
              {sentVia.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email delivered</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 break-all">{window.location.origin}/pay/{link.token}</p>
            <Button variant="outline" className="mt-2" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Customer Name (optional)</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                type="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email Address</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                type="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Custom Message (optional)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. Hi! Here's your enrollment payment link for this month."
                rows={3}
              />
            </div>

            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Preview link:</p>
              <p className="break-all">{window.location.origin}/pay/{link.token}</p>
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || (!phone.trim() && !email.trim())}
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Link
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCustomPayments() {
  const [showCreate, setShowCreate] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [sendingLink, setSendingLink] = useState<{ id: number; title: string; token: string } | null>(null);
  const [filterType, setFilterType] = useState<"all" | PaymentType>("all");

  const { data: links, isLoading, refetch } = trpc.customPayments.list.useQuery();
  const utils = trpc.useUtils();

  const toggleMutation = trpc.customPayments.toggleActive.useMutation({
    onSuccess: () => utils.customPayments.list.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.customPayments.delete.useMutation({
    onSuccess: () => {
      toast.success("Payment link deleted");
      utils.customPayments.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const copyLink = useCallback((token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`);
    toast.success("Link copied to clipboard!");
  }, []);

  const filteredLinks = links?.filter(l => filterType === "all" || l.type === filterType) ?? [];

  const stats = {
    total: links?.length ?? 0,
    active: links?.filter(l => l.isActive).length ?? 0,
    totalUses: links?.reduce((sum, l) => sum + l.useCount, 0) ?? 0,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Custom Payment Links
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create shareable FluidPay payment links for one-time charges, recurring memberships, and merchandise.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Links</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active Links</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-2xl font-bold text-primary">{stats.totalUses}</div>
              <div className="text-sm text-muted-foreground">Total Payments</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="one_time">
              <DollarSign className="h-3.5 w-3.5 mr-1" /> One-Time
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="h-3.5 w-3.5 mr-1" /> Recurring
            </TabsTrigger>
            <TabsTrigger value="merchandise">
              <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Merchandise
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filterType} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLinks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Link2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No payment links yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click "Create Link" to get started</p>
                  <Button className="mt-4" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Your First Link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLinks.map((link) => {
                      const amountDisplay = link.type === "merchandise"
                        ? `$${(link.merchandiseItems as MerchandiseItem[] | null)?.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2) ?? "—"}`
                        : link.amount ? `$${parseFloat(link.amount as string).toFixed(2)}${link.billingInterval ? `/${link.billingInterval}` : ""}` : "—";

                      return (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{link.title}</div>
                            {link.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{link.description}</div>
                            )}
                          </TableCell>
                          <TableCell><TypeBadge type={link.type as PaymentType} /></TableCell>
                          <TableCell className="font-medium text-sm">{amountDisplay}</TableCell>
                          <TableCell><StatusBadge isActive={link.isActive} /></TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{link.useCount}</span>
                            {link.paymentCount > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">payments</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(link.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                title="Send to customer"
                                onClick={() => setSendingLink({ id: link.id, title: link.title, token: link.token })}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Copy link"
                                onClick={() => copyLink(link.token)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="View payments"
                                onClick={() => setViewingId(link.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 ${link.isActive ? "text-green-600 hover:text-yellow-600" : "text-gray-400 hover:text-green-600"}`}
                                title={link.isActive ? "Deactivate" : "Activate"}
                                onClick={() => toggleMutation.mutate({ id: link.id, isActive: !link.isActive })}
                                disabled={toggleMutation.isPending}
                              >
                                {link.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Delete link"
                                onClick={() => {
                                  if (confirm(`Delete "${link.title}"? This cannot be undone.`)) {
                                    deleteMutation.mutate({ id: link.id });
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {showCreate && (
        <CreateLinkDialog
          onClose={() => setShowCreate(false)}
          onCreated={(token) => {
            setShowCreate(false);
            setCreatedToken(token);
          }}
        />
      )}
      {createdToken && (
        <SuccessDialog token={createdToken} onClose={() => setCreatedToken(null)} />
      )}
      {viewingId !== null && (
        <LinkDetailDialog linkId={viewingId} onClose={() => setViewingId(null)} />
      )}
      {sendingLink !== null && (
        <SendLinkDialog link={sendingLink} onClose={() => setSendingLink(null)} />
      )}
    </AdminLayout>
  );
}
