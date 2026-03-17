import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need any prior martial arts experience?",
    answer: "Not at all! Our programs are designed for all skill levels, from complete beginners to advanced practitioners. Our instructors will guide you through the basics and help you progress at your own pace."
  },
  {
    question: "What should I wear to my first class?",
    answer: "For your first trial class, comfortable workout clothes (t-shirt and sweatpants/shorts) are perfect. We train barefoot on the mats. If you decide to join, we'll help you get fitted for a proper uniform (Gi)."
  },
  {
    question: "How much do classes cost?",
    answer: "We offer various membership options to fit different budgets and training goals. Since every student's needs are different, we recommend coming in for a free trial class where we can discuss the best program for you."
  },
  {
    question: "At what age can children start?",
    answer: "Our Little Ninjas program is specifically designed for children ages 3-5, focusing on listening skills, balance, and coordination. We have specific programs for every age group thereafter."
  },
  {
    question: "Is sparring required?",
    answer: "Sparring is an optional part of our advanced curriculum. Beginners focus on technique, fitness, and drills. You will never be forced to spar before you are ready and willing."
  },
  {
    question: "How do I get started?",
    answer: "The best way to start is by booking a free trial class! You can sign up right here on our website or give us a call. This gives you a chance to meet the instructors, see the facility, and try a workout risk-free."
  }
];

export function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Got questions? We've got answers. Here's what most new students want to know before stepping onto the mat.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-gray-200 rounded-lg px-6 bg-gray-50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all duration-200"
          >
            <AccordionTrigger className="text-lg font-bold text-left hover:text-primary py-6">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 text-base pb-6 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
