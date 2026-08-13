import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lock, ShoppingBag } from "lucide-react";

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sizes?: string[];
  category: string;
}

interface Props {
  product: ShopProduct | null;
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultEmail?: string;
}

export function ShopCheckoutModal({ product, open, onClose, defaultName = "", defaultEmail = "" }: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const checkoutMutation = trpc.shop.createCheckout.useMutation();

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setEmail(defaultEmail);
    setPhone("");
    setSize("");
    setFormError(null);
  }, [open, defaultName, defaultEmail]);

  if (!product) return null;

  const startCheckout = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError("Please enter your full name.");
    if (!email.trim() || !email.includes("@")) return setFormError("Please enter a valid email address.");
    if (product.sizes?.length && !size) return setFormError("Please select a size.");

    try {
      const { checkoutUrl } = await checkoutMutation.mutateAsync({
        productId: product.id,
        size: size || undefined,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined,
        returnTo: window.location.pathname.startsWith("/dashboard") ? "/dashboard" : "/shop",
      });
      if (!checkoutUrl) throw new Error("Stripe checkout could not be created.");
      window.location.assign(checkoutUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to start secure checkout. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !checkoutMutation.isPending) onClose(); }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#E11D2A]" />
            Checkout with Stripe
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <img src={product.image} alt={product.name} className="h-16 w-16 rounded-lg object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">{product.category}</p>
            {size ? <p className="mt-1 text-xs font-semibold text-[#E11D2A]">Size: {size}</p> : null}
          </div>
          <p className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="shop-name">Full Name *</Label>
            <Input id="shop-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="shop-email">Email Address *</Label>
            <Input id="shop-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="shop-phone">Phone</Label>
            <Input id="shop-phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="(555) 555-5555" className="mt-1" />
          </div>
          {product.sizes?.length ? (
            <div>
              <Label>Size *</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a size" /></SelectTrigger>
                <SelectContent>{product.sizes.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}
          {formError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            You will complete your secure payment on Stripe. MyDojo never stores your card details.
          </div>
          <Button onClick={startCheckout} disabled={checkoutMutation.isPending} className="w-full bg-[#E11D2A] font-bold text-white hover:bg-[#C91826]">
            {checkoutMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening secure checkout…</> : <>Continue to Stripe — ${product.price.toFixed(2)}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
