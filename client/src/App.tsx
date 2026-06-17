import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocationProvider } from "./contexts/LocationContext";
import { ChatbotProvider } from "./contexts/ChatbotContext";
import Layout from "./components/Layout";
import { StructuredData } from "./components/StructuredData";


// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Programs = lazy(() => import("./pages/Programs"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Events = lazy(() => import("./pages/Events"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Locations = lazy(() => import("./pages/Locations"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));
const Careers = lazy(() => import("./pages/Careers"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SummerCamp = lazy(() => import("./pages/SummerCamp"));
const SummerCampEnroll = lazy(() => import("./pages/SummerCampEnroll"));
const SummerCampForms = lazy(() => import("./pages/SummerCampForms"));
const SummerCampOpenHouse = lazy(() => import("./pages/SummerCampOpenHouse"));
const LeadCapture = lazy(() => import("./pages/LeadCapture"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Kickboxing = lazy(() => import("./pages/Kickboxing"));
const Homeschool = lazy(() => import("./pages/Homeschool"));
const Waiver = lazy(() => import("./pages/Waiver"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard2"));
const InstructorDashboard = lazy(() => import("./pages/InstructorDashboard"));
const AdminMembershipRequests = lazy(() => import("./pages/AdminMembershipRequests"));
const AdminEnrollments = lazy(() => import("./pages/AdminEnrollments"));
const EnrollmentSuccess = lazy(() => import("./pages/EnrollmentSuccess"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const KioskCheckIn = lazy(() => import("./pages/KioskCheckIn"));
const KioskArcade = lazy(() => import("./pages/KioskArcade"));
const IntroOfferCheckout = lazy(() => import("./pages/IntroOfferCheckout"));
const FamilyEnrollment = lazy(() => import("./pages/FamilyEnrollment"));
const TestPayment = lazy(() => import("./pages/TestPayment"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminIntroAppointments = lazy(() => import("./pages/AdminIntroAppointments"));
const AdminStudents = lazy(() => import("./pages/AdminStudents"));
const AdminAttendance = lazy(() => import("./pages/AdminAttendance"));
const AdminClasses = lazy(() => import("./pages/AdminClasses"));
const AdminMilestones = lazy(() => import("./pages/AdminMilestones"));
const AdminStaff = lazy(() => import("./pages/AdminStaff"));
const AdminStaffSchedule = lazy(() => import("./pages/AdminStaffSchedule"));
const AdminSocialMedia = lazy(() => import("./pages/AdminSocialMedia"));
const AdminPromoBlast = lazy(() => import("./pages/AdminPromoBlast"));
const AdminCalendar = lazy(() => import("./pages/AdminCalendar"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBilling = lazy(() => import("./pages/AdminBilling"));
const AdminPackages = lazy(() => import("./pages/AdminPackages"));
const StaffInviteAccept = lazy(() => import("./pages/StaffInviteAccept"));
const AdminCommissions = lazy(() => import("./pages/AdminCommissions"));
const StaffClockIn = lazy(() => import("./pages/StaffClockIn"));
const AdminStaffHours = lazy(() => import("./pages/AdminStaffHours"));
const AdminFamilyGroups = lazy(() => import("./pages/AdminFamilyGroups"));
const AdminPnoRsvps = lazy(() => import("./pages/AdminPnoRsvps"));
const AdminCampEnrollments = lazy(() => import("./pages/AdminCampEnrollments"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IntroOfferSuccess = lazy(() => import("./pages/IntroOfferSuccess"));
const Join = lazy(() => import("./pages/Join"));
const BuyDayPass = lazy(() => import("./pages/BuyDayPass"));
const Enroll = lazy(() => import("./pages/Enroll"));
const ParentsNightOut = lazy(() => import("./pages/ParentsNightOut"));
const BirthdayParties = lazy(() => import("./pages/BirthdayParties"));
const PrivateLessons = lazy(() => import("./pages/PrivateLessons"));
const PrivateLessonsSuccess = lazy(() => import("./pages/PrivateLessonsSuccess"));
const AdminFacebookAds = lazy(() => import("./pages/AdminFacebookAds"));
const AdminBillingSchedule = lazy(() => import("./pages/AdminBillingSchedule"));
const Shop = lazy(() => import("./pages/Shop"));
const BuddyDay = lazy(() => import("./pages/BuddyDay"));
const AdminBuddyDay = lazy(() => import("./pages/AdminBuddyDay"));
const ClassSignup = lazy(() => import("./pages/ClassSignup"));
const AdminClassRoster = lazy(() => import("./pages/AdminClassRoster"));
const AdminManualEnrollment = lazy(() => import("./pages/AdminManualEnrollment"));
const AdminCustomPayments = lazy(() => import("./pages/AdminCustomPayments"));
const CustomPaymentCheckout = lazy(() => import("./pages/CustomPaymentCheckout"));
const SmsConversations = lazy(() => import("./pages/admin/SmsConversations"));

// Loading component — subtle fade-in bar at the top, no jarring red circle
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    {/* Top progress bar */}
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
      <div
        className="h-full bg-[#E10600]"
        style={{
          animation: "pageload-bar 1.2s ease-in-out infinite",
          width: "60%",
          marginLeft: "-10%",
        }}
      />
    </div>
    {/* Centered logo mark */}
    <div className="flex flex-col items-center gap-3 opacity-80">
      <img
        src="/images/logo-full-black.webp"
        alt="MyDojo"
        className="h-14 w-auto"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
    <style>{`
      @keyframes pageload-bar {
        0%   { transform: translateX(-100%); }
        50%  { transform: translateX(100%); }
        100% { transform: translateX(300%); }
      }
    `}</style>
  </div>
);
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Separate routes without Layout */}
        <Route path="/join" component={Join} />
        <Route path="/enroll" component={Enroll} />
        <Route path="/summer-camp/enroll" component={SummerCampEnroll} />
        <Route path="/summer-camp/forms" component={SummerCampForms} />
        <Route path="/buy-day-pass" component={BuyDayPass} />
        <Route path="/instructor" component={InstructorDashboard} />
        <Route path="/check-in" component={KioskCheckIn} />
        <Route path="/arcade" component={KioskArcade} />
        <Route path="/intro-offer" component={IntroOfferCheckout} />
        <Route path="/intro-offer-success" component={IntroOfferSuccess} />
        <Route path="/family-enrollment" component={FamilyEnrollment} />
        <Route path="/parents-night-out" component={ParentsNightOut} />
        <Route path="/private-lessons" component={PrivateLessons} />
        <Route path="/private-lessons/success" component={PrivateLessonsSuccess} />
        <Route path="/test-payment" component={TestPayment} />
        
        {/* Student dashboard without Layout */}
        <Route path="/dashboard" component={MemberDashboard} />

        {/* Admin routes without Layout */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/intro-appointments" component={AdminIntroAppointments} />
        <Route path="/admin/students" component={AdminStudents} />
        <Route path="/admin/attendance" component={AdminAttendance} />
        <Route path="/admin/classes" component={AdminClasses} />
        <Route path="/admin/milestones" component={AdminMilestones} />
        <Route path="/admin/staff" component={AdminStaff} />
        <Route path="/admin/staff-schedule" component={AdminStaffSchedule} />
        <Route path="/admin/social-media" component={AdminSocialMedia} />
        <Route path="/admin/promo-blast" component={AdminPromoBlast} />
        <Route path="/admin/calendar" component={AdminCalendar} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/audit-log" component={AdminAuditLog} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/billing" component={AdminBilling} />
        <Route path="/admin/packages" component={AdminPackages} />
        <Route path="/staff-invite" component={StaffInviteAccept} />
        <Route path="/admin/commissions" component={AdminCommissions} />
        <Route path="/admin/staff-hours" component={AdminStaffHours} />
        <Route path="/admin/family-groups" component={AdminFamilyGroups} />
        <Route path="/admin/pno-rsvps" component={AdminPnoRsvps} />
        <Route path="/admin/camp-enrollments" component={AdminCampEnrollments} />
        <Route path="/admin/facebook-ads" component={AdminFacebookAds} />
        <Route path="/admin/billing-schedule" component={AdminBillingSchedule} />
        <Route path="/admin/class-roster" component={AdminClassRoster} />
        <Route path="/admin/buddy-day" component={AdminBuddyDay} />
        <Route path="/admin/manual-enrollment" component={AdminManualEnrollment} />
        <Route path="/admin/custom-payments" component={AdminCustomPayments} />
        <Route path="/admin/sms" component={SmsConversations} />
        <Route path="/pay/:token" component={CustomPaymentCheckout} />
        <Route path="/classes" component={ClassSignup} />
        <Route path="/staff-clock-in" component={StaffClockIn} />
        
        {/* All other routes with Layout */}
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/programs" component={Programs} />
              <Route path="/programs/kickboxing" component={Kickboxing} />
              <Route path="/homeschool" component={Homeschool} />
              <Route path="/waiver" component={Waiver} />
              <Route path="/programs/:slug" component={ProgramDetail} />
              <Route path="/summer-camp/open-house" component={SummerCampOpenHouse} />
              <Route path="/summer-camp" component={SummerCamp} />
              <Route path="/birthday-parties" component={BirthdayParties} />
              <Route path="/trial" component={LeadCapture} />
              <Route path="/schedule" component={Schedule} />
              <Route path="/events" component={Events} />
              <Route path="/testimonials" component={Testimonials} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/shop" component={Shop} />
              <Route path="/buddy-day" component={BuddyDay} />
              <Route path="/locations" component={Locations} />
              <Route path="/locations/:id" component={LocationDetail} />
              <Route path="/careers" component={Careers} />
              <Route path="/blog" component={Blog} />
              <Route path="/blog/:slug" component={BlogPost} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms-of-service" component={TermsOfService} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/settings/notifications" component={NotificationSettings} />
              <Route path="/notifications" component={NotificationHistory} />
              <Route path="/admin/membership-requests" component={AdminMembershipRequests} />
              <Route path="/admin/enrollments" component={AdminEnrollments} />
              <Route path="/enrollment/success" component={EnrollmentSuccess} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  // Secret keyboard shortcut: Shift+A pressed 3 times redirects to admin login
  useEffect(() => {
    let shiftACount = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.shiftKey && e.key === 'A') {
        shiftACount++;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => { shiftACount = 0; }, 1500);
        if (shiftACount >= 3) {
          shiftACount = 0;
          window.location.href = '/admin/login';
        }
      } else {
        shiftACount = 0;
        if (resetTimer) clearTimeout(resetTimer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocationProvider>
          <ChatbotProvider>
            <TooltipProvider>
              <StructuredData type="LocalBusiness" />
              <Toaster />
              <Router />
            </TooltipProvider>
          </ChatbotProvider>
        </LocationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
