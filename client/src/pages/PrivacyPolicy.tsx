import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
              Last Updated: January 5, 2026
            </p>

            <p className="mb-6">
              At MyDojo Martial Arts & Fitness ("MyDojo", "we", "us", or "our"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">1. Information We Collect</h3>
            <p className="mb-4">
              We may collect information about you in a variety of ways. The information we may collect on the Site includes:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
              <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">2. Use of Your Information</h3>
            <p className="mb-4">
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Process your class bookings and membership payments.</li>
              <li>Email you regarding your account or order.</li>
              <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
              <li>Generate a personal profile about you to make future visits to the Site more personalized.</li>
              <li>Increase the efficiency and operation of the Site.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
              <li>Notify you of updates to the Site.</li>
              <li>Offer new products, services, and/or recommendations to you.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">3. Disclosure of Your Information</h3>
            <p className="mb-4">
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
            </ul>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">4. Security of Your Information</h3>
            <p className="mb-6">
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">5. Policy for Children</h3>
            <p className="mb-6">
              We do not knowingly solicit information from or market to children under the age of 13. If you become aware that any data has been collected from children under age 13, please contact us using the contact information provided below.
            </p>

            <h3 className="text-2xl font-bold text-black mt-8 mb-4">6. Contact Us</h3>
            <p className="mb-6">
              If you have questions or comments about this Privacy Policy, please contact us at:
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
