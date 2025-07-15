import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, TreePine, Shield } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 hero-bg"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-white" size={32} />
              </div>
              <h1 className="font-poppins font-bold text-4xl md:text-6xl text-gray-800 mb-4">
                Sunnah Skills
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 font-medium">
                Youth Martial Arts & Outdoor Programs
              </p>
            </div>
            
            <div className="mb-8">
              <h2 className="font-poppins font-semibold text-2xl md:text-3xl text-gray-800 mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Building confident, skilled, and resilient young people through traditional martial arts, 
                outdoor education, and character development. We combine Brazilian Jiu-Jitsu, archery, 
                wilderness skills, and bullyproofing techniques to help children develop both physical 
                and mental strength in a safe, supportive environment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-accent/50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <Users className="text-primary mx-auto mb-4" size={32} />
                  <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-2">
                    Brazilian Jiu-Jitsu
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ground-based grappling for all skill levels
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <Target className="text-primary mx-auto mb-4" size={32} />
                  <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-2">
                    Archery
                  </h3>
                  <p className="text-sm text-gray-600">
                    Traditional archery skills and focus training
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <TreePine className="text-primary mx-auto mb-4" size={32} />
                  <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-2">
                    Outdoor Skills
                  </h3>
                  <p className="text-sm text-gray-600">
                    Wilderness survival and outdoor education
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-accent/50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <Shield className="text-primary mx-auto mb-4" size={32} />
                  <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-2">
                    Bullyproofing
                  </h3>
                  <p className="text-sm text-gray-600">
                    Confidence and self-defense training
                  </p>
                </CardContent>
              </Card>
            </div>

            <Link href="/programs">
              <Button 
                size="lg" 
                className="bg-primary text-white font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Explore Our Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
