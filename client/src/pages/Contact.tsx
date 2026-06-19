import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { MapView } from "@/components/Map";
import SEO from "@/components/SEO";
import SchemaMarkup from "@/components/SchemaMarkup";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Contact Us"
        description="Contact MyDojo Martial Arts in Tomball, Texas. Call (877) 4-MYDOJO or visit us to schedule your free trial class. We're here to answer all your questions!"
        keywords="contact MyDojo, martial arts Tomball contact, schedule free trial, martial arts phone number, dojo location Tomball, martial arts directions, contact karate school"
      />
      <SchemaMarkup type="LocalBusiness" />
      <SchemaMarkup
        type="BreadcrumbList"
        items={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ]}
      />
      {/* Header */}
      <div className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://files.manuscdn.com/user_upload_by_module/session_file/310419663031545745/qYVQxVSfHBmyqxTB.jpg')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-heading font-bold mb-8">{t("contact.get_in_touch")}</h2>
            
            {/* Map Section */}
            <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg mb-12 border border-gray-200">
              <MapView 
                className="w-full h-full"
                onMapReady={(map) => {
                  // Center on Tomball, TX
                  const tomballLocation = { lat: 30.0112706, lng: -95.6025971 };
                  map.setCenter(tomballLocation);
                  map.setZoom(15);
                  
                  new google.maps.Marker({
                    position: tomballLocation,
                    map: map,
                    title: "MyDojo Headquarters"
                  });
                }}
              />
            </div>
            <p className="text-gray-600 mb-12 leading-relaxed">
              {t("contact.intro_text")}
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t("contact.phone_title")}</h4>
                  <p className="text-gray-600">(877) 4-MYDOJO</p>
                  <p className="text-gray-600">(877) 469-3656</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t("contact.email_title")}</h4>
                  <p className="text-gray-600">info@mydojomartialarts.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t("contact.address_title")}</h4>
                  <p className="text-gray-600">11721 Spring Cypress Rd</p>
                  <p className="text-gray-600">Tomball, TX 77377</p>
                  <Button variant="link" className="text-primary p-0 h-auto font-bold mt-1">
                    {t("locations.get_directions")}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-4 rounded-full text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{t("contact.hours_title")}</h4>
                  <p className="text-gray-600">Mon-Thu: 12:00 PM - 9:00 PM</p>
                  <p className="text-gray-600">Fri: 12:00 PM - 8:00 PM</p>
                  <p className="text-gray-600">Sat: 9:00 AM - 2:00 PM</p>
                  <p className="text-gray-600">Sun: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-2xl font-heading font-bold mb-6">{t("contact.send_message_title")}</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("join.first_name")}</label>
                  <Input placeholder="John" className="bg-gray-50 border-gray-200 focus:border-primary h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("join.last_name")}</label>
                  <Input placeholder="Doe" className="bg-gray-50 border-gray-200 focus:border-primary h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("contact.email")}</label>
                <Input type="email" placeholder="john@example.com" className="bg-gray-50 border-gray-200 focus:border-primary h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("contact.phone")}</label>
                <Input type="tel" placeholder="(555) 123-4567" className="bg-gray-50 border-gray-200 focus:border-primary h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("contact.interested_program")}</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-md h-12 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                  <option>{t("contact.select_program")}</option>
                  <option>Little Ninjas (3-5)</option>
                  <option>Dragon Kids (5-12)</option>
                  <option>Teens (12-17)</option>
                  <option>Adults (18+)</option>
                  <option>After School</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-500">{t("contact.message")}</label>
                <Textarea placeholder={t("contact.message_placeholder")} className="bg-gray-50 border-gray-200 focus:border-primary min-h-[150px]" />
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-white h-14 font-heading uppercase tracking-wider text-lg">
                {t("contact.send")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
