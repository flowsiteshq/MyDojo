import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle, Loader2, Eye, Calendar, Users } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminNewsletter() {
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [testOnly, setTestOnly] = useState(false);
  const [result, setResult] = useState<{
    emailSuccess: number; emailFail: number;
    smsSuccess: number; smsFail: number;
    errors: string[];
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const sendMutation = trpc.admin.sendNewsletter.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setConfirmed(false);
    },
  });

  function handleSend() {
    if (!confirmed && !testOnly) {
      setConfirmed(true);
      return;
    }
    sendMutation.mutate({ month: 'august_2026', sendEmail, sendSms, testOnly });
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase text-white mb-2">Parent Newsletter</h1>
          <p className="text-gray-400">Send the August 2026 newsletter to all parents via email and/or SMS.</p>
        </div>

        {/* Preview Card */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-red-600/20 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">August 2026 Newsletter</h2>
              <p className="text-gray-400 text-sm">Subject: 🥋 MyDojo August 2026 — Belt Test, Parents Night Out & More!</p>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 mb-4 text-sm text-gray-300 space-y-2">
            <p className="font-semibold text-white">This newsletter covers:</p>
            <ul className="space-y-1 text-gray-400 list-disc list-inside">
              <li>🥋 <strong className="text-white">Belt Test – Aug 15</strong> — Intent to Promote form + $49 fee due Aug 10</li>
              <li>📚 <strong className="text-white">Spotlight Week – Aug 10–14</strong> — Testing Preparation classes</li>
              <li>🌟 <strong className="text-white">Parents Night Out – Aug 21</strong> — Ninja Warrior Glow Night, 6–9:30 PM</li>
              <li>🏆 <strong className="text-white">Master Yaeger Seminar – Aug 22</strong> — 11 AM–2 PM, $29</li>
              <li>🥢 <strong className="text-white">Bo Staff Training</strong> — Starts this month</li>
            </ul>
          </div>

          <a
            href="/august-2026"
            target="_blank"
            className="inline-flex items-center gap-2 text-red-400 text-sm hover:text-red-300 transition-colors"
          >
            <Eye className="h-4 w-4" /> Preview full newsletter page
          </a>
        </div>

        {/* Send Options */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Send Options</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(!!v)}
              />
              <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-white font-medium">Send Email Newsletter</span>
                <span className="text-gray-400 text-sm">— Full HTML email with event details and links</span>
              </Label>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
              <Checkbox
                id="sendSms"
                checked={sendSms}
                onCheckedChange={(v) => setSendSms(!!v)}
              />
              <Label htmlFor="sendSms" className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4 text-green-400" />
                <span className="text-white font-medium">Send SMS Blast</span>
                <span className="text-gray-400 text-sm">— Short text with event links (respects STOP opt-outs)</span>
              </Label>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-950/40 border border-amber-800/50 rounded-lg">
              <Checkbox
                id="testOnly"
                checked={testOnly}
                onCheckedChange={(v) => { setTestOnly(!!v); setConfirmed(false); }}
              />
              <Label htmlFor="testOnly" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300 font-medium">Test Mode</span>
                <span className="text-amber-500 text-sm">— Send only to info@mydojoma.com (no blast to all parents)</span>
              </Label>
            </div>
          </div>
        </div>

        {/* Confirmation warning */}
        {confirmed && !testOnly && (
          <div className="bg-red-950/40 border border-red-700 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-bold">Are you sure?</p>
                <p className="text-red-400 text-sm mt-1">
                  This will send the newsletter to <strong>all parents in the database</strong>
                  {sendEmail && " via email"}
                  {sendEmail && sendSms && " and"}
                  {sendSms && " via SMS"}.
                  Click Send again to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-zinc-900 border border-green-700 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <h3 className="text-green-400 font-bold">Newsletter Sent!</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-white">{result.emailSuccess}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Emails Sent</p>
                {result.emailFail > 0 && <p className="text-xs text-red-400">{result.emailFail} failed</p>}
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-white">{result.smsSuccess}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">SMS Sent</p>
                {result.smsFail > 0 && <p className="text-xs text-red-400">{result.smsFail} failed</p>}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-red-400 font-bold mb-1">Errors (first 5):</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-gray-500">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sendMutation.isPending || (!sendEmail && !sendSms)}
          className={`w-full py-6 text-lg font-black uppercase tracking-wider ${
            confirmed && !testOnly
              ? "bg-red-700 hover:bg-red-600"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {sendMutation.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Sending...</>
          ) : confirmed && !testOnly ? (
            <><AlertCircle className="h-5 w-5 mr-2" /> Confirm — Send to All Parents</>
          ) : (
            <><Send className="h-5 w-5 mr-2" /> {testOnly ? "Send Test Newsletter" : "Send Newsletter"}</>
          )}
        </Button>
        {!sendEmail && !sendSms && (
          <p className="text-center text-gray-500 text-sm mt-2">Select at least one send option above.</p>
        )}
      </div>
    </AdminLayout>
  );
}
