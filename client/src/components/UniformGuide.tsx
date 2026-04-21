import { motion } from "framer-motion";
import { Check } from "lucide-react";

const uniformRequirements = [
  {
    id: "little-ninjas",
    title: "Little Ninjas",
    ages: "Ages 3-5",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/NEDhCFirWzLtNfMV.jpg",
    items: ["White Gi Jacket", "White Gi Pants", "White Belt"],
    note: "Comfortable and easy to move in for our youngest students."
  },
  {
    id: "core-kids",
    title: "Dragon Kids",
    ages: "Ages 5-12",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/HvixWaELBeoHqzIR.jpg",
    items: ["White Gi Jacket", "White Gi Pants", "White Belt", "Red Sparring Gloves"],
    note: "Standard uniform plus safety gear for partner drills."
  },
  {
    id: "teens-adults",
    title: "Teens & Adults",
    ages: "Ages 12+",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/oQpLydAVYTUkgweH.jpg",
    items: ["MyDojo Black T-Shirt", "Black Kickboxing Shorts", "Boxing Gloves", "Hand Wraps"],
    note: "Athletic wear designed for high-intensity training and striking."
  }
];

export default function UniformGuide() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">REQUIRED UNIFORMS</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Look the part, feel the part. Here is the required training gear for each of our programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {uniformRequirements.map((uniform, index) => (
            <motion.div
              key={uniform.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-64 overflow-hidden bg-white flex items-center justify-center p-4">
                <img
                  src={uniform.image}
                  alt={`${uniform.title} Uniform`}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-heading font-bold">{uniform.title}</h3>
                    <span className="text-primary font-medium text-sm">{uniform.ages}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {uniform.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <div className="bg-black/5 p-1 rounded-full text-black">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <p className="text-sm text-gray-500 italic border-t border-gray-200 pt-4">
                  "{uniform.note}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            * All uniforms and gear are available for purchase at our front desk.
          </p>
        </div>
      </div>
    </section>
  );
}
