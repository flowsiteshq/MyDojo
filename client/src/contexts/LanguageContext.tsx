import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// ─── Translation Dictionary ───────────────────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.programs": "Programs",
    "nav.home": "Home",
    "nav.events": "Events",
    "nav.testimonials": "Testimonials",
    "nav.about": "About",
    "nav.shop": "Shop",
    "nav.contact": "Contact",
    "nav.locations": "Locations",
    "nav.schedule": "Schedule",
    "nav.join": "Join Now",
    "nav.learning": "Learning",
    "nav.my_account": "My Account",
    "nav.find_location": "Find a Location",

    // Hero / Home
    "hero.tagline1": "Build Confidence.",
    "hero.tagline2": "Learn Self Defense.",
    "hero.tagline3": "Have Fun.",
    "hero.subtitle": "Tomball's Favorite Martial Arts School",
    "hero.cta_free": "Book Your Free Class",
    "hero.cta_phone": "(877) 4-MYDOJO",
    "hero.ages3": "Ages 3+",
    "hero.teens_adults": "Teens & Adults",
    "hero.kickboxing": "Kickboxing",
    "hero.limited_spots": "LIMITED SPOTS!",
    "hero.limited_desc": "100 New Members Before July 25",

    // Programs
    "programs.title": "Choose Your Discipline",
    "programs.subtitle": "Explore All Programs",
    "programs.little_ninjas": "Little Ninjas",
    "programs.little_ninjas_ages": "Ages 3-5",
    "programs.little_ninjas_desc": "A \"stealthy\" way to teach children life skills. Helps them enter society with a more confident and enthusiastic outlook.",
    "programs.core_kids": "Core Kids",
    "programs.core_kids_ages": "Ages 5-12",
    "programs.core_kids_desc": "Perfect way to give kids confidence and improve self-discipline. Teaches life skills of self-defense in a fun, safe environment.",
    "programs.teens_adults": "Teens & Adults",
    "programs.teens_adults_ages": "Ages 13+",
    "programs.teens_adults_desc": "Get in the best shape of your life while learning real self-defense. High-energy kickboxing and traditional martial arts.",
    "programs.learn_more": "Learn More",
    "programs.featured": "Featured Program",
    "programs.kickboxing_title": "Adult Kickboxing",
    "programs.kickboxing_desc": "Burn up to 800 calories in a single session! Our high-energy kickboxing classes combine real martial arts techniques with a full-body cardio workout. Perfect for all fitness levels.",
    "programs.view_schedule": "View Class Schedule",

    // Philosophy
    "philosophy.title": "More Than Just",
    "philosophy.title_accent": "Kicks & Punches",
    "philosophy.p1": "At MyDojo, we believe martial arts is a vehicle for personal growth. Our programs are designed to not only provide a rigorous physical workout but also to strengthen the mind and spirit.",
    "philosophy.p2": "Whether you're looking to instill discipline in your child, find a stress-relieving workout for yourself, or learn practical self-defense, our world-class instructors are here to guide you every step of the way.",
    "philosophy.self_defense": "Self Defense",
    "philosophy.self_defense_desc": "Practical techniques for real-world safety.",
    "philosophy.fitness": "Fitness",
    "philosophy.fitness_desc": "Full-body conditioning and cardio health.",
    "philosophy.confidence": "Confidence",
    "philosophy.confidence_desc": "Building self-esteem through achievement.",
    "philosophy.community": "Community",
    "philosophy.community_desc": "Supportive environment for all ages.",
    "philosophy.learn_more": "Learn More About Us",

    // CTA
    "cta.ready": "Ready to Start?",
    "cta.desc": "Join our high-energy, fat-burning 45-minute complimentary Karate or Kickboxing class!",
    "cta.book": "Book Free Trial",
    "cta.or_call": "Or call",

    // Contact
    "contact.title": "Contact Us",
    "contact.subtitle": "We'd love to hear from you",
    "contact.name": "Your Name",
    "contact.email": "Email Address",
    "contact.phone": "Phone Number",
    "contact.message": "Message",
    "contact.send": "Send Message",
    "contact.address": "Address",
    "contact.hours": "Hours",
    "contact.follow": "Follow Us",

    // About
    "about.title": "About MyDojo",
    "about.mission": "Our Mission",
    "about.team": "Meet Our Team",
    "about.story": "Our Story",

    // FAQ
    "faq.title": "Frequently Asked Questions",
    "faq.subtitle": "Got questions? We have answers.",

    // Testimonials
    "testimonials.title": "What Our Members Say",
    "testimonials.subtitle": "Real stories from real families",

    // Footer
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.quick_links": "Quick Links",
    "footer.programs": "Programs",
    "footer.contact": "Contact",
    "footer.tagline": "Building confidence, discipline, and strength — one class at a time.",

    // Schedule
    "schedule.title": "Class Schedule",
    "schedule.subtitle": "Find a class that works for you",
    "schedule.book": "Book This Class",
    "schedule.mon_fri": "Mon – Fri",
    "schedule.saturday": "Saturday",
    "schedule.sunday": "Sunday",
    "schedule.closed": "Closed",

    // Enrollment / Join
    "join.title": "Join MyDojo",
    "join.subtitle": "Start your martial arts journey today",
    "join.free_trial": "Book a Free Trial",
    "join.enroll": "Enroll Now",
    "join.select_program": "Select a Program",
    "join.first_name": "First Name",
    "join.last_name": "Last Name",
    "join.parent_name": "Parent / Guardian Name",
    "join.child_name": "Child's Name",
    "join.dob": "Date of Birth",
    "join.submit": "Submit",
    "join.next": "Next",
    "join.back": "Back",

    // General
    "general.loading": "Loading...",
    "general.error": "Something went wrong. Please try again.",
    "general.close": "Close",
    "general.save": "Save",
    "general.cancel": "Cancel",
    "general.yes": "Yes",
    "general.no": "No",
    "general.or": "or",
    "general.call_us": "Call Us",
    "general.text_us": "Text Us",
    "general.call_or_text": "Call or Text?",
    "general.call_or_text_desc": "How would you like to reach us?",
    "phone.call_desc": "Speak with a staff member now",
    "phone.text_desc": "Chat with our AI assistant instantly",
    "phone.ai_note": "Texting uses our AI assistant — available 24/7",

    // Cookie Banner
    "cookie.message": "We use cookies to improve your experience.",
    "cookie.privacy": "Privacy Policy",
    "cookie.decline": "Decline",
    "cookie.accept": "Accept All",
    "cookie.preferences": "Preferences",

    // Belt Journey
    "belt.title": "Your Belt Journey",
    "belt.subtitle": "Progress through the ranks",

    // Locations
    "locations.title": "Our Locations",
    "locations.subtitle": "Find a dojo near you",
    "locations.get_directions": "Get Directions",
    "locations.view_schedule": "View Schedule",
    "locations.book_trial": "Book Free Trial",

    // Programs page
    "programs.page_title": "Our Programs",
    "programs.page_subtitle": "Find the perfect program for you or your child",

    // Language toggle
    "lang.english": "English",
    "lang.spanish": "Español",
    "lang.toggle": "ES",
  },

  es: {
    // Navigation
    "nav.programs": "Programas",
    "nav.home": "Inicio",
    "nav.events": "Eventos",
    "nav.testimonials": "Testimonios",
    "nav.about": "Nosotros",
    "nav.shop": "Tienda",
    "nav.contact": "Contacto",
    "nav.locations": "Ubicaciones",
    "nav.schedule": "Horario",
    "nav.join": "Únete Ahora",
    "nav.learning": "Aprendizaje",
    "nav.my_account": "Mi Cuenta",
    "nav.find_location": "Encontrar Ubicación",

    // Hero / Home
    "hero.tagline1": "Construye Confianza.",
    "hero.tagline2": "Aprende Defensa Personal.",
    "hero.tagline3": "¡Diviértete!",
    "hero.subtitle": "La Escuela de Artes Marciales Favorita de Tomball",
    "hero.cta_free": "Reserva Tu Clase Gratis",
    "hero.cta_phone": "(877) 4-MYDOJO",
    "hero.ages3": "Desde 3 años",
    "hero.teens_adults": "Jóvenes y Adultos",
    "hero.kickboxing": "Kickboxing",
    "hero.limited_spots": "¡CUPOS LIMITADOS!",
    "hero.limited_desc": "100 Nuevos Miembros Antes del 25 de Julio",

    // Programs
    "programs.title": "Elige Tu Disciplina",
    "programs.subtitle": "Explora Todos los Programas",
    "programs.little_ninjas": "Pequeños Ninjas",
    "programs.little_ninjas_ages": "Edades 3-5",
    "programs.little_ninjas_desc": "Una forma \"sigilosa\" de enseñar habilidades de vida a los niños. Les ayuda a integrarse en la sociedad con una perspectiva más segura y entusiasta.",
    "programs.core_kids": "Niños Core",
    "programs.core_kids_ages": "Edades 5-12",
    "programs.core_kids_desc": "La forma perfecta de dar confianza a los niños y mejorar la autodisciplina. Enseña habilidades de vida y defensa personal en un ambiente divertido y seguro.",
    "programs.teens_adults": "Jóvenes y Adultos",
    "programs.teens_adults_ages": "Edades 13+",
    "programs.teens_adults_desc": "Ponte en la mejor forma de tu vida mientras aprendes defensa personal real. Kickboxing de alta energía y artes marciales tradicionales.",
    "programs.learn_more": "Más Información",
    "programs.featured": "Programa Destacado",
    "programs.kickboxing_title": "Kickboxing para Adultos",
    "programs.kickboxing_desc": "¡Quema hasta 800 calorías en una sola sesión! Nuestras clases de kickboxing de alta energía combinan técnicas reales de artes marciales con un entrenamiento cardiovascular de cuerpo completo. Perfecto para todos los niveles de condición física.",
    "programs.view_schedule": "Ver Horario de Clases",

    // Philosophy
    "philosophy.title": "Más Que Solo",
    "philosophy.title_accent": "Patadas y Golpes",
    "philosophy.p1": "En MyDojo, creemos que las artes marciales son un vehículo para el crecimiento personal. Nuestros programas están diseñados no solo para proporcionar un entrenamiento físico riguroso, sino también para fortalecer la mente y el espíritu.",
    "philosophy.p2": "Ya sea que busques inculcar disciplina en tu hijo, encontrar un entrenamiento para aliviar el estrés, o aprender defensa personal práctica, nuestros instructores de clase mundial están aquí para guiarte en cada paso del camino.",
    "philosophy.self_defense": "Defensa Personal",
    "philosophy.self_defense_desc": "Técnicas prácticas para la seguridad en el mundo real.",
    "philosophy.fitness": "Condición Física",
    "philosophy.fitness_desc": "Acondicionamiento de cuerpo completo y salud cardiovascular.",
    "philosophy.confidence": "Confianza",
    "philosophy.confidence_desc": "Construyendo autoestima a través de los logros.",
    "philosophy.community": "Comunidad",
    "philosophy.community_desc": "Ambiente de apoyo para todas las edades.",
    "philosophy.learn_more": "Conoce Más Sobre Nosotros",

    // CTA
    "cta.ready": "¿Listo para Empezar?",
    "cta.desc": "¡Únete a nuestra clase gratuita de Karate o Kickboxing de 45 minutos de alta energía!",
    "cta.book": "Reservar Clase Gratis",
    "cta.or_call": "O llama al",

    // Contact
    "contact.title": "Contáctanos",
    "contact.subtitle": "Nos encantaría saber de ti",
    "contact.name": "Tu Nombre",
    "contact.email": "Correo Electrónico",
    "contact.phone": "Número de Teléfono",
    "contact.message": "Mensaje",
    "contact.send": "Enviar Mensaje",
    "contact.address": "Dirección",
    "contact.hours": "Horario",
    "contact.follow": "Síguenos",

    // About
    "about.title": "Sobre MyDojo",
    "about.mission": "Nuestra Misión",
    "about.team": "Conoce a Nuestro Equipo",
    "about.story": "Nuestra Historia",

    // FAQ
    "faq.title": "Preguntas Frecuentes",
    "faq.subtitle": "¿Tienes preguntas? Tenemos respuestas.",

    // Testimonials
    "testimonials.title": "Lo Que Dicen Nuestros Miembros",
    "testimonials.subtitle": "Historias reales de familias reales",

    // Footer
    "footer.rights": "Todos los derechos reservados.",
    "footer.privacy": "Política de Privacidad",
    "footer.terms": "Términos de Servicio",
    "footer.quick_links": "Enlaces Rápidos",
    "footer.programs": "Programas",
    "footer.contact": "Contacto",
    "footer.tagline": "Construyendo confianza, disciplina y fortaleza — una clase a la vez.",

    // Schedule
    "schedule.title": "Horario de Clases",
    "schedule.subtitle": "Encuentra una clase que se adapte a ti",
    "schedule.book": "Reservar Esta Clase",
    "schedule.mon_fri": "Lun – Vie",
    "schedule.saturday": "Sábado",
    "schedule.sunday": "Domingo",
    "schedule.closed": "Cerrado",

    // Enrollment / Join
    "join.title": "Únete a MyDojo",
    "join.subtitle": "Comienza tu camino en las artes marciales hoy",
    "join.free_trial": "Reservar Clase de Prueba Gratis",
    "join.enroll": "Inscríbete Ahora",
    "join.select_program": "Selecciona un Programa",
    "join.first_name": "Nombre",
    "join.last_name": "Apellido",
    "join.parent_name": "Nombre del Padre / Tutor",
    "join.child_name": "Nombre del Niño",
    "join.dob": "Fecha de Nacimiento",
    "join.submit": "Enviar",
    "join.next": "Siguiente",
    "join.back": "Atrás",

    // General
    "general.loading": "Cargando...",
    "general.error": "Algo salió mal. Por favor intenta de nuevo.",
    "general.close": "Cerrar",
    "general.save": "Guardar",
    "general.cancel": "Cancelar",
    "general.yes": "Sí",
    "general.no": "No",
    "general.or": "o",
    "general.call_us": "Llámanos",
    "general.text_us": "Escríbenos",
    "phone.call_desc": "Habla con un miembro del personal ahora",
    "phone.text_desc": "Chatea con nuestro asistente de IA al instante",
    "phone.ai_note": "Los mensajes usan nuestro asistente de IA — disponible 24/7",
    "general.call_or_text": "¿Llamar o Escribir?",
    "general.call_or_text_desc": "¿Cómo te gustaría contactarnos?",

    // Cookie Banner
    "cookie.message": "Usamos cookies para mejorar tu experiencia.",
    "cookie.privacy": "Política de Privacidad",
    "cookie.decline": "Rechazar",
    "cookie.accept": "Aceptar Todo",
    "cookie.preferences": "Preferencias",

    // Belt Journey
    "belt.title": "Tu Camino de Cinturones",
    "belt.subtitle": "Progresa a través de los rangos",

    // Locations
    "locations.title": "Nuestras Ubicaciones",
    "locations.subtitle": "Encuentra un dojo cerca de ti",
    "locations.get_directions": "Cómo Llegar",
    "locations.view_schedule": "Ver Horario",
    "locations.book_trial": "Reservar Clase Gratis",

    // Programs page
    "programs.page_title": "Nuestros Programas",
    "programs.page_subtitle": "Encuentra el programa perfecto para ti o tu hijo",

    // Language toggle
    "lang.english": "English",
    "lang.spanish": "Español",
    "lang.toggle": "EN",
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Persist language preference in localStorage
    const saved = localStorage.getItem("mydojo_lang");
    return (saved === "es" || saved === "en") ? saved : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("mydojo_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] ?? translations["en"][key] ?? key;
  };

  useEffect(() => {
    // Set the lang attribute on the HTML element for accessibility
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
