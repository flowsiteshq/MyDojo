import { useTranslation } from "react-i18next";
import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Parent of Little Ninja",
    content: "MyDojo has been transformative for my son. He used to be so shy, but after just 3 months in the Little Ninjas program, his confidence has skyrocketed. The instructors are incredibly patient and encouraging.",
    rating: 5,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HONlObwBdLAnGGRP.jpg"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Adult Kickboxing Member",
    content: "I was looking for a workout that wasn't just lifting weights. The adult kickboxing classes here are intense, fun, and a great stress reliever. I've lost 15 pounds and feel stronger than ever.",
    rating: 5,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/uMNMXRfxfSZQbfbK.jpg"
  },
  {
    id: 3,
    name: "Jessica Williams",
    role: "Teen Program Student",
    content: "The teen program isn't just about fighting; it's about discipline and respect. I've made great friends here and learned self-defense skills that make me feel safe and empowered.",
    rating: 5,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/POUQPzFzOxDdiDNV.jpg"
  },
  {
    id: 4,
    name: "David Rodriguez",
    role: "Parent of Core Kid",
    content: "We tried soccer and baseball, but nothing stuck until MyDojo. The structure and focus required in class have helped my daughter improve her grades at school too. Highly recommend!",
    rating: 5,
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/ISYgyHwTaHvYSOvQ.jpg"
  }
];

export function TestimonialCarousel() {
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            SUCCESS <span className="text-primary">STORIES</span>
          </h2>
          <p className="text-gray-600 max-w-xl">
            Don't just take our word for it. Hear from our community of students and parents about their journey with MyDojo.
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollPrev}
            className="rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            ←
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={scrollNext}
            className="rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            →
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 min-w-0">
              <div className="bg-gray-50 p-8 rounded-2xl h-full flex flex-col relative group hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <Quote className="absolute top-6 right-6 text-primary/10 h-12 w-12 group-hover:text-primary/20 transition-colors" />
                
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-gray-700 mb-8 flex-grow leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex md:hidden justify-center gap-4 mt-8">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={scrollPrev}
          className="rounded-full"
        >
          ←
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={scrollNext}
          className="rounded-full"
        >
          →
        </Button>
      </div>
    </div>
  );
}
