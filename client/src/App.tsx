import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Programs from "@/pages/Programs";
import BJJProgram from "@/pages/programs/BJJProgram";
import ArcheryProgram from "@/pages/programs/ArcheryProgram";
import OutdoorWorkshopsProgram from "@/pages/programs/OutdoorWorkshopsProgram";
import BullyproofingProgram from "@/pages/programs/BullyproofingProgram";
import Schedule from "@/pages/Schedule";

import Testimonials from "@/pages/Testimonials";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import Admin from "@/pages/Admin";

function Router() {
  return (
    <div className="min-h-screen bg-lightBeige">
      <Navigation />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/programs" component={Programs} />
          <Route path="/programs/bjj" component={BJJProgram} />
          <Route path="/programs/archery" component={ArcheryProgram} />
          <Route path="/programs/outdoor-workshops" component={OutdoorWorkshopsProgram} />
          <Route path="/programs/bullyproofing" component={BullyproofingProgram} />
          <Route path="/schedule" component={Schedule} />

          <Route path="/testimonials" component={Testimonials} />
          <Route path="/contact" component={Contact} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
