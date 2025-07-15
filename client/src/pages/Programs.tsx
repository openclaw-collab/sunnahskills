import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, TreePine, Shield, Clock, Medal, Heart, Calendar, Eye, Compass, Ribbon, Flame } from "lucide-react";
import { RegistrationModal } from "@/components/RegistrationModal";
import { getProgramSchema } from "@/lib/programSchemas";

const Programs = () => {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRegister = (programId: string) => {
    setSelectedProgram(programId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProgram(null);
  };

  const programs = [
    {
      id: "bjj",
      title: "Brazilian Jiu-Jitsu",
      icon: <Users className="text-primary" size={32} />,
      image: "https://plus.unsplash.com/premium_photo-1713170701344-41076b018b59?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmpqJTIwYmVsdHxlbnwwfHwwfHx8MA%3D%3D",
      description: "Our BJJ program teaches ground-based grappling techniques that emphasize leverage, technique, and strategy over strength. Students learn valuable life skills including patience, persistence, and problem-solving while developing physical fitness and self-confidence.",
      features: [
        { icon: <Users size={20} />, text: "Separate boys' and girls' classes" },
        { icon: <Clock size={20} />, text: "Ages 6-17, grouped by age and skill level" },
        { icon: <Medal size={20} />, text: "Belt progression system with regular testing" },
        { icon: <Heart size={20} />, text: "Focus on respect, discipline, and character building" },
      ]
    },
    {
      id: "archery",
      title: "Seasonal Archery",
      icon: <Target className="text-primary" size={32} />,
      image: "https://images.unsplash.com/photo-1666816584311-ba40d5299760",
      description: "Traditional archery instruction during summer and fall seasons. Students learn proper form, safety protocols, and mental focus while connecting with this ancient skill. Our program emphasizes mindfulness, concentration, and the satisfaction of steady improvement.",
      features: [
        { icon: <Calendar size={20} />, text: "Summer and fall seasonal sessions" },
        { icon: <Shield size={20} />, text: "Comprehensive safety training included" },
        { icon: <Target size={20} />, text: "Progressive skill development with traditional bows" },
        { icon: <Eye size={20} />, text: "Mental focus and concentration training" },
      ]
    },
    {
      id: "outdoor",
      title: "Outdoor Workshops",
      icon: <TreePine className="text-primary" size={32} />,
      image: "https://images.unsplash.com/photo-1610029632807-589f1f0d7673?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2lsZGVybmVzcyUyMHNraWxsJTIwYnVpbGRpbmclMjBmaXJlJTIwbWF0Y2h8ZW58MHx8MHx8fDA%3D",
      description: "Hands-on wilderness education that teaches practical outdoor skills while fostering a deep connection with nature. Students gain confidence, problem-solving abilities, and environmental awareness through engaging, project-based learning experiences.",
      features: [
        { icon: <Flame size={20} />, text: "Fire building techniques and safety" },
        { icon: <Ribbon size={20} />, text: "Essential knot tying and rope work" },
        { icon: <TreePine size={20} />, text: "Shelter building and outdoor construction" },
        { icon: <Compass size={20} />, text: "Navigation skills and orienteering" },
      ]
    },
    {
      id: "bullyproofing",
      title: "Bullyproofing Workshops",
      icon: <Shield className="text-primary" size={32} />,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
      description: "Empowering workshops that teach children how to set boundaries, recognize dangerous situations, and use basic grappling techniques for self-protection. Our approach emphasizes de-escalation, verbal assertiveness, and building unshakeable confidence.",
      features: [
        { icon: <Users size={20} />, text: "Verbal boundary setting and assertiveness" },
        { icon: <Eye size={20} />, text: "Situational awareness and threat recognition" },
        { icon: <Shield size={20} />, text: "Basic grappling and distance control" },
        { icon: <Heart size={20} />, text: "Confidence building and self-esteem development" },
      ]
    },
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-poppins font-bold text-4xl md:text-5xl text-gray-800 mb-4">
            Our Programs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive programs designed to build character, confidence, and practical skills in young people
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {programs.map((program) => (
            <Card key={program.id} className="bg-lightBeige shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <img 
                src={program.image} 
                alt={program.title}
                className="w-full h-64 object-cover"
              />
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {program.icon}
                  <h3 className="font-poppins font-bold text-2xl text-gray-800 ml-3">
                    {program.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  {program.description}
                </p>
                <div className="space-y-3">
                  {program.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-earthGreen">
                      {feature.icon}
                      <span className="text-gray-700 ml-3">{feature.text}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button 
                    onClick={() => handleRegister(program.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
                  >
                    Register for {program.title}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Registration Modal */}
      {selectedProgram && (
        <RegistrationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          program={getProgramSchema(selectedProgram)!}
        />
      )}
    </div>
  );
};

export default Programs;
