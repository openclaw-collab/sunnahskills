import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Programs from "@/pages/Programs.tsx";
import BJJProgram from "@/pages/programs/BJJProgram";
import ArcheryProgram from "@/pages/programs/ArcheryProgram";
import OutdoorWorkshopsProgram from "@/pages/programs/OutdoorWorkshopsProgram";
import BullyproofingProgram from "@/pages/programs/BullyproofingProgram";
import SwimmingProgram from "@/pages/programs/SwimmingProgram";
import HorsebackProgram from "@/pages/programs/HorsebackProgram";
import Schedule from "@/pages/Schedule";

import Testimonials from "@/pages/Testimonials";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSequences from "@/pages/admin/AdminSequences";
import AdminUsers from "@/pages/admin/AdminUsers";
import BJJRegistration from "@/pages/registration/BJJRegistration";
import ArcheryRegistration from "@/pages/registration/ArcheryRegistration";
import OutdoorRegistration from "@/pages/registration/OutdoorRegistration";
import BullyproofingRegistration from "@/pages/registration/BullyproofingRegistration";
import SwimmingRegistration from "@/pages/registration/SwimmingRegistration";
import HorsebackRegistration from "@/pages/registration/HorsebackRegistration";
import RegistrationSuccess from "@/pages/registration/RegistrationSuccess";
import RegistrationCancel from "@/pages/registration/RegistrationCancel";
import RegistrationPending from "@/pages/registration/RegistrationPending";
import RegistrationWaitlist from "@/pages/registration/RegistrationWaitlist";
import TechniqueLibrary from "@/pages/TechniqueLibrary";
import About from "@/pages/About";
import RegistrationHub from "@/pages/RegistrationHub";
import CartPage from "@/pages/registration/CartPage";
import TrialPage from "@/pages/TrialPage";
import { StudioProvider } from "@/studio/StudioProvider";
import StudioPanel from "@/studio/StudioPanel";

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-cream">
      {!isAdminRoute ? <Navigation /> : null}
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/trial" component={TrialPage} />
          <Route path="/programs" component={Programs} />
          <Route path="/register" component={RegistrationHub} />
          <Route path="/registration/cart" component={CartPage} />
          <Route path="/programs/bjj" component={BJJProgram} />
          <Route path="/programs/swimming" component={SwimmingProgram} />
          <Route path="/programs/horseback" component={HorsebackProgram} />
          <Route path="/programs/archery" component={ArcheryProgram} />
          <Route path="/programs/outdoor" component={OutdoorWorkshopsProgram} />
          <Route path="/programs/bullyproofing" component={BullyproofingProgram} />
          <Route path="/programs/bjj/register" component={BJJRegistration} />
          <Route path="/programs/swimming/register" component={SwimmingRegistration} />
          <Route path="/programs/horseback/register" component={HorsebackRegistration} />
          <Route path="/programs/archery/register" component={ArcheryRegistration} />
          <Route path="/programs/outdoor/register" component={OutdoorRegistration} />
          <Route path="/programs/bullyproofing/register" component={BullyproofingRegistration} />
          <Route path="/registration/success" component={RegistrationSuccess} />
          <Route path="/registration/cancel" component={RegistrationCancel} />
          <Route path="/registration/pending" component={RegistrationPending} />
          <Route path="/registration/waitlist" component={RegistrationWaitlist} />
          <Route path="/techniques" component={TechniqueLibrary} />
          <Route path="/about" component={About} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/testimonials" component={Testimonials} />
          <Route path="/contact" component={Contact} />
          <Route path="/admin" component={AdminLogin} />
          <Route path="/admin/dashboard/:tab" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/sequences" component={AdminSequences} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAdminRoute ? <Footer /> : null}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StudioProvider>
          <Toaster />
          <Router />
          <StudioPanel />
        </StudioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
