import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, CheckCircle2, ClipboardCheck, Save, Trophy } from "lucide-react";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AdminBeltTesting() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.beltTesting.listSessions.useQuery(undefined, { refetchInterval: 15_000 });
  const create = trpc.beltTesting.createSession.useMutation({ onSuccess: () => utils.beltTesting.listSessions.invalidate(), onError: e => toast.error(e.message) });
  const saveScore = trpc.beltTesting.saveScore.useMutation({ onSuccess: () => utils.beltTesting.listSessions.invalidate(), onError: e => toast.error(e.message) });
  const updateSession = trpc.beltTesting.updateSession.useMutation({ onSuccess: () => utils.beltTesting.listSessions.invalidate(), onError: e => toast.error(e.message) });
  const publish = trpc.beltTesting.publishResult.useMutation({ onSuccess: () => { toast.success("Result published to the member portal."); utils.beltTesting.listSessions.invalidate(); }, onError: e => toast.error(e.message) });
  const upload = trpc.beltTesting.uploadHighlightPhoto.useMutation({ onSuccess: () => { toast.success("Highlight photo saved."); utils.beltTesting.listSessions.invalidate(); }, onError: e => toast.error(e.message) });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => data?.find(row => row.session?.id === selectedId) ?? data?.find(row => !row.session) ?? null, [data, selectedId]);

  async function addPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected?.session) return;
    const imageBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = reject; reader.readAsDataURL(file); });
    upload.mutate({ sessionId: selected.session.id, imageBase64, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" });
  }

  return <AdminLayout><div className="min-h-screen space-y-6 bg-slate-50 p-4 md:p-8"><div><div className="flex items-center gap-2 text-red-600 text-sm font-bold uppercase tracking-widest"><Trophy className="h-4 w-4" /> Instructor Control</div><h1 className="mt-1 text-3xl font-black text-slate-950">Digital Belt Testing</h1><p className="mt-1 text-slate-600">Grade each student, document board breaking and sparring, and publish verified results to the member portal.</p></div>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><Card><CardHeader><CardTitle>Testing roster</CardTitle></CardHeader><CardContent className="space-y-2">{isLoading ? <p>Loading roster…</p> : !data?.length ? <p className="text-slate-500">No Intent to Promote records yet.</p> : data.map(row => <button key={row.intent.id} onClick={() => { if (row.session) setSelectedId(row.session.id); else create.mutate({ intentId: row.intent.id }); }} className={`w-full rounded-xl border p-4 text-left transition ${selected?.intent.id === row.intent.id ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-red-300"}`}><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-950">{row.intent.studentName}</p><p className="text-xs text-slate-500">{row.intent.parentName} · {row.intent.currentBelt} → {row.intent.nextBelt || "staff review"}</p></div>{row.session ? <Badge className={row.session.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{row.session.status}</Badge> : <Badge variant="outline">Start test</Badge>}</div></button>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>{selected ? `${selected.intent.studentName} — scorecard` : "Select a student"}</CardTitle></CardHeader><CardContent>{!selected ? <p className="text-slate-500">Create a scorecard from the roster to begin.</p> : !selected.session ? <p className="text-slate-500">Creating scorecard…</p> : <div className="space-y-4">{selected.scores.map(score => <ScoreRow key={score.id} score={score} onSave={(points, notes) => saveScore.mutate({ scoreId: score.id, pointsEarned: points, notes })} />)}<div className="rounded-xl bg-slate-900 p-4 text-white"><div className="flex items-center justify-between"><span className="font-bold">Total</span><span className="text-xl font-black">{selected.session.earnedPoints}/{selected.session.totalPoints}</span></div><p className="mt-1 text-xs text-slate-300">Pass standard: 70% overall plus passing board breaking and sparring.</p></div><Textarea placeholder="Staff notes / result summary" defaultValue={selected.session.staffNotes || ""} onBlur={e => updateSession.mutate({ sessionId: selected.session!.id, staffNotes: e.target.value })} /><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-bold"><Camera className="h-4 w-4" /> Add highlight photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addPhoto} /></label>{selected.session.highlightPhotoUrl && <a href={selected.session.highlightPhotoUrl} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-2 text-sm font-bold">View photo</a>}{selected.session.status !== "published" && <Button onClick={() => publish.mutate({ sessionId: selected.session!.id })} disabled={publish.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Publish result</Button>}</div>{selected.session.status === "published" && <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><ClipboardCheck className="h-4 w-4" /> Published to the member portal</p>}</div>}</CardContent></Card></div></div></AdminLayout>;
}

function ScoreRow({ score, onSave }: { score: { id: number; criterionName: string; criterionKey: string; maxPoints: number; pointsEarned: number; passRequired: number; notes: string | null }; onSave: (points: number, notes?: string) => void }) {
  const [points, setPoints] = useState(String(score.pointsEarned));
  const [notes, setNotes] = useState(score.notes || "");
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-slate-950">{score.criterionName}</p><p className="text-xs text-slate-500">{score.passRequired ? "Required pass criterion" : "Scored criterion"} · max {score.maxPoints}</p></div><div className="flex items-center gap-2"><Input type="number" min={0} max={score.maxPoints} value={points} onChange={e => setPoints(e.target.value)} className="w-20" /><span className="text-sm text-slate-500">/{score.maxPoints}</span><Button size="sm" variant="outline" onClick={() => onSave(Math.max(0, Math.min(score.maxPoints, Number(points) || 0)), notes)}><Save className="h-4 w-4" /></Button></div></div><Input className="mt-2" placeholder="Performance note" value={notes} onChange={e => setNotes(e.target.value)} /></div>;
}
