import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Clock, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { trpc } from "@/lib/trpc";

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure";
  message: string;
};

const EMPTY_FORM: ContactForm = { firstName: "", lastName: "", email: "", phone: "", program: "Not Sure", message: "" };

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [smsSent, setSmsSent] = useState<boolean | null>(null);

  const submitLead = trpc.trialSignups.create.useMutation({
    onSuccess: (result) => {
      setSmsSent(result.confirmationSms.sent);
      setSubmitted(true);
    },
  });

  const update = (field: keyof ContactForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitLead.mutate({
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      program: form.program,
      location: "Tomball HQ",
      preferredContactMethod: "text",
      message: form.message.trim() || "Contact form submission from MyDojo website.",
      source: "website",
    });
  };

  return (
    <div className="public-page min-h-screen">
      <SEO title="Contact MyDojo Martial Arts & Fitness" description="Contact MyDojo in Tomball, Texas. Send a message, request a complimentary introductory class, or find directions to the dojo." />
      <SchemaMarkup type="LocalBusiness" />
      <SchemaMarkup type="BreadcrumbList" items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />

      <section className="relative overflow-hidden border-b border-black/10 bg-black py-16 text-white md:py-24"><div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-25" /><div className="absolute inset-0 bg-black/65" /><div className="container relative z-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#e63946]">Talk with MyDojo</p><h1 className="mt-5 font-heading text-[clamp(3.5rem,7vw,7rem)] font-bold uppercase leading-[0.86] tracking-[-0.04em]">Let’s start<br />the conversation.</h1></div><p className="max-w-2xl text-base leading-7 text-gray-300 md:text-lg">Have a question, want help choosing a program, or ready to visit? Send a note and our team will follow up. Your message is saved directly in our lead system.</p></div></section>

      <section className="bg-[var(--mydojo-paper)] py-16 md:py-24"><div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="public-eyebrow">Visit Tomball HQ</p><h2 className="public-title mt-5">Here when you’re ready.</h2>
          <div className="mt-8 h-72 overflow-hidden border border-[var(--mydojo-line)] bg-white"><MapView className="h-full w-full" onMapReady={(map) => { const tomball = { lat: 30.0112706, lng: -95.6025971 }; map.setCenter(tomball); map.setZoom(15); new google.maps.Marker({ position: tomball, map, title: "MyDojo Headquarters" }); }} /></div>
          <div className="mt-8 grid border-l border-t border-[var(--mydojo-line)] sm:grid-cols-2">
            <div className="border-b border-r border-[var(--mydojo-line)] p-5"><Phone className="h-5 w-5 text-[#e63946]" /><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-black">Call</p><a href="tel:+18774693656" className="mt-1 block text-sm text-zinc-600 hover:text-[#e63946]">(877) 4-MYDOJO</a></div>
            <div className="border-b border-r border-[var(--mydojo-line)] p-5"><Mail className="h-5 w-5 text-[#e63946]" /><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-black">Email</p><a href="mailto:info@mydojomartialarts.com" className="mt-1 block break-all text-sm text-zinc-600 hover:text-[#e63946]">info@mydojomartialarts.com</a></div>
            <div className="border-b border-r border-[var(--mydojo-line)] p-5"><MapPin className="h-5 w-5 text-[#e63946]" /><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-black">Address</p><a href="https://www.google.com/maps/search/?api=1&query=11721+Spring+Cypress+Rd,+Tomball,+TX+77377" target="_blank" rel="noreferrer" className="mt-1 block text-sm leading-6 text-zinc-600 hover:text-[#e63946]">11721 Spring Cypress Rd<br />Tomball, TX 77377</a></div>
            <div className="border-b border-r border-[var(--mydojo-line)] p-5"><Clock className="h-5 w-5 text-[#e63946]" /><p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-black">Hours</p><p className="mt-1 text-sm leading-6 text-zinc-600">Mon–Thu: 12–9 PM<br />Fri: 12–8 PM · Sat: 9–2 PM</p></div>
          </div>
        </div>

        <div className="border border-[var(--mydojo-line)] bg-white p-7 md:p-10">
          {submitted ? <div className="flex min-h-[31rem] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e63946] text-white"><CheckCircle2 className="h-9 w-9" /></div><p className="public-eyebrow mt-7">Message received</p><h2 className="mt-4 font-heading text-5xl font-bold uppercase leading-none text-black">Thank you.</h2><p className="mt-5 max-w-md text-base leading-7 text-zinc-600">Your message has been saved and our team has been alerted. {smsSent ? "We also sent a confirmation text to the number you provided." : "Our team will follow up shortly."}</p><button onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); setSmsSent(null); }} className="public-button-secondary mt-8">Send another message</button></div> : <><p className="public-eyebrow">Send a message</p><h2 className="mt-4 font-heading text-5xl font-bold uppercase leading-none text-black">We’ll follow up.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">Tell us what you are looking for. Fields marked with an asterisk are required.</p><form onSubmit={handleSubmit} className="mt-8 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">First name *</span><Input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="h-12 rounded-none bg-[#f7f6f3]" autoComplete="given-name" /></label><label className="space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">Last name *</span><Input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="h-12 rounded-none bg-[#f7f6f3]" autoComplete="family-name" /></label></div><label className="block space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">Email *</span><Input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="h-12 rounded-none bg-[#f7f6f3]" autoComplete="email" /></label><label className="block space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">Mobile number *</span><Input required minLength={10} type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-12 rounded-none bg-[#f7f6f3]" autoComplete="tel" /></label><label className="block space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">What interests you?</span><select value={form.program} onChange={(e) => update("program", e.target.value)} className="h-12 w-full rounded-none border border-[var(--mydojo-line)] bg-[#f7f6f3] px-3 text-sm text-black outline-none focus:border-[#e63946]"><option value="Not Sure">Help me choose</option><option value="Little Ninjas">Little Ninjas (ages 3–5)</option><option value="Dragon Kids">Dragon Kids (ages 5–12)</option><option value="Teens">Teens (ages 13–17)</option><option value="Adult Karate">Adult Karate</option><option value="Kickboxing">Kickboxing</option><option value="After School">After School</option></select></label><label className="block space-y-2"><span className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-500">Message</span><Textarea value={form.message} onChange={(e) => update("message", e.target.value)} className="min-h-32 rounded-none bg-[#f7f6f3]" placeholder="Tell us how we can help." /></label>{submitLead.error && <p role="alert" className="border border-red-100 bg-red-50 p-3 text-sm text-red-700">We could not send your message just yet. Please try again or call us directly at (877) 4-MYDOJO.</p>}<Button type="submit" disabled={submitLead.isPending} className="h-14 w-full rounded-none bg-[#e63946] text-base font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#bf2634]">{submitLead.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending your message</> : <><Send className="mr-2 h-4 w-4" />Send message</>}</Button><p className="text-center text-xs leading-5 text-zinc-500">We use your details to respond to your request. Reply STOP to opt out of text messages.</p></form></>}
        </div>
      </div></section>
    </div>
  );
}
