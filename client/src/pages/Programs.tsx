import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { programs } from "@/data/programs";
import UniformGuide from "@/components/UniformGuide";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";

export default function Programs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Our Programs" 
        description="Explore our martial arts programs for all ages: Little Ninjas, Dragon Kids, Teens, and Adults. Schedule a free trial today."
        keywords="martial arts programs, kids martial arts classes, teen karate, adult kickboxing, Little Ninjas program, Dragon Kids martial arts, after school martial arts, Tomball martial arts programs, youth martial arts, family martial arts"
      />
      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: "Home", url: "/" },
          { name: "Programs", url: "/programs" },
        ]}
      />
      {programs.map((program) => (
        <SchemaMarkup
          key={program.id}
          type="Course"
          name={program.title}
          description={program.description}
          url={`https://www.mydojoma.com/programs/${program.id}`}
          ageRange={program.ages}
          courseMode="onsite"
        />
      ))}
      
      {/* Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">PROGRAMS</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            MyDojo offers the very best in Martial Arts training for Ages 3 & Up. Find the perfect program for you or your child.
          </p>
        </div>
      </div>

      {/* Programs List */}
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-24">
          {programs.map((program, index) => (
            <motion.div 
              key={program.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
            >
              {/* Image Side */}
              <div className="w-full lg:w-1/2">
                <Link href={program.id === 'homeschool' ? '/homeschool' : `/programs/${program.id}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px] group cursor-pointer">
                    <img 
                      src={program.image} 
                      alt={program.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-heading text-2xl font-bold border-2 border-white px-6 py-2 rounded-full">View Details</span>
                    </div>
                    
                    {/* Floating Badge */}
                    <div className="absolute top-6 right-6 bg-primary text-white px-6 py-3 rounded-lg shadow-lg font-bold font-heading text-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-300">
                      {program.id === 'homeschool' ? 'Noon Classes' : 'Free Trial Available'}
                    </div>
                  </div>
                </Link>
              </div>

              {/* Content Side */}
              <div className="w-full lg:w-1/2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                    {program.ages}
                  </span>
                  <span className="text-gray-500 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    {program.duration}
                  </span>
                </div>
                
                <Link href={program.id === 'homeschool' ? '/homeschool' : `/programs/${program.id}`}>
                  <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-black hover:text-primary transition-colors cursor-pointer">
                    {program.title}
                  </h2>
                </Link>
                
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  {program.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {program.benefits.slice(0, 4).map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="bg-black text-white p-1 rounded-full">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link href={program.id === 'homeschool' ? '/homeschool' : `/programs/${program.id}`}>
                    <Button className="bg-black hover:bg-primary text-white px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg transition-colors">
                      Learn More <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href={program.id === 'homeschool' ? '/homeschool' : `/programs/${program.id}#lead-form`}>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-6 h-auto font-heading uppercase tracking-wider text-lg transition-colors">
                      Free Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Family Discount Banner */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 rounded-full px-4 py-2 mb-6">
              <span className="text-red-300 text-sm font-bold uppercase tracking-wider">👨‍👩‍👧‍👦 Family Savings Program</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">TRAIN TOGETHER,{" "}<span className="text-red-500">SAVE TOGETHER</span></h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Enroll your whole family and unlock exclusive savings — one registration fee covers everyone, and your 2nd family member gets 50% off monthly tuition.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
                <div className="text-3xl font-black text-red-400 mb-2">50% OFF</div>
                <div className="font-bold text-lg mb-1">2nd Family Member's Monthly Tuition</div>
                <p className="text-white/60 text-sm">Every additional family member enrolls at half the monthly tuition — every month, for the life of their membership.</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="text-3xl font-black text-yellow-400 mb-2">$99</div>
                <div className="font-bold text-lg mb-1">One Family Registration Fee</div>
                <p className="text-white/60 text-sm">One $99 registration fee covers your entire family — no per-person fees, no matter how many members enroll.</p>
              </div>
            </div>
            <Link href="/family-enrollment">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-black text-lg px-10 py-6 h-auto uppercase tracking-wider">
                Create Family Account — $99 One-Time Fee
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Uniform Guide */}
      <UniformGuide />

      {/* Disclaimer */}
      <div className="bg-gray-100 py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          <p>*Class schedules and availability subject to change.</p>
        </div>
      </div>
    </div>
  );
}
