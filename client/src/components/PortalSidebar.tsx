import {
  Award,
  CalendarDays,
  CreditCard,
  Home,
  MessageCircle,
  ShoppingBag,
  Trophy,
  Users,
} from "lucide-react";

type PortalTab = "home" | "children" | "benefits" | "training" | "locate" | "shop" | "account" | "messages";

type Props = {
  activeTab: PortalTab;
  onNavigate: (tab: PortalTab) => void;
};

const items: Array<{ label: string; icon: typeof Home; tab: PortalTab }> = [
  { label: "Home", icon: Home, tab: "home" },
  { label: "My Students", icon: Users, tab: "children" },
  { label: "Classes", icon: CalendarDays, tab: "training" },
  { label: "Belt Progress", icon: Award, tab: "training" },
  { label: "Billing & Payments", icon: CreditCard, tab: "account" },
  { label: "Equipment Store", icon: ShoppingBag, tab: "shop" },
  { label: "Events", icon: Trophy, tab: "benefits" },
  { label: "Messages", icon: MessageCircle, tab: "messages" },
];

export function PortalSidebar({ activeTab, onNavigate }: Props) {
  return (
    <aside className="fixed inset-y-16 left-0 z-40 hidden w-[238px] flex-col bg-[#090a0c] px-4 py-6 text-white lg:flex">
      <div className="flex items-center gap-3 px-3 pb-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#e10600] text-xl font-black">M</div>
        <span className="text-xl font-black tracking-[0.16em]">MYDOJO</span>
      </div>
      <nav className="space-y-1" aria-label="Member portal navigation">
        {items.map(({ label, icon: Icon, tab }) => {
          const selected = activeTab === tab || (tab === "training" && activeTab === "training");
          return (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(tab)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                selected ? "bg-[#e10600] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">MyDojo promise</p>
        <p className="mt-3 text-sm font-bold leading-6 text-white/85">Discipline.<br />Confidence.<br />A brighter future.</p>
        <div className="mt-4 h-1 w-12 bg-[#e10600]" />
      </div>
    </aside>
  );
}
