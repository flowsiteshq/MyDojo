import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function TermsOfService() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8 text-black">
            TERMS OF <span className="text-primary">SERVICE</span>
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="lead text-xl mb-8">
              Last Updated: January 5, 2026
            </p>

            <p className="mb-6">
              Welcome to MyDojo Martial Arts & Fitness. By accessing our website, enrolling in our classes, or using our facilities, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing this website or purchasing a membership, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site or our facilities.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">2. Membership & Billing</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Billing:</strong> Membership fees are billed on a recurring monthly basis. You authorize us to charge your designated payment method for these fees.</li>
              <li><strong>Cancellations:</strong> Cancellation requests must be submitted in writing at least 30 days prior to your next billing cycle.</li>
              <li><strong>Refunds:</strong> Membership fees are non-refundable, except as required by law.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">3. Code of Conduct</h3>
            <p className="mb-4">
              All members and guests are expected to conduct themselves with respect and discipline. We reserve the right to terminate the membership of anyone who:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Engages in harassment, bullying, or violent behavior outside of structured training.</li>
              <li>Disrespects instructors, staff, or fellow students.</li>
              <li>Misuses equipment or facilities.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">4. Liability Waiver</h3>
            <p className="mb-6">
              Martial arts training involves physical activity and inherent risks of injury. By participating in our classes, you voluntarily assume all risks associated with such participation. You agree to release, waive, and discharge MyDojo Martial Arts & Fitness, its owners, instructors, and employees from any and all liability for any injury or loss arising from your participation.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">5. Intellectual Property</h3>
            <p className="mb-6">
              The content on this website, including text, graphics, logos, and images, is the property of MyDojo Martial Arts & Fitness and is protected by copyright and other intellectual property laws.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">6. Changes to Terms</h3>
            <p className="mb-6">
              We reserve the right to modify these Terms at any time. We will notify members of significant changes by posting the new Terms on this site. Your continued use of the site or our facilities after any such changes constitutes your acceptance of the new Terms.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">7. Contact Information</h3>
            <p className="mb-6">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="font-bold text-black">MyDojo Martial Arts & Fitness</p>
              <p>123 Martial Arts Way</p>
              <p>City, State, Zip Code</p>
              <p>Phone: (877) 4-MYDOJO</p>
              <p>Email: info@mydojo.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
