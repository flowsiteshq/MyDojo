import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

export function FAQ() {
  const { t } = useTranslation();

  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
          {t("faq.title").toUpperCase().split(" ").slice(0, -1).join(" ")}{" "}
          <span className="text-primary">
            {t("faq.title").toUpperCase().split(" ").slice(-1)}
          </span>
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          {t("faq.subtitle")}
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
