import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last_7d" },
  { label: "Last 30 days", value: "last_30d" },
  { label: "Last 90 days", value: "last_90d" },
  { label: "This month", value: "this_month" },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <Icon className={`h-5 w-5 ${color} opacity-70`} />
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    );
  }
  if (status === "PAUSED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
        <Pause className="h-3 w-3" /> Paused
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-400/10 px-2 py-0.5 rounded-full">
      <AlertCircle className="h-3 w-3" /> {status}
    </span>
  );
}

export default function AdminFacebookAds() {
  const [datePreset, setDatePreset] = useState("last_30d");

  const { data, isLoading, refetch, isFetching } =
    trpc.facebookAds.getCampaigns.useQuery({ datePreset });

  const totalSpend =
    data?.campaigns?.reduce((s: number, c: any) => s + parseFloat(c.spend || "0"), 0) ?? 0;
  const totalLeads =
    data?.campaigns?.reduce((s: number, c: any) => s + (c.leads || 0), 0) ?? 0;
  const totalImpressions =
    data?.campaigns?.reduce((s: number, c: any) => s + parseInt(c.impressions || "0"), 0) ?? 0;
  const totalLinkClicks =
    data?.campaigns?.reduce((s: number, c: any) => s + parseInt(c.linkClicks || "0"), 0) ?? 0;
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Facebook Ads</h1>
            <p className="text-gray-500 text-xs">MYDOJO MARTIAL ARTS AND FITNESS · act_1144489619967778</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetch(); toast.info("Refreshing ad data..."); }}
            disabled={isFetching}
            className="border-zinc-700 text-gray-300 hover:text-white bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <a
            href="https://www.facebook.com/adsmanager"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Ads Manager
            </Button>
          </a>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Date Preset Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDatePreset(p.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                datePreset === p.value
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Amount spent"
            value={`$${totalSpend.toFixed(2)}`}
            sub="USD"
            icon={DollarSign}
            color="text-green-400"
          />
          <StatCard
            label="Leads"
            value={totalLeads.toString()}
            sub="Form completions"
            icon={Users}
            color="text-blue-400"
          />
          <StatCard
            label="Cost per lead"
            value={avgCPL > 0 ? `$${avgCPL.toFixed(2)}` : "N/A"}
            sub="Avg across campaigns"
            icon={TrendingUp}
            color="text-yellow-400"
          />
          <StatCard
            label="Impressions"
            value={totalImpressions.toLocaleString()}
            sub="Times on screen"
            icon={Eye}
            color="text-purple-400"
          />
          <StatCard
            label="Link clicks"
            value={totalLinkClicks.toLocaleString()}
            sub="Inline link clicks in ad"
            icon={MousePointerClick}
            color="text-orange-400"
          />
        </div>

        {/* Campaigns Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-white">Campaigns</h2>
            <span className="text-gray-500 text-sm">
              {data?.campaigns?.length ?? 0} campaigns · data may be partial for today
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mr-3" />
              Loading campaign data...
            </div>
          ) : !data?.campaigns?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
              <p>No campaign data found for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Campaign</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-right px-6 py-3">Amount spent</th>
                    <th className="text-right px-6 py-3">Leads</th>
                    <th className="text-right px-6 py-3">Cost per lead</th>
                    <th className="text-right px-6 py-3">Impressions</th>
                    <th className="text-right px-6 py-3">Link clicks</th>
                    <th className="text-right px-6 py-3">CTR (all)</th>
                    <th className="text-right px-6 py-3">CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.map((c: any) => {
                    const cpl =
                      c.leads > 0
                        ? `$${(parseFloat(c.spend) / c.leads).toFixed(2)}`
                        : "N/A";
                    return (
                      <tr
                        key={c.campaignId}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white max-w-xs truncate">
                            {c.campaignName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-semibold">
                          ${parseFloat(c.spend || "0").toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-400 font-semibold">
                          {c.leads ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right text-yellow-400 font-semibold">
                          {cpl}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {parseInt(c.impressions || "0").toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {parseInt(c.linkClicks || "0").toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {c.ctr ? `${parseFloat(c.ctr).toFixed(2)}%` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-300">
                          {c.cpm ? `$${parseFloat(c.cpm).toFixed(2)}` : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-gray-600 text-xs mt-4 text-center">
          Data sourced from Meta Ads API · Metrics use Meta's official standardized names · Amount spent in USD
        </p>
      </div>
    </div>
  );
}
