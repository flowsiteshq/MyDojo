import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, MapPin, Instagram, Facebook, Youtube, User, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/CookieBanner";

import { openIntakeChatbot } from "@/lib/chatbot";
import { useLocationContext } from "@/contexts/LocationContext";
import { NotificationSubscribe } from "@/components/NotificationSubscribe";
import { PhoneChooser } from "@/components/PhoneChooser";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

// Programs sub-menu items
const PROGRAM_LINKS = [
  { name: "Little Ninjas", path: "/programs#little-ninjas", description: "Ages 3–5" },
  { name: "Dragon Kids", path: "/programs#dragon-kids", description: "Ages 5–12" },
  { name: "Teens & Adults", path: "/programs#teens-adults", description: "Ages 13+" },
  { name: "Kickboxing", path: "/programs#kickboxing", description: "All ages" },
  { name: "After School", path: "/programs#after-school", description: "Ages 5–12" },
  { name: "Summer Camp", path: "/summer-camp", description: "Seasonal" },
  { name: "Birthday Parties", path: "/birthday-parties", description: "Celebrate with us!" },
  { name: "Homeschool", path: "/homeschool", description: "Noon classes daily" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);
  const { t } = useLanguage();

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPrograms = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsProgramsOpen(true);
  }, []);

  const scheduleClosePrograms = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setIsProgramsOpen(false), 150);
  }, []);

  const cancelClosePrograms = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);
  const [isMobileProgramsOpen, setIsMobileProgramsOpen] = useState(false);
  const [isMobileLocationsOpen, setIsMobileLocationsOpen] = useState(false);

  const MOBILE_LOCATIONS = [
    {
      id: 'tomball',
      name: 'MyDojo Tomball HQ',
      address: '11721 Spring Cypress Rd, Tomball TX',
      scheduleUrl: '/locations/tomball#schedule',
      detailUrl: '/locations/tomball',
      badge: 'Main Location',
    },
    {
      id: 'yaegers-sda',
      name: "Yaeger's Self Defense",
      address: '306 E Pasadena Blvd, Deer Park TX',
      scheduleUrl: '/locations/yaegers-sda#schedule',
      detailUrl: '/locations/yaegers-sda',
      badge: 'Affiliate',
    },
    {
      id: 'nokc-belle-chasse',
      name: 'New Orleans Karate Club',
      address: '1510 LA-406, Belle Chasse LA',
      scheduleUrl: '/locations/nokc-belle-chasse#schedule',
      detailUrl: '/locations/nokc-belle-chasse',
      badge: 'Affiliate',
    },
  ];
  const [location] = useLocation();
  const isHome = location === "/";
  const { closestLocation } = useLocationContext();

  // Auto-popup removed per user request
  const { isAuthenticated, user } = useAuth();
  const programsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const headerHeight = 80;

      setIsScrolled(scrollY > 50);

      if (isHome) {
        setIsSticky(scrollY >= windowHeight - headerHeight);
      } else {
        setIsSticky(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProgramsOpen(false);
    setIsMobileProgramsOpen(false);
  }, [location]);

  // Close programs dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (programsRef.current && !programsRef.current.contains(e.target as Node)) {
        setIsProgramsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks: { name: string; path: string; external?: boolean }[] = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "Testimonials", path: "/testimonials" },
    { name: "About", path: "/about" },
    { name: "Shop", path: "/shop" },
    { name: "Contact", path: "/contact" },
    { name: "Learning Center", path: "/blog" },
  ];

  const isOnPrograms = location === "/programs" || location === "/summer-camp" || location === "/homeschool" || location.startsWith("/programs");

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Top Bar */}
      <div className={cn(
        "py-2 px-4 text-xs md:text-sm hidden md:block z-50 transition-all duration-300",
        isHome ? "absolute top-[var(--cookie-banner-height,0px)] w-full bg-transparent text-white" : "bg-black text-white"
      )}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <PhoneChooser className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="h-3 w-3 text-primary" />
              (877) 4-MYDOJO
            </PhoneChooser>
            <Link href={closestLocation ? `/locations/${closestLocation.id}` : "/locations"} className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
              <MapPin className="h-3 w-3 text-primary" />
              {closestLocation ? `Find a Location in ${closestLocation.city}` : "Find a Location"}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/MyDojoFitnessClubs/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Facebook className="h-3 w-3" /></a>
            <a href="https://www.instagram.com/mydojo/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Instagram className="h-3 w-3" /></a>
            <a href="https://www.tiktok.com/@mydojous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <a href="https://www.youtube.com/@mydojomartialartsfitness3287" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Youtube className="h-3 w-3" /></a>
            <div className="ml-2 border-l border-white/20 pl-3">
              <LanguageToggle variant="desktop" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only top bar: always visible on home page hero so hamburger is never hidden */}
      {isHome && !isSticky && (
        <div className="md:hidden fixed top-[var(--cookie-banner-height,0px)] left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm">
          <Link href="/">
            <img src="/images/logo-icon-white.99cb4daa.webp" alt="MyDojo" className="h-8 w-auto object-contain" />
          </Link>
          <button
            className="p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}

      {/* Navigation */}
      <header
        className={cn(
          "w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          // On mobile home page, hide the desktop nav bar (MobileHome has its own sticky bar)
          isHome && !isSticky ? "md:block" : "",
          isHome
            ? (isSticky
              ? "fixed top-[var(--cookie-banner-height,0px)] bg-white/95 backdrop-blur-md text-black shadow-lg py-2 translate-y-0"
              : "absolute top-[100vh] -translate-y-full bg-white/10 backdrop-blur-md border-t border-white/20 text-white py-6 hidden")
            : "fixed top-[var(--cookie-banner-height,0px)] bg-white/95 backdrop-blur-md text-black shadow-lg py-2"
        )}
      >
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative overflow-hidden">
                <div className={cn(
                  "relative transition-all duration-700",
                  isSticky ? "h-10" : "h-12 md:h-14"
                )}>
                  <img
                    src="/images/logo-full-black.webp"
                    alt="MyDojo Logo"
                    className={cn(
                      "h-full w-auto object-contain transition-opacity duration-300",
                      (isHome && !isSticky) ? "opacity-0 absolute top-0 left-0" : "opacity-100"
                    )}
                  />
                  <img
                    src="/images/logo-icon-white.99cb4daa.webp"
                    alt="MyDojo Logo"
                    className={cn(
                      "h-full w-auto object-contain transition-opacity duration-300",
                      (isHome && !isSticky) ? "opacity-100" : "opacity-0 absolute top-0 left-0"
                    )}
                  />
                  <span className="sr-only">MyDojo</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">

            {/* Programs Dropdown */}
            <div className="relative" ref={programsRef}>
              <button
                onMouseEnter={openPrograms}
                onMouseLeave={scheduleClosePrograms}
                onClick={() => setIsProgramsOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 text-sm font-bold uppercase tracking-wider cursor-pointer hover:text-primary transition-all duration-300 relative group",
                  isOnPrograms ? "text-primary" : "",
                  (isHome && !isSticky) ? "text-white" : "text-black"
                )}
              >
                Programs
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  isProgramsOpen ? "rotate-180" : ""
                )} />
                <span className={cn(
                  "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                  isOnPrograms ? "w-full" : ""
                )} />
              </button>

              {/* Invisible hover bridge fills the gap between button and panel */}
              <div
                onMouseEnter={cancelClosePrograms}
                onMouseLeave={scheduleClosePrograms}
                className="absolute top-full left-0 right-0 h-3"
                aria-hidden="true"
              />

              {/* Dropdown Panel */}
              <div
                onMouseEnter={cancelClosePrograms}
                onMouseLeave={scheduleClosePrograms}
                className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top",
                  isProgramsOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
                )}
              >
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                <div className="py-2">
                  {PROGRAM_LINKS.map((prog) => (
                    <Link key={prog.path} href={prog.path}>
                      <div className={cn(
                        "flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer group/item",
                        location === prog.path ? "bg-primary/5" : ""
                      )}>
                        <div>
                          <p className={cn(
                            "text-sm font-bold text-gray-900 group-hover/item:text-primary transition-colors",
                            location === prog.path ? "text-primary" : ""
                          )}>
                            {prog.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{prog.description}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/item:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1 pb-1 px-3">
                    <Link href="/programs">
                      <div className="flex items-center justify-center gap-1 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors cursor-pointer">
                        View All Programs
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Other nav links */}
            {navLinks.map((link, index) => (
              link.external ? (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider cursor-pointer hover:text-primary transition-all duration-500 relative group inline-block",
                      (isHome && !isSticky) ? "text-white" : "text-black",
                      isSticky ? "translate-y-0 opacity-100" : "translate-y-0 opacity-90"
                    )}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </a>
              ) : (
                <Link key={link.path} href={link.path}>
                  <span
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider cursor-pointer hover:text-primary transition-all duration-500 relative group inline-block",
                      location === link.path ? "text-primary" : "",
                      (isHome && !isSticky) ? "text-white" : "text-black",
                      isSticky ? "translate-y-0 opacity-100" : "translate-y-0 opacity-90"
                    )}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {link.name}
                    <span className={cn(
                      "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                      location === link.path ? "w-full" : ""
                    )} />
                  </span>
                </Link>
              )
            ))}

            {isAuthenticated && (
              <Link href="/dashboard">
                <span
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider cursor-pointer hover:text-primary transition-all duration-300 relative group inline-flex items-center gap-2",
                    location === "/dashboard" ? "text-primary" : "",
                    (isHome && !isSticky) ? "text-white" : "text-black"
                  )}
                >
                  <User className="h-4 w-4" />
                  My Account
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                    location === "/dashboard" ? "w-full" : ""
                  )} />
                </span>
              </Link>
            )}

            <Button
              onClick={openIntakeChatbot}
              className={cn(
                "bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider text-sm skew-x-[-10deg] transition-all duration-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                isSticky ? "py-2 px-6 text-xs h-10" : "py-4 px-8 h-14 text-base"
              )}
            >
              <span className="skew-x-[10deg]">Join Now</span>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className={cn(
              "md:hidden p-2",
              (isMobileMenuOpen || isSticky) ? "text-black" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

      </header>

      {/* Mobile Nav Overlay - outside header so it always renders at viewport level */}
      <div className={cn(
        "md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity duration-300",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsMobileMenuOpen(false)} />

      <div
        className="md:hidden fixed top-[calc(56px+var(--cookie-banner-height,0px))] left-0 w-full bg-white text-black shadow-lg z-[70] transition-transform duration-300 ease-out transform border-t border-gray-100"
        style={{
          transform: isMobileMenuOpen ? "translateY(0)" : "translateY(-150%)",
          visibility: isMobileMenuOpen ? "visible" : "hidden"
        }}
      >
        {/* fake-header-close */}
          <div className="flex flex-col p-6 gap-1 max-h-[80vh] overflow-y-auto">

            {/* Programs accordion */}
            <div>
              <button
                className={cn(
                  "w-full flex items-center justify-between text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center",
                  isOnPrograms ? "text-primary" : ""
                )}
                onClick={() => setIsMobileProgramsOpen((v) => !v)}
              >
                <span className="flex-1 text-center">Programs</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isMobileProgramsOpen ? "rotate-180" : ""
                )} />
              </button>
              {isMobileProgramsOpen && (
                <div className="bg-gray-50 rounded-lg mt-1 mb-2 overflow-hidden">
                  {PROGRAM_LINKS.map((prog) => (
                    <Link key={prog.path} href={prog.path}>
                      <div
                        className={cn(
                          "flex items-center justify-between px-5 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-100 transition-colors",
                          location === prog.path ? "text-primary" : ""
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div>
                          <p className="font-bold text-sm">{prog.name}</p>
                          <p className="text-xs text-gray-400">{prog.description}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Locations dropdown */}
            <div>
              <button
                className="w-full flex items-center justify-between text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100"
                onClick={() => setIsMobileLocationsOpen(!isMobileLocationsOpen)}
              >
                <span className="flex-1 text-center">Locations</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isMobileLocationsOpen ? "rotate-180" : ""
                )} />
              </button>
              {isMobileLocationsOpen && (
                <div className="bg-gray-50 rounded-lg mt-1 mb-2 overflow-hidden">
                  {MOBILE_LOCATIONS.map((loc) => (
                    <div key={loc.id} className="border-b border-gray-100 last:border-0">
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{loc.badge}</span>
                        <p className="font-bold text-sm mt-0.5">{loc.name}</p>
                        <p className="text-xs text-gray-400 mb-2">{loc.address}</p>
                      </div>
                      <div className="flex gap-2 px-4 pb-3">
                        <Link href={loc.scheduleUrl}>
                          <button
                            className="flex-1 text-xs font-bold uppercase tracking-wider bg-black text-white rounded px-3 py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Schedule
                          </button>
                        </Link>
                        <Link href={loc.detailUrl}>
                          <button
                            className="flex-1 text-xs font-bold uppercase tracking-wider border border-primary text-primary rounded px-3 py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link href="/locations">
                    <div
                      className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-primary cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Find All Locations
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Other nav links */}
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.path}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="block text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center">
                    {link.name}
                  </span>
                </a>
              ) : (
                <Link key={link.path} href={link.path}>
                  <span
                    className={cn(
                      "block text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center",
                      location === link.path ? "text-primary" : ""
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </span>
                </Link>
              )
            ))}

            {isAuthenticated ? (
              <Link href="/dashboard">
                <span
                  className={cn(
                    "flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center",
                    location === "/dashboard" ? "text-primary" : ""
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  My Account
                </span>
              </Link>
            ) : (
              <a
                href={getLoginUrl()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center">
                  <User className="h-5 w-5" />
                  Student Login
                </span>
              </a>
            )}

            <Link href="/check-in">
              <span
                className={cn(
                  "flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center text-primary",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kiosk Check-In
              </span>
            </Link>

            {/* Language toggle in mobile menu */}
            <div className="py-2 border-b border-gray-100">
              <LanguageToggle variant="mobile" />
            </div>

            <Link href="/admin/login">
              <span
                className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider py-3 border-b border-gray-100 text-center text-gray-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Shield className="h-4 w-4" />
                Staff Portal
              </span>
            </Link>

            <Button
              onClick={() => {
                openIntakeChatbot();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-primary text-white font-heading uppercase mt-4 py-6 text-lg"
            >
              {t("nav.join")}
            </Button>
            <Button
              variant="ghost"
              className="mt-2 text-gray-500"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t("general.close")}
            </Button>
          </div>
        </div>

      <CookieBanner />
      {/* Auto-popups removed per user request */}

      {/* Main Content */}
      <main className="flex-grow pt-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block bg-black text-white pt-16 pb-8 sm:pb-8 pb-safe border-t border-white/10" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-6">
                <img src="/images/logo-icon-white.99cb4daa.webp" alt="MyDojo Logo" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t("footer.tagline")}
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/MyDojoFitnessClubs/" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-primary transition-colors"><Facebook className="h-4 w-4" /></a>
                <a href="https://www.instagram.com/mydojo/" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-primary transition-colors"><Instagram className="h-4 w-4" /></a>
                <a href="https://www.tiktok.com/@mydojous" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-primary transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                </a>
                <a href="https://www.youtube.com/@mydojomartialartsfitness3287" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-primary transition-colors"><Youtube className="h-4 w-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold mb-6 text-primary">{t("footer.programs")}</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/programs#little-ninjas"><span className="hover:text-white cursor-pointer transition-colors">Little Ninjas (3-5)</span></Link></li>
                <li><Link href="/programs#dragon-kids"><span className="hover:text-white cursor-pointer transition-colors">Dragon Kids (5-12)</span></Link></li>
                <li><Link href="/programs#teens-adults"><span className="hover:text-white cursor-pointer transition-colors">Teens &amp; Adults (13+)</span></Link></li>
                <li><Link href="/programs#kickboxing"><span className="hover:text-white cursor-pointer transition-colors">Kickboxing</span></Link></li>
                <li><Link href="/programs#after-school"><span className="hover:text-white cursor-pointer transition-colors">After School</span></Link></li>
                <li><Link href="/summer-camp"><span className="hover:text-white cursor-pointer transition-colors">Summer Camp</span></Link></li>
                <li><Link href="/birthday-parties"><span className="hover:text-white cursor-pointer transition-colors">Birthday Parties</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold mb-6 text-primary">{t("footer.quick_links")}</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/locations"><span className="hover:text-white cursor-pointer transition-colors">Class Schedule</span></Link></li>
                <li><Link href="/events"><span className="hover:text-white cursor-pointer transition-colors">Upcoming Events</span></Link></li>
                <li><Link href="/about"><span className="hover:text-white cursor-pointer transition-colors">About Us</span></Link></li>
                <li><Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact Us</span></Link></li>
                <li><Link href="/careers"><span className="hover:text-white cursor-pointer transition-colors">Careers</span></Link></li>
                <li><Link href="/check-in"><span className="hover:text-white cursor-pointer transition-colors font-semibold text-primary">Kiosk Check-In</span></Link></li>
                <li>
                  <span
                    onClick={() => {
                      if (isAuthenticated) {
                        window.location.href = "/dashboard";
                      } else {
                        window.location.href = getLoginUrl();
                      }
                    }}
                    className="hover:text-white cursor-pointer transition-colors font-semibold text-primary"
                  >
                    Student Login
                  </span>
                </li>
                <li>
                  <a
                    href="/admin/login"
                    className="hover:text-white cursor-pointer transition-colors text-gray-400 text-sm"
                  >
                    Staff / Instructor Login
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg font-bold mb-6 text-primary">{t("footer.contact")}</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <PhoneChooser className="flex items-start gap-3 hover:text-white transition-colors">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>(877) 4-MYDOJO<br />(877) 469-3656</span>
                  </PhoneChooser>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <Link href="/locations">
                    <span className="hover:text-white cursor-pointer transition-colors">{t("nav.find_location")}</span>
                  </Link>
                </li>
                <li>
                  <Button
                    onClick={openIntakeChatbot}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white hover:text-black mt-2"
                  >
                    {t("locations.book_trial")}
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          {/* Notification Subscribe Widget */}
          <div className="mb-12">
            <NotificationSubscribe />
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>
              &copy; 2025 MyDojo Martial Arts &amp; Fitness LLC. {t("footer.rights")}
              {/* Inconspicuous admin access — blends into copyright text */}
              <a href="/admin/login" className="ml-1 opacity-0 hover:opacity-20 transition-opacity duration-300 text-gray-600" tabIndex={-1} aria-hidden="true">&bull;</a>
            </p>
            <div className="flex gap-6">
              <Link href="/privacy-policy"><span className="hover:text-white transition-colors cursor-pointer">{t("footer.privacy")}</span></Link>
              <Link href="/terms-of-service"><span className="hover:text-white transition-colors cursor-pointer">{t("footer.terms")}</span></Link>
              <a href="#" className="hover:text-white transition-colors">DMCA Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
