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
  colors?: string[];
  colorImages?: Record<string, string>;
  category: string;
}

interface Props {
  product: ShopProduct | null;
  open: boolean;
  onClose: () => void;
  defaultName?: string;
  defaultStudentName?: string;
  defaultEmail?: string;
  defaultColor?: string;
}

export function ShopCheckoutModal({ product, open, onClose, defaultName = "", defaultStudentName = "", defaultEmail = "", defaultColor = "" }: Props) {
  const [name, setName] = useState(defaultName);
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const paypalCheckoutMutation = trpc.shop.createPayPalGearCheckout.useMutation();

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setStudentName(defaultStudentName);
    setEmail(defaultEmail);
    setPhone("");
    setSize("");
    setColor(product?.colors?.includes(defaultColor) ? defaultColor : "");
    setFormError(null);
  }, [open, defaultName, defaultStudentName, defaultEmail, defaultColor, product]);

  if (!product) return null;

  const startPayPalCheckout = async () => {
    setFormError(null);
    if (!name.trim()) return setFormError("Please enter the parent or purchaser name.");
    if (!studentName.trim()) return setFormError("Please enter the student name.");
    if (!email.trim() || !email.includes("@")) return setFormError("Please enter a valid email address.");
    if (!size || !color) return setFormError("Please select a size and color.");
    try {
      const { checkoutUrl } = await paypalCheckoutMutation.mutateAsync({
        customerName: name.trim(), studentName: studentName.trim(), customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined, size: size as any, color: color as any,
        returnTo: window.location.pathname.startsWith("/dashboard") ? "/dashboard" : "/shop",
      });
      if (!checkoutUrl) throw new Error("PayPal checkout could not be created.");
      window.location.assign(checkoutUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to start PayPal checkout. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !paypalCheckoutMutation.isPending) onClose(); }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#E11D2A]" />
            Secure Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <img src={product.colorImages?.[color] ?? product.image} alt={product.name} className="h-16 w-16 rounded-lg object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
            <p className="text-xs text-slate-500">{product.category}</p>
            {size ? <p className="mt-1 text-xs font-semibold text-[#E11D2A]">Size: {size}</p> : null}
            {color ? <p className="mt-1 text-xs font-semibold text-[#E11D2A]">Color: {color}</p> : null}
          </div>
          <p className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="shop-name">Full Name *</Label>
            <Input id="shop-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="shop-student-name">Student Name *</Label>
            <Input id="shop-student-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Student receiving the gear" className="mt-1" />
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
          {product.colors?.length ? (
            <div>
              <Label>Color *</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a color" /></SelectTrigger>
                <SelectContent>{product.colors.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}
          {formError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            You will complete your secure payment here. MyDojo never stores your card details.
          </div>
          <Button onClick={startPayPalCheckout} disabled={paypalCheckoutMutation.isPending} className="w-full bg-[#0070BA] font-bold text-white hover:bg-[#005EA6]">
            {paypalCheckoutMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening PayPal…</> : <>Continue with PayPal — ${product.price.toFixed(2)}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
