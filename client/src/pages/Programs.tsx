import { ArrowRight, Check, ChevronRight, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { programs } from "@/data/programs";
import UniformGuide from "@/components/UniformGuide";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { openBookFreeClassGate } from "@/lib/chatbot";

export default function Programs() {
  return (
    <div className="public-page min-h-screen">
      <SEO
        title="Martial Arts & Kickboxing Programs | MyDojo"
        description="Explore MyDojo's martial arts and kickboxing programs for children, teens, adults, and families in Tomball, Texas."
        keywords="martial arts programs, kids martial arts classes, teen karate, adult kickboxing, Tomball martial arts"
      />
      <SchemaMarkup type="BreadcrumbList" items={[{ name: "Home", url: "/" }, { name: "Programs", url: "/programs" }]} />
      {programs.map((program) => <SchemaMarkup key={program.id} type="Course" name={program.title} description={program.description} url={`https://www.mydojoma.com/programs/${program.id}`} ageRange={program.ages} courseMode="onsite" />)}

      <section className="border-b border-[var(--mydojo-line)] bg-[var(--mydojo-paper)] py-16 md:py-24">
        <div className="container grid gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="public-eyebrow">MyDojo programs</p><h1 className="public-title mt-5">Find the right place to begin.</h1></div>
          <p className="public-copy max-w-2xl">Every MyDojo program blends effective instruction with practical progress. We will help you choose a starting point that fits your age, goals, and experience level.</p>
        </div>
      </section>

      <section className="public-section bg-white">
        <div className="container">
          <div className="border-l border-t border-[var(--mydojo-line)]">
            {programs.map((program, index) => {
              const detailHref = program.id === "homeschool" ? "/homeschool" : `/programs/${program.id}`;
              return (
                <article key={program.id} className="grid border-b border-r border-[var(--mydojo-line)] lg:grid-cols-[4.5rem_0.82fr_1.18fr]">
                  <div className="hidden border-r border-[var(--mydojo-line)] p-5 text-xs font-extrabold tracking-[0.16em] text-[#e63946] lg:block">{String(index + 1).padStart(2, "0")}</div>
                  <Link href={detailHref}><div className="group relative min-h-[17rem] cursor-pointer overflow-hidden lg:min-h-[27rem]"><img src={program.image} alt={program.title} className="h-full w-full object-cover grayscale-[15%] transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0" /><div className="absolute inset-0 bg-black/10" /></div></Link>
                  <div className="flex flex-col p-7 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold uppercase tracking-[0.12em]"><span className="text-[#e63946]">{program.ages}</span><span className="h-1 w-1 rounded-full bg-zinc-300" /><span className="text-zinc-500">{program.duration}</span></div>
                    <Link href={detailHref}><h2 className="mt-5 cursor-pointer font-heading text-5xl font-bold uppercase leading-[0.9] tracking-[-0.03em] text-black transition-colors hover:text-[#e63946] md:text-6xl">{program.title}</h2></Link>
                    <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600">{program.description}</p>
                    <ul className="mt-7 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                      {program.benefits.slice(0, 4).map((benefit) => <li key={benefit} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e63946]" />{benefit}</li>)}
                    </ul>
                    <div className="mt-auto flex flex-col gap-3 pt-9 sm:flex-row">
                      <Link href={detailHref}><span className="public-button-secondary w-full cursor-pointer sm:w-auto">Explore program <ChevronRight className="h-4 w-4" /></span></Link>
                      <button onClick={openBookFreeClassGate} className="public-button w-full sm:w-auto">Book an introduction <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-black py-16 text-white md:py-24">
        <div className="container grid gap-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div><p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-[#e63946]">Families train together</p><h2 className="mt-5 font-heading text-[clamp(3.5rem,6vw,6rem)] font-bold uppercase leading-[0.86] tracking-[-0.04em]">More progress.<br />More together.</h2></div>
          <div className="max-w-2xl"><p className="text-base leading-7 text-white/75">Training as a family creates shared goals, healthy routines, and encouragement that does not end when class is over. Ask our team about the best starting path for your family.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={openBookFreeClassGate} className="public-button">Talk with our team <ArrowRight className="h-4 w-4" /></button><Link href="/family-enrollment"><span className="inline-flex min-h-[3.125rem] cursor-pointer items-center justify-center gap-2 border border-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-black">Family enrollment <UsersRound className="h-4 w-4" /></span></Link></div></div>
        </div>
      </section>

      <UniformGuide />
    </div>
  );
}
