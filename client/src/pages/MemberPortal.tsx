import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Home, Star, MapPin, ShoppingBag, User,
  ChevronRight, Calendar, Clock, Bell, Plus,
  CreditCard, History, Users, Shield, Zap, Award,
  Phone, Mail, LogOut, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "home" | "benefits" | "locate" | "shop" | "account";

// ─── BELT COLORS ────────────────────────────────────────────────────────────
const BELT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "White Belt":    { bg: "#f5f5f5", text: "#111", label: "White" },
  "Yellow Belt":   { bg: "#fde047", text: "#111", label: "Yellow" },
  "Orange Belt":   { bg: "#fb923c", text: "#fff", label: "Orange" },
  "Purple Belt":   { bg: "#a855f7", text: "#fff", label: "Purple" },
  "Blue Belt":     { bg: "#3b82f6", text: "#fff", label: "Blue" },
  "Green Belt":    { bg: "#22c55e", text: "#fff", label: "Green" },
  "Brown Belt":    { bg: "#92400e", text: "#fff", label: "Brown" },
  "Red Belt":      { bg: "#ef4444", text: "#fff", label: "Red" },
  "Black Belt":    { bg: "#111", text: "#fff", label: "Black" },
};

// ─── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({ enrollment }: { enrollment: any }) {
  const { data: events } = trpc.admin.getScreensaverEvents.useQuery();
  const belt = enrollment?.beltRank || "White Belt";
  const beltColor = BELT_COLORS[belt] || BELT_COLORS["White Belt"];
  const name = enrollment?.customerName || "Member";
  const firstName = name.split(" ")[0];

  const augustEvents = [
    { date: "Aug 9", day: "Saturday", title: "Belt Test", time: "10:00 AM – 12:00 PM", color: "#e11d48", icon: "🥋" },
    { date: "Aug 15", day: "Friday", title: "Spotlight Week Ends", time: "All Day", color: "#7c3aed", icon: "⭐" },
    { date: "Aug 21", day: "Friday", title: "Parents Night Out", time: "6:00 – 9:30 PM", color: "#0891b2", icon: "🎉" },
    { date: "Aug 22", day: "Saturday", title: "Master Yaeger Seminar", time: "11:00 AM – 2:00 PM", color: "#d97706", icon: "🏆" },
  ];

  return (
    <div className="pb-24">
      {/* Hero gradient header */}
      <div
        className="relative px-5 pt-10 pb-8"
        style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #e11d48 100%)" }}
      >
        {/* Bell icon */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-red-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-white text-3xl font-bold">{firstName}</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Belt rank card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 border border-white/20">
          <div
            className="w-14 h-5 rounded-full shadow-lg"
            style={{ backgroundColor: beltColor.bg, border: "2px solid rgba(255,255,255,0.3)" }}
          />
          <div>
            <p className="text-white/70 text-xs">Current Rank</p>
            <p className="text-white font-bold text-lg">{belt}</p>
          </div>
          <div className="ml-auto">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {enrollment?.packageName || "Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-4 gap-2">
          {[
            { icon: "📅", label: "Schedule", href: "/schedule" },
            { icon: "🥋", label: "Belt Test", href: "/belt-test-intent" },
            { icon: "🛒", label: "Shop", tab: "shop" as Tab },
            { icon: "👤", label: "Account", tab: "account" as Tab },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-gray-600 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* August Events */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">August Events</h2>
          <Link href="/august-2026">
            <span className="text-sm text-red-600 font-medium">See all →</span>
          </Link>
        </div>
        <div className="space-y-3">
          {augustEvents.map((event) => (
            <div
              key={event.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex"
            >
              <div
                className="w-2 shrink-0"
                style={{ backgroundColor: event.color }}
              />
              <div className="flex-1 p-4 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: event.color + "20" }}
                >
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.date} · {event.day}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />{event.time}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="px-5 mt-6">
        <Link href="/august-2026">
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 100%)" }}
          >
            <div className="absolute top-0 right-0 text-6xl opacity-20 -mt-2 -mr-2">📰</div>
            <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1">August 2026</p>
            <h3 className="text-white text-lg font-bold mb-1">Monthly Newsletter</h3>
            <p className="text-red-200 text-sm">Events, announcements & updates for this month</p>
            <div className="flex items-center gap-1 mt-3 text-white text-sm font-semibold">
              Read now <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── BENEFITS TAB ────────────────────────────────────────────────────────────
function BenefitsTab({ enrollment }: { enrollment: any }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Training", "Gear", "Events", "Community"];
  const packageName = enrollment?.packageName || "Foundation Monthly Membership";
  const isElite = packageName?.toLowerCase().includes("elite") || packageName?.toLowerCase().includes("199");

  const benefits = [
    { category: "Training", icon: "🥋", title: "Unlimited Classes", desc: "Attend as many classes as you want each week — no limits.", tag: "Included", color: "#e11d48" },
    { category: "Training", icon: "🎯", title: "Belt Testing Priority", desc: "Members get priority scheduling for belt tests.", tag: "Included", color: "#e11d48" },
    { category: "Gear", icon: "👕", title: "10% Off Pro Shop", desc: "Save 10% on uniforms, sparring gear, and weapons.", tag: "Member Perk", color: "#7c3aed" },
    { category: "Events", icon: "🎉", title: "Parents Night Out", desc: "Exclusive discounted access to Parents Night Out events.", tag: "Members Only", color: "#0891b2" },
    { category: "Community", icon: "👨‍👩‍👧", title: "Family Add-On", desc: "Add a family member at a discounted rate.", tag: "Available", color: "#059669" },
    { category: "Training", icon: "📱", title: "Digital Curriculum", desc: "Access training videos and curriculum materials online.", tag: "Included", color: "#e11d48" },
    ...(isElite ? [
      { category: "Training", icon: "🏆", title: "Private Lessons", desc: "1 complimentary private lesson per month.", tag: "Elite Only", color: "#d97706" },
      { category: "Events", icon: "⭐", title: "Seminar Access", desc: "Free access to all visiting master seminars.", tag: "Elite Only", color: "#d97706" },
      { category: "Gear", icon: "🎽", title: "20% Off Pro Shop", desc: "Elite members save 20% on all pro shop purchases.", tag: "Elite Only", color: "#d97706" },
    ] : []),
  ];

  const filtered = activeCategory === "All" ? benefits : benefits.filter(b => b.category === activeCategory);

  return (
    <div className="pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6"
        style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #e11d48 100%)" }}
      >
        <h1 className="text-white text-3xl font-bold mb-1">Benefits</h1>
        <p className="text-red-200 text-sm">{packageName}</p>
      </div>

      {/* Category pills */}
      <div className="px-5 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Benefits cards */}
      <div className="px-5 space-y-3">
        {filtered.map((benefit, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1" style={{ backgroundColor: benefit.color }} />
            <div className="p-4 flex gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: benefit.color + "15" }}
              >
                {benefit.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900">{benefit.title}</p>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: benefit.color + "20", color: benefit.color }}
                  >
                    {benefit.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{benefit.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA for non-elite */}
      {!isElite && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: "linear-gradient(135deg, #d97706 0%, #92400e 100%)" }}
          >
            <p className="text-yellow-200 text-xs font-semibold uppercase tracking-wider mb-1">Upgrade Available</p>
            <h3 className="text-white text-lg font-bold mb-1">Elite Membership</h3>
            <p className="text-yellow-100 text-sm mb-3">Get private lessons, seminar access & 20% off the pro shop.</p>
            <button className="bg-white text-yellow-700 font-bold text-sm px-4 py-2 rounded-full">
              Learn More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOCATE TAB ──────────────────────────────────────────────────────────────
function LocateTab() {
  const locations = [
    {
      name: "MyDojo Tomball HQ",
      address: "28150 Tomball Pkwy, Tomball, TX 77375",
      phone: "(877) 4-MYDOJO",
      hours: "Mon–Fri 4–8PM · Sat 9AM–1PM",
      status: "open",
      distance: "Main Location",
      mapsUrl: "https://maps.google.com/?q=28150+Tomball+Pkwy+Tomball+TX+77375",
    },
  ];

  const upcomingEventLocations = [
    { name: "Belt Test", date: "Aug 9", address: "MyDojo Tomball HQ", icon: "🥋" },
    { name: "Parents Night Out", date: "Aug 21", address: "MyDojo Tomball HQ", icon: "🎉" },
    { name: "Master Yaeger Seminar", date: "Aug 22", address: "MyDojo Tomball HQ", icon: "🏆" },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6"
        style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #e11d48 100%)" }}
      >
        <h1 className="text-white text-3xl font-bold mb-1">Locate</h1>
        <p className="text-red-200 text-sm">Find us & event locations</p>
      </div>

      {/* Map placeholder */}
      <div className="mx-5 -mt-4 rounded-2xl overflow-hidden shadow-lg bg-gray-100 h-48 flex items-center justify-center relative">
        <a
          href="https://maps.google.com/?q=28150+Tomball+Pkwy+Tomball+TX+77375"
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 gap-2"
        >
          <MapPin className="h-10 w-10 text-red-500" />
          <p className="text-gray-700 font-semibold text-sm">Tap to open in Maps</p>
          <p className="text-gray-500 text-xs">28150 Tomball Pkwy, Tomball TX</p>
        </a>
      </div>

      {/* Dojo locations */}
      <div className="px-5 mt-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Our Location</h2>
        {locations.map((loc) => (
          <div key={loc.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900">{loc.name}</p>
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Open</span>
                </div>
                <p className="text-sm text-gray-500">{loc.address}</p>
                <p className="text-xs text-gray-400 mt-1">{loc.hours}</p>
                <div className="flex gap-2 mt-3">
                  <a href={`tel:${loc.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </a>
                  <a href={loc.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                    <ExternalLink className="h-3.5 w-3.5" /> Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming event locations */}
      <div className="px-5 mt-2">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Events</h2>
        <div className="space-y-2">
          {upcomingEventLocations.map((ev) => (
            <div key={ev.name} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <span className="text-xl">{ev.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{ev.name}</p>
                <p className="text-xs text-gray-500">{ev.date} · {ev.address}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SHOP TAB ────────────────────────────────────────────────────────────────
function ShopTab() {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Uniforms", "Sparring Gear", "Weapons", "Accessories"];

  const products = [
    { category: "Uniforms", name: "Student Gi (White)", price: 49.99, emoji: "👘", badge: "Best Seller", desc: "Traditional white karate uniform, sizes XS–XXL" },
    { category: "Uniforms", name: "Black Gi (Advanced)", price: 64.99, emoji: "🥋", badge: null, desc: "Premium black uniform for advanced students" },
    { category: "Uniforms", name: "MyDojo Rash Guard", price: 34.99, emoji: "👕", badge: "New", desc: "Moisture-wicking compression shirt with MyDojo logo" },
    { category: "Sparring Gear", name: "Sparring Gloves", price: 29.99, emoji: "🥊", badge: null, desc: "Open-palm foam gloves for safe sparring" },
    { category: "Sparring Gear", name: "Sparring Helmet", price: 44.99, emoji: "⛑️", badge: null, desc: "Full head protection with face guard" },
    { category: "Sparring Gear", name: "Sparring Pads Set", price: 79.99, emoji: "🛡️", badge: "Bundle", desc: "Chest, shin, and foot pads — complete set" },
    { category: "Weapons", name: "Bo Staff (Wood)", price: 39.99, emoji: "🪄", badge: null, desc: "6-foot hardwood staff for kata training" },
    { category: "Weapons", name: "Nunchaku (Foam)", price: 19.99, emoji: "⚔️", badge: "Beginner", desc: "Foam training nunchaku — safe for practice" },
    { category: "Weapons", name: "Bokken (Wood Sword)", price: 24.99, emoji: "🗡️", badge: null, desc: "Traditional wooden training sword" },
    { category: "Accessories", name: "Belt (Replacement)", price: 9.99, emoji: "🎗️", badge: null, desc: "Cotton belt — all colors available" },
    { category: "Accessories", name: "MyDojo Water Bottle", price: 19.99, emoji: "💧", badge: "New", desc: "32oz insulated stainless steel bottle" },
    { category: "Accessories", name: "Gym Bag", price: 34.99, emoji: "🎒", badge: null, desc: "Large duffel with MyDojo logo — fits all gear" },
  ];

  const filtered = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-6"
        style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #e11d48 100%)" }}
      >
        <h1 className="text-white text-3xl font-bold mb-1">Pro Shop</h1>
        <p className="text-red-200 text-sm">Members save 10% on all purchases</p>
      </div>

      {/* Category pills */}
      <div className="px-5 py-4 flex gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {filtered.map((product) => (
          <div key={product.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 h-28 flex items-center justify-center text-5xl relative">
              {product.emoji}
              {product.badge && (
                <span className="absolute top-2 right-2 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-gray-900 text-sm leading-tight">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.desc}</p>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-green-600 ml-1 line-through text-gray-400">${(product.price / 0.9).toFixed(2)}</span>
                </div>
                <button className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact to order */}
      <div className="px-5 mt-6">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
          <Phone className="h-8 w-8 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 text-sm">Order by phone or in person</p>
            <p className="text-xs text-gray-500">Call (877) 4-MYDOJO or visit us at the dojo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT TAB ─────────────────────────────────────────────────────────────
function AccountTab({ enrollment }: { enrollment: any }) {
  const { logout, user } = useAuth();

  const monthlyAmount = enrollment?.packageMonthlyPrice
    ? `$${Number(enrollment.packageMonthlyPrice).toFixed(2)}`
    : "—";

  // Compute next billing date based on 1st/15th rule
  const today = new Date();
  const day = today.getDate();
  let nextBill: string;
  if (day <= 15) {
    nextBill = new Date(today.getFullYear(), today.getMonth(), 15).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } else {
    nextBill = new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-8"
        style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #7f1d1d 50%, #e11d48 100%)" }}
      >
        <h1 className="text-white text-3xl font-bold mb-1">Account</h1>
        <p className="text-red-200 text-sm">{user?.email}</p>
      </div>

      {/* Plan card */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">You're on:</p>
          <h2 className="text-2xl font-bold text-gray-900">{enrollment?.packageName || "Active Membership"}</h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Monthly Amount</p>
              <p className="text-xl font-bold text-gray-900">{monthlyAmount}</p>
              <p className="text-xs text-green-600 font-medium">AutoPay Active</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Next Due Date</p>
              <p className="text-sm font-bold text-gray-900">{nextBill}</p>
              <p className="text-xs text-gray-400">Billed 1st & 15th</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 border-2 border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl">
              View History
            </button>
            <button className="flex-1 bg-red-600 text-white font-bold text-sm py-2.5 rounded-xl">
              Update Card
            </button>
          </div>
        </div>
      </div>

      {/* Account management sections */}
      <div className="px-5 mt-5 space-y-3">
        {/* Billing options */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-900">Billing options</p>
          </div>
          {[
            { icon: <CreditCard className="h-5 w-5 text-gray-500" />, label: "Manage payment methods" },
            { icon: <History className="h-5 w-5 text-gray-500" />, label: "Payment history" },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              {item.icon}
              <span className="flex-1 text-left text-sm text-gray-700">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* Account management */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-900">Account management</p>
          </div>
          {[
            { icon: <Users className="h-5 w-5 text-gray-500" />, label: "Add a family member" },
            { icon: <Award className="h-5 w-5 text-gray-500" />, label: "Belt test registration", href: "/belt-test-intent" },
            { icon: <Shield className="h-5 w-5 text-gray-500" />, label: "Membership status" },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              {item.icon}
              <span className="flex-1 text-left text-sm text-gray-700">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="flex-1 text-left text-sm text-red-600 font-medium">Sign out</span>
          <ChevronRight className="h-4 w-4 text-red-300" />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PORTAL ─────────────────────────────────────────────────────────────
export default function MemberPortal() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { isAuthenticated, loading, user } = useAuth();
  const { data: enrollment, isLoading: enrollmentLoading } = trpc.member.getMyEnrollment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || enrollmentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center">
            <span className="text-white text-2xl font-black">MD</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-red-500" />
          <p className="text-gray-500 text-sm">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="w-20 h-20 rounded-3xl bg-red-600 flex items-center justify-center mb-6">
          <span className="text-white text-3xl font-black">MD</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MyDojo Member Portal</h1>
        <p className="text-gray-500 text-center mb-8">Sign in to access your membership, events, and more.</p>
        <a
          href="/api/oauth/login"
          className="w-full max-w-xs bg-red-600 text-white font-bold text-center py-4 rounded-2xl text-lg"
        >
          Sign In
        </a>
        <Link href="/">
          <p className="text-gray-400 text-sm mt-4">← Back to website</p>
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home",     label: "Home",     icon: <Home className="h-5 w-5" /> },
    { id: "benefits", label: "Benefits", icon: <Star className="h-5 w-5" /> },
    { id: "locate",   label: "Locate",   icon: <MapPin className="h-5 w-5" /> },
    { id: "shop",     label: "Shop",     icon: <ShoppingBag className="h-5 w-5" /> },
    { id: "account",  label: "Account",  icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Page content */}
      <div className="overflow-y-auto">
        {activeTab === "home"     && <HomeTab enrollment={enrollment} />}
        {activeTab === "benefits" && <BenefitsTab enrollment={enrollment} />}
        {activeTab === "locate"   && <LocateTab />}
        {activeTab === "shop"     && <ShopTab />}
        {activeTab === "account"  && <AccountTab enrollment={enrollment} />}
      </div>

      {/* Bottom tab bar — fixed */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isActive ? "bg-red-600 shadow-lg shadow-red-200" : ""
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-gray-400"}>
                    {tab.icon}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
