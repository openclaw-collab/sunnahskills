import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      child: "Ahmed (12)",
      initials: "SM",
      bgColor: "bg-primary",
      content: "Ahmed has been attending BJJ classes for 8 months, and the transformation has been incredible. His confidence has soared, and he's learned valuable life skills about respect and perseverance. The instructors truly care about character development.",
    },
    {
      name: "Michael Abdullah",
      child: "Fatima (9)",
      initials: "MA",
      bgColor: "bg-earthGreen",
      content: "The outdoor workshops have been amazing for Fatima. She's learned practical skills like fire building and knot tying while developing a deep love for nature. The balance of fun and education is perfect, and she always comes home excited to share what she learned.",
    },
    {
      name: "Layla Hassan",
      child: "Omar (14)",
      initials: "LH",
      bgColor: "bg-secondary",
      content: "The archery program taught Omar focus and patience in a way that nothing else has. The traditional approach and emphasis on mindfulness has helped him in school too. We're so grateful for the positive influence this program has had on our son.",
    },
    {
      name: "Amina Ali",
      child: "Zainab (10)",
      initials: "AA",
      bgColor: "bg-primary",
      content: "The bullyproofing workshop was exactly what Zainab needed. She learned how to set boundaries and gained the confidence to handle difficult situations. The approach is practical and empowering without being aggressive. Highly recommend!",
    },
    {
      name: "Khalid Mohammed",
      child: "Yusuf (7)",
      initials: "KM",
      bgColor: "bg-earthGreen",
      content: "Yusuf was shy and hesitant when he started, but the instructors were so patient and encouraging. Now he's one of the most enthusiastic kids in his BJJ class. The program has built his physical skills and given him a strong sense of community.",
    },
    {
      name: "Fatima Qureshi",
      child: "Maryam (13)",
      initials: "FQ",
      bgColor: "bg-secondary",
      content: "As a mother, I love that Maryam is learning practical life skills while building physical and mental strength. The values-based approach aligns perfectly with what we teach at home. She's become more confident and self-reliant through these programs.",
    },
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-poppins font-bold text-4xl md:text-5xl text-gray-800 mb-4">
            What Families Say
          </h1>
          <p className="text-xl text-gray-600">
            Real stories from our Sunnah Skills community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-lightBeige shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className={`w-12 h-12 ${testimonial.bgColor} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{testimonial.initials}</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">Parent of {testimonial.child}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  {testimonial.content}
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="bg-primary/10 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="font-poppins font-bold text-2xl text-gray-800 mb-4">
                Join Our Community
              </h3>
              <p className="text-gray-700 text-lg mb-6">
                Ready to see your child grow in confidence, skill, and character? 
                Register today and become part of the Sunnah Skills family.
              </p>
              <Link href="/contact">
                <Button 
                  size="lg"
                  className="bg-primary text-white font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
