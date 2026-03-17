import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { useState } from "react";
import SEO from "@/components/SEO";

export default function Testimonials() {
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);

  const { data: testimonials, isLoading } = trpc.testimonials.getAll.useQuery({
    program: selectedProgram,
    minRating: selectedRating,
  });

  const programs = ["All Programs", "Little Ninjas", "Dragon Kids", "Teens", "Adults", "Kickboxing", "After School"];
  const ratings = [
    { value: undefined, label: "All Ratings" },
    { value: 5, label: "5 Stars" },
    { value: 4, label: "4+ Stars" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEO 
        title="Success Stories & Testimonials"
        description="Read real success stories from MyDojo members. Parents and students share their martial arts journey, from building confidence to achieving black belt. See why families choose MyDojo."
        keywords="martial arts testimonials, karate reviews, student success stories, parent reviews martial arts, martial arts transformation, MyDojo reviews, best martial arts school reviews, kickboxing testimonials"
      />
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg"
            alt="MyDojo Community"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        </div>

        <div className="container relative z-10 text-center">
          <div className="inline-block bg-primary text-white text-sm font-bold uppercase tracking-widest px-3 py-1 mb-6 rounded-sm">
            Success Stories
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6">
            HEAR FROM OUR <span className="text-primary">MEMBERS</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Real stories from real people who have transformed their lives through martial arts training at MyDojo.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-zinc-900 border-y border-zinc-800">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            {/* Program Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {programs.map((program) => (
                <Button
                  key={program}
                  variant={selectedProgram === (program === "All Programs" ? undefined : program) ? "default" : "outline"}
                  onClick={() => setSelectedProgram(program === "All Programs" ? undefined : program)}
                  className="uppercase tracking-wider text-sm text-white"
                >
                  {program}
                </Button>
              ))}
            </div>

            {/* Rating Filter */}
            <div className="flex gap-2">
              {ratings.map((rating) => (
                <Button
                  key={rating.label}
                  variant={selectedRating === rating.value ? "default" : "outline"}
                  onClick={() => setSelectedRating(rating.value)}
                  className="uppercase tracking-wider text-sm text-white"
                >
                  {rating.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 bg-black">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-zinc-900 border-zinc-800 p-8 animate-pulse">
                  <div className="h-48 bg-zinc-800 rounded-lg mb-4" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : testimonials && testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="bg-zinc-900 border-zinc-800 hover:border-primary transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-8">
                    {/* Quote Icon */}
                    <div className="mb-6">
                      <Quote className="h-12 w-12 text-primary opacity-50" />
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating
                              ? "fill-primary text-primary"
                              : "text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-heading font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {testimonial.title}
                    </h3>

                    {/* Content */}
                    <p className="text-gray-400 mb-6 leading-relaxed line-clamp-6">
                      {testimonial.content}
                    </p>

                    {/* Member Info */}
                    <div className="flex items-center gap-4 pt-6 border-t border-zinc-800">
                      {testimonial.memberPhoto && (
                        <img
                          src={testimonial.memberPhoto}
                          alt={testimonial.memberName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-bold text-white">{testimonial.memberName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-bold uppercase">
                            {testimonial.program}
                          </span>
                          {testimonial.memberSince && (
                            <span>• {testimonial.memberSince}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-xl">
                No testimonials found matching your filters.
              </p>
              <Button
                onClick={() => {
                  setSelectedProgram(undefined);
                  setSelectedRating(undefined);
                }}
                className="mt-6"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="container relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            READY TO WRITE YOUR SUCCESS STORY?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of members who have transformed their lives through martial arts training.
          </p>
          <Button className="bg-white text-primary hover:bg-black hover:text-white text-lg px-10 py-8 h-auto font-heading uppercase tracking-wider transition-all duration-300 shadow-xl">
            Start Your Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
