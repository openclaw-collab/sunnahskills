import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRegistrationSchema, type InsertRegistration } from "@shared/schema";
import { Users, Clock, Medal, Heart, Shield, Target } from "lucide-react";

const BJJ = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertRegistration>({
    resolver: zodResolver(insertRegistrationSchema),
    defaultValues: {
      childName: "",
      childAge: "",
      parentName: "",
      phone: "",
      email: "",
      program: "",
      experience: "",
      questions: "",
      waiverAccepted: "false",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const response = await apiRequest("POST", "/api/registrations", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Submitted!",
        description: data.message,
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error submitting your registration. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: InsertRegistration) => {
    setIsSubmitting(true);
    registrationMutation.mutate(data);
  };

  const bjjPrograms = [
    { value: "bjj-kids-boys", label: "BJJ Kids - Boys (Ages 8-13)" },
    { value: "bjj-teens-boys", label: "BJJ Teens/Adults - Boys (Ages 14+)" },
    { value: "bjj-kids-girls", label: "BJJ Kids - Girls (Ages 8-13)" },
    { value: "bjj-teens-girls", label: "BJJ Teens/Adults - Girls (Ages 14+)" },
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Users className="text-primary" size={64} />
          </div>
          <h1 className="font-poppins font-bold text-4xl md:text-5xl text-gray-800 mb-4">
            Brazilian Jiu-Jitsu
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ground-based grappling that builds character, confidence, and practical self-defense skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Program Details */}
          <div>
            <img 
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
              alt="Brazilian Jiu-Jitsu training"
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
            
            <h2 className="font-poppins font-bold text-2xl text-gray-800 mb-4">
              About Our BJJ Program
            </h2>
            <p className="text-gray-600 mb-6">
              Our Brazilian Jiu-Jitsu program teaches ground-based grappling techniques that emphasize 
              leverage, technique, and strategy over strength. Students learn valuable life skills including 
              patience, persistence, and problem-solving while developing physical fitness and self-confidence.
            </p>

            <div className="space-y-4">
              <div className="flex items-center text-earthGreen">
                <Users size={20} />
                <span className="text-gray-700 ml-3">Separate boys' and girls' classes</span>
              </div>
              <div className="flex items-center text-earthGreen">
                <Clock size={20} />
                <span className="text-gray-700 ml-3">Age-appropriate groupings (Kids 8-13, Teens/Adults 14+)</span>
              </div>
              <div className="flex items-center text-earthGreen">
                <Medal size={20} />
                <span className="text-gray-700 ml-3">Belt progression system with regular testing</span>
              </div>
              <div className="flex items-center text-earthGreen">
                <Heart size={20} />
                <span className="text-gray-700 ml-3">Focus on respect, discipline, and character building</span>
              </div>
            </div>

            <div className="mt-8 p-6 bg-accent/30 rounded-lg">
              <h3 className="font-poppins font-semibold text-lg text-gray-800 mb-2">
                What Your Child Will Learn
              </h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Fundamental grappling techniques and positions</li>
                <li>• Self-defense and escape methods</li>
                <li>• Physical fitness and flexibility</li>
                <li>• Mental resilience and problem-solving</li>
                <li>• Respect for training partners and instructors</li>
                <li>• Goal setting through belt progression</li>
              </ul>
            </div>
          </div>

          {/* Registration Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-poppins">
                Register for BJJ Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="childName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child's Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter child's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="childAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child's Age *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 15 }, (_, i) => i + 8).map((age) => (
                                <SelectItem key={age} value={age.toString()}>
                                  {age} years old
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent/Guardian Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter parent/guardian name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="parent@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BJJ Program Selection *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select BJJ program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bjjPrograms.map((program) => (
                              <SelectItem key={program.value} value={program.value}>
                                {program.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Martial Arts Experience (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe any previous martial arts experience..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="questions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Questions or Special Considerations (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any questions or special considerations we should know about..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waiverAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value === "true"}
                            onCheckedChange={(checked) => field.onChange(checked ? "true" : "false")}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I acknowledge that participation in martial arts involves inherent risks, 
                            and I agree to the terms and conditions of participation. A full waiver will be provided upon acceptance. *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={isSubmitting}
                                              className="bg-primary text-white font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      {isSubmitting ? "Submitting..." : "Register for BJJ"}
                    </Button>
                    <p className="text-sm text-gray-600 mt-4">
                      We'll contact you within 24 hours to confirm your registration and provide next steps.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="text-center text-2xl font-poppins">
              BJJ Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-poppins font-bold text-xl text-gray-800 mb-4">Boys' Classes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold">BJJ Kids (Ages 8-13)</p>
                    <p className="text-gray-600">Monday & Wednesday 4:00 PM</p>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold">BJJ Teens/Adults (Ages 14+)</p>
                    <p className="text-gray-600">Monday & Wednesday 5:15 PM</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-poppins font-bold text-xl text-gray-800 mb-4">Girls' Classes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold">BJJ Kids (Ages 8-13)</p>
                    <p className="text-gray-600">Tuesday & Thursday 4:00 PM</p>
                  </div>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold">BJJ Teens/Adults (Ages 14+)</p>
                    <p className="text-gray-600">Tuesday & Thursday 5:15 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BJJ;