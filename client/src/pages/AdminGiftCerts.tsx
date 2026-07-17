import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";
import { Gift, Download, Send, RefreshCw, CheckCircle, Clock, Loader2, Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";

const REDEMPTION_BASE_URL = "https://mydojoma.com/redeem";

async function downloadQR(code: string) {
  const url = `${REDEMPTION_BASE_URL}?code=${code}`;
  const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `QR-${code}.png`;
  a.click();
}

async function downloadAllQRs(codes: string[]) {
  for (const code of codes) {
    await downloadQR(code);
    await new Promise(r => setTimeout(r, 200));
  }
}

export default function AdminGiftCerts() {
  const [count, setCount] = useState(10);
  const [campaign, setCampaign] = useState("Chick-fil-A Promotion");
  const [expiresAt, setExpiresAt] = useState("");
  const [filterRedeemed, setFilterRedeemed] = useState<"all" | "redeemed" | "unredeemed">("all");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [sendingSmsId, setSendingSmsId] = useState<number | null>(null);

  const generateMutation = trpc.giftCert.generateCodes.useMutation({
    onSuccess: (data) => {
      setGeneratedCodes(data.codes);
      toast.success(`✅ ${data.count} codes generated! Download QR codes below.`);
      listQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const listQuery = trpc.giftCert.listCodes.useQuery(
    filterRedeemed === "all" ? {} : { redeemed: filterRedeemed === "redeemed" }
  );

  const sendSmsMutation = trpc.giftCert.sendFollowUpSms.useMutation({
    onSuccess: () => {
      toast.success("Follow-up text sent to recipient!");
      setSendingSmsId(null);
      listQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setSendingSmsId(null);
    },
  });

  const certs = listQuery.data ?? [];
  const totalCount = certs.length;
  const redeemedCount = certs.filter((c: { redeemed: number | boolean }) => c.redeemed).length;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const exportCsv = () => {
    const rows = [
      ["Code", "Campaign", "Redeemed", "Recipient Name", "Phone", "Email", "Lessons For", "Child Name", "Mail Requested", "SMS Sent", "Created At"],
      ...certs.map((c: {
        code: string; campaign: string; redeemed: number | boolean;
        recipientName?: string | null; recipientPhone?: string | null; recipientEmail?: string | null;
        lessonsFor?: string | null; childName?: string | null;
        mailRequested: number | boolean; smsSent: number | boolean; createdAt: Date | string | number;
      }) => [
        c.code, c.campaign, c.redeemed ? "Yes" : "No",
        c.recipientName ?? "", c.recipientPhone ?? "", c.recipientEmail ?? "",
        c.lessonsFor ?? "", c.childName ?? "",
        c.mailRequested ? "Yes" : "No", c.smsSent ? "Yes" : "No",
        new Date(c.createdAt).toLocaleDateString(),
      ])
    ];
    const csv = rows.map(r => r.map((v: string | boolean | number | Date) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gift-certs-${campaign.replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase flex items-center gap-2">
              <Gift className="w-6 h-6 text-red-500" /> Gift Certificates
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Chick-fil-A × MyDojo 2-Week Free Trial Campaign</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportCsv} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => listQuery.refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-black">{totalCount}</div>
            <div className="text-zinc-500 text-sm">Total Codes</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-600">{redeemedCount}</div>
            <div className="text-zinc-500 text-sm">Redeemed</div>
          </div>
          <div className="bg-zinc-50 border rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-zinc-700">{totalCount - redeemedCount}</div>
            <div className="text-zinc-500 text-sm">Available</div>
          </div>
        </div>

        {/* Generate Codes */}
        <div className="bg-black text-white rounded-2xl p-6">
          <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-red-400" /> Generate New Codes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-widest mb-1 block">Number of Codes</label>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={1} max={500}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-widest mb-1 block">Campaign Name</label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs uppercase tracking-widest mb-1 block">Expires (optional)</label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => generateMutation.mutate({ count, campaign, expiresAt: expiresAt || undefined })}
              disabled={generateMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {generateMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Generate {count} Codes
            </Button>
            {generatedCodes.length > 0 && (
              <Button
                variant="outline"
                onClick={() => downloadAllQRs(generatedCodes)}
                className="gap-2 border-zinc-600 text-white hover:bg-zinc-800"
              >
                <Download className="w-4 h-4" /> Download {generatedCodes.length} QR Codes
              </Button>
            )}
          </div>

          {/* Generated codes preview */}
          {generatedCodes.length > 0 && (
            <div className="mt-4 bg-zinc-900 rounded-xl p-4 max-h-40 overflow-y-auto">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Generated Codes</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {generatedCodes.map(code => (
                  <button
                    key={code}
                    onClick={() => copyCode(code)}
                    className="font-mono text-xs text-green-400 bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certificates Table */}
        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-black uppercase text-sm">All Certificates</h2>
            <div className="flex gap-2">
              {(["all", "unredeemed", "redeemed"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterRedeemed(f)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                    filterRedeemed === f ? "bg-black text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-zinc-400" />
            </div>
          ) : certs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No certificates yet. Generate some above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Recipient</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">For</th>
                    <th className="px-4 py-3 text-left">Mail</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {certs.map((cert: {
                    id: number; code: string; redeemed: number | boolean; smsSent: number | boolean;
                    recipientName?: string | null; recipientPhone?: string | null;
                    lessonsFor?: string | null; childName?: string | null; childAge?: string | null;
                    mailRequested: number | boolean;
                  }) => (
                    <tr key={cert.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs">{cert.code}</span>
                          <button onClick={() => copyCode(cert.code)} className="text-zinc-400 hover:text-black">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => downloadQR(cert.code)} className="text-zinc-400 hover:text-black" title="Download QR">
                            <QrCode className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cert.redeemed ? (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" /> Redeemed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <Clock className="w-3 h-3" /> Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{cert.recipientName ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{cert.recipientPhone ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs capitalize">
                        {cert.lessonsFor ?? "—"}
                        {cert.childName && <div className="text-zinc-400">{cert.childName} (age {cert.childAge})</div>}
                      </td>
                      <td className="px-4 py-3">
                        {cert.mailRequested ? (
                          <span className="text-blue-600 text-xs font-semibold">📬 Requested</span>
                        ) : (
                          <span className="text-zinc-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cert.redeemed && cert.recipientPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingSmsId === cert.id || !!cert.smsSent}
                            onClick={() => {
                              setSendingSmsId(cert.id);
                              sendSmsMutation.mutate({ certId: cert.id });
                            }}
                            className="gap-1 text-xs h-7"
                          >
                            {sendingSmsId === cert.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            {cert.smsSent ? "SMS Sent ✓" : "Follow-up SMS"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
