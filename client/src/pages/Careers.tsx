import { Button } from "@/components/ui/button";
import { Check, Mail, Briefcase, Heart, Zap, Users, MapPin } from "lucide-react";
import SEO from "@/components/SEO";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { JobApplicationModal } from "@/components/JobApplicationModal";

export default function Careers() {
  const benefits = [
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: "Health & Wellness",
      description: "Comprehensive health benefits and free gym membership for you and your family."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Growth Opportunities",
      description: "Continuous training, certification support, and a clear path for career advancement."
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Great Culture",
      description: "Join a passionate, high-energy team dedicated to making a positive impact."
    }
  ];

  const positions = [
    {
      title: "Child Care Director",
      type: "Full-time",
      location: "Tomball, TX",
      description: "Oversee our After School and Summer Camp programs. Responsible for curriculum planning, staff supervision, and ensuring a safe, nurturing environment for children."
    },
    {
      title: "After School Counselor",
      type: "Part-time",
      location: "Multiple Locations",
      description: "Engage with children in our After School program. Assist with homework, lead activities, and provide positive mentorship."
    },
    {
      title: "Van Driver",
      type: "Part-time",
      location: "Multiple Locations",
      description: "Safely transport children from local schools to our facility. Clean driving record and valid driver's license required."
    },
    {
      title: "Martial Arts Instructor",
      type: "Full-time / Part-time",
      location: "Multiple Locations",
      description: "Lead engaging classes for kids and adults. Experience in martial arts required. Teaching experience preferred."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Careers" 
        description="Join the MyDojo team! We are looking for passionate individuals to help us empower lives through martial arts." 
      />

      {/* Hero Section */}
      <div className="bg-black text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/QCDmgxbjdlfUOCPT.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6">JOIN OUR TEAM</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Do you have a passion for fitness and helping others? Build a rewarding career with MyDojo and make a difference every day.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-heading uppercase tracking-wider" onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })}>
            View Openings
          </Button>
        </div>
      </div>

      {/* Why Work With Us */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Why Work at MyDojo?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're not just a gym; we're a community. We invest in our team members because we know that happy employees create happy members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div id="positions" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center">Current Openings</h2>
          
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
            {positions.map((job, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 md:p-8 hover:border-primary transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.type}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                  </div>
                  <p className="text-gray-600">{job.description}</p>
                </div>
                <div className="shrink-0">
                  <JobApplicationModal 
                    defaultPosition={job.title}
                    trigger={
                      <Button variant="outline" className="border-black hover:bg-black hover:text-white">
                        Apply Now
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-black text-white rounded-3xl p-12 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-heading font-bold mb-4">Don't see the right fit?</h3>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                We're always looking for talent. Send us your resume and tell us why you'd be a great addition to the MyDojo family.
              </p>
              <JobApplicationModal 
                trigger={
                  <Button className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-heading uppercase">
                    <Mail className="mr-2 h-5 w-5" /> Apply General
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
