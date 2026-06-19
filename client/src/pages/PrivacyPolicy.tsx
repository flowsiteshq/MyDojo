import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
            PRIVACY <span className="text-primary">POLICY</span>
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="lead text-xl mb-8">
              Last Updated: May 3, 2026
            </p>

            <p className="mb-6">
              At MyDojo Martial Arts &amp; Fitness ("MyDojo", "we", "us", or "our"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">1. Information We Collect</h3>
            <p className="mb-4">
              We may collect information about you in a variety of ways. The information we may collect on the Site includes:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register with the Site, complete a lead capture form, or choose to participate in various activities related to the Site.</li>
              <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
              <li><strong>Cookie &amp; Tracking Data:</strong> When you accept marketing cookies on our Site, we may collect information about your browsing behavior, pages visited, and time spent on the Site. This data is used to personalize your experience and present you with relevant offers, including our free trial class invitation.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">2. Use of Your Information</h3>
            <p className="mb-4">
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Process your class bookings and membership payments.</li>
              <li>Email or text you regarding your account, bookings, or promotional offers.</li>
              <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
              <li>Generate a personal profile about you to make future visits to the Site more personalized.</li>
              <li>Increase the efficiency and operation of the Site.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
              <li>Notify you of updates to the Site.</li>
              <li>Offer new products, services, and/or recommendations to you.</li>
              <li><strong>Contact you as a prospective lead</strong> if you submit your name, phone number, or email through any form on our website, including cookie-triggered lead capture forms. By submitting your information, you consent to receive follow-up communications from MyDojo via phone, text message (SMS), or email.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">3. Cookies &amp; Lead Capture</h3>
            <p className="mb-4">
              Our website uses cookies to improve your browsing experience and to present you with relevant marketing offers. When you accept marketing cookies via our cookie consent banner, the following may occur:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Behavioral Tracking:</strong> We track which pages you visit and how long you spend on the Site to understand your interests.</li>
              <li><strong>Lead Capture Popup:</strong> Based on your browsing activity, we may display a popup inviting you to claim a free trial class. If you submit this form, your name, phone number, and email address are stored as a lead in our CRM system.</li>
              <li><strong>Marketing Follow-Up:</strong> If you submit your contact information through any form on our Site, you may receive text messages (SMS) and emails from MyDojo regarding our programs, promotions, and free trial offers. Message and data rates may apply. You may opt out at any time by replying STOP to any text message or clicking Unsubscribe in any email.</li>
              <li><strong>Essential Cookies:</strong> Certain cookies are required for the Site to function properly (e.g., session management) and are always active regardless of your cookie preferences.</li>
            </ul>
            <p className="mb-6">
              You may manage your cookie preferences at any time by clicking the "Preferences" option in the cookie consent banner, or by clearing your browser's local storage. Declining marketing cookies will prevent the lead capture popup from appearing.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">4. Disclosure of Your Information</h3>
            <p className="mb-4">
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, SMS messaging, hosting services, customer service, and marketing assistance.</li>
              <li><strong>CRM &amp; Marketing Platforms:</strong> Lead information collected through our website may be shared with our CRM platform (DojoFlow) and marketing automation tools for the purpose of following up on your interest in our programs.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">5. Security of Your Information</h3>
            <p className="mb-6">
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">6. Policy for Children</h3>
            <p className="mb-6">
              We do not knowingly solicit information from or market to children under the age of 13. If you become aware that any data has been collected from children under age 13, please contact us using the contact information provided below.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">7. Your Rights &amp; Opt-Out</h3>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Access &amp; Correction:</strong> You may request access to or correction of your personal information by contacting us.</li>
              <li><strong>Deletion:</strong> You may request that we delete your personal information from our records.</li>
              <li><strong>Opt-Out of SMS:</strong> Reply STOP to any text message from MyDojo to stop receiving SMS communications.</li>
              <li><strong>Opt-Out of Email:</strong> Click the Unsubscribe link in any marketing email from MyDojo.</li>
              <li><strong>Cookie Preferences:</strong> Manage your cookie settings at any time via the cookie banner on our Site.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">8. Contact Us</h3>
            <p className="mb-6">
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="font-bold text-black">MyDojo Martial Arts &amp; Fitness</p>
              <p>11721 Spring Cypress Rd, Tomball, TX 77377</p>
              <p>Phone: (877) 4-MYDOJO | (281) 815-3444</p>
              <p>Email: info@mydojoma.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
