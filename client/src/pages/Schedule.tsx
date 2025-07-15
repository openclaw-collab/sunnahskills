import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search, Calendar, List, Download, Mail, Users, Clock, MapPin } from "lucide-react";

// Enhanced data structure with more details
interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  program: string;
  ages: string;
  gender: "Boys" | "Girls" | "Mixed";
  instructor: string;
  location: string;
  capacity: number;
  enrolled: number;
  status: "Available" | "Full" | "Waitlist";
  description: string;
  frequency: string;
  programType: "BJJ" | "Archery" | "Outdoor Workshops" | "Bullyproofing";
  color: string;
  icon: string;
}

const Schedule = () => {
  // State for filters
  const [selectedProgram, setSelectedProgram] = useState<string>("All");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedAge, setSelectedAge] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Enhanced schedule data
  const scheduleData: ScheduleItem[] = [
    // Boys' Classes
    {
      id: "b1",
      day: "Monday",
      time: "4:00 PM",
      program: "BJJ Fundamentals",
      ages: "6-10",
      gender: "Boys",
      instructor: "Coach Mike",
      location: "Main Dojo",
      capacity: 15,
      enrolled: 12,
      status: "Available",
      description: "Basic Brazilian Jiu-Jitsu techniques for beginners",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-primary",
      icon: "🥋"
    },
    {
      id: "b2",
      day: "Monday",
      time: "5:15 PM",
      program: "BJJ Advanced",
      ages: "11-17",
      gender: "Boys",
      instructor: "Coach Mike",
      location: "Main Dojo",
      capacity: 12,
      enrolled: 12,
      status: "Full",
      description: "Advanced BJJ techniques and competition training",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-primary",
      icon: "🥋"
    },
    {
      id: "b3",
      day: "Wednesday",
      time: "4:00 PM",
      program: "BJJ Fundamentals",
      ages: "6-10",
      gender: "Boys",
      instructor: "Coach Mike",
      location: "Main Dojo",
      capacity: 15,
      enrolled: 8,
      status: "Available",
      description: "Basic Brazilian Jiu-Jitsu techniques for beginners",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-primary",
      icon: "🥋"
    },
    {
      id: "b4",
      day: "Wednesday",
      time: "5:15 PM",
      program: "BJJ Advanced",
      ages: "11-17",
      gender: "Boys",
      instructor: "Coach Mike",
      location: "Main Dojo",
      capacity: 12,
      enrolled: 10,
      status: "Available",
      description: "Advanced BJJ techniques and competition training",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-primary",
      icon: "🥋"
    },
    {
      id: "b5",
      day: "Saturday",
      time: "9:00 AM",
      program: "Outdoor Workshop",
      ages: "8-16",
      gender: "Boys",
      instructor: "Coach Sarah",
      location: "Outdoor Training Area",
      capacity: 20,
      enrolled: 15,
      status: "Available",
      description: "Survival skills, team building, and outdoor activities",
      frequency: "Weekly",
      programType: "Outdoor Workshops",
      color: "bg-green-600",
      icon: "🌲"
    },
    {
      id: "b6",
      day: "Saturday",
      time: "11:00 AM",
      program: "Archery Training",
      ages: "10-17",
      gender: "Boys",
      instructor: "Coach David",
      location: "Archery Range",
      capacity: 12,
      enrolled: 8,
      status: "Available",
      description: "Traditional archery techniques and safety training",
      frequency: "Seasonal",
      programType: "Archery",
      color: "bg-orange-600",
      icon: "🏹"
    },

    // Girls' Classes
    {
      id: "g1",
      day: "Tuesday",
      time: "4:00 PM",
      program: "BJJ Fundamentals",
      ages: "6-10",
      gender: "Girls",
      instructor: "Coach Lisa",
      location: "Main Dojo",
      capacity: 15,
      enrolled: 10,
      status: "Available",
      description: "Basic Brazilian Jiu-Jitsu techniques for beginners",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-earthGreen",
      icon: "🥋"
    },
    {
      id: "g2",
      day: "Tuesday",
      time: "5:15 PM",
      program: "BJJ Advanced",
      ages: "11-17",
      gender: "Girls",
      instructor: "Coach Lisa",
      location: "Main Dojo",
      capacity: 12,
      enrolled: 9,
      status: "Available",
      description: "Advanced BJJ techniques and competition training",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-earthGreen",
      icon: "🥋"
    },
    {
      id: "g3",
      day: "Thursday",
      time: "4:00 PM",
      program: "BJJ Fundamentals",
      ages: "6-10",
      gender: "Girls",
      instructor: "Coach Lisa",
      location: "Main Dojo",
      capacity: 15,
      enrolled: 12,
      status: "Available",
      description: "Basic Brazilian Jiu-Jitsu techniques for beginners",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-earthGreen",
      icon: "🥋"
    },
    {
      id: "g4",
      day: "Thursday",
      time: "5:15 PM",
      program: "BJJ Advanced",
      ages: "11-17",
      gender: "Girls",
      instructor: "Coach Lisa",
      location: "Main Dojo",
      capacity: 12,
      enrolled: 11,
      status: "Available",
      description: "Advanced BJJ techniques and competition training",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-earthGreen",
      icon: "🥋"
    },
    {
      id: "g5",
      day: "Sunday",
      time: "9:00 AM",
      program: "Outdoor Workshop",
      ages: "8-16",
      gender: "Girls",
      instructor: "Coach Sarah",
      location: "Outdoor Training Area",
      capacity: 20,
      enrolled: 18,
      status: "Available",
      description: "Survival skills, team building, and outdoor activities",
      frequency: "Weekly",
      programType: "Outdoor Workshops",
      color: "bg-green-600",
      icon: "🌲"
    },
    {
      id: "g6",
      day: "Sunday",
      time: "11:00 AM",
      program: "Archery Training",
      ages: "10-17",
      gender: "Girls",
      instructor: "Coach David",
      location: "Archery Range",
      capacity: 12,
      enrolled: 6,
      status: "Available",
      description: "Traditional archery techniques and safety training",
      frequency: "Seasonal",
      programType: "Archery",
      color: "bg-orange-600",
      icon: "🏹"
    },

    // Mixed Programs
    {
      id: "m1",
      day: "Friday",
      time: "6:00 PM",
      program: "Bullyproofing Workshop",
      ages: "8-14",
      gender: "Mixed",
      instructor: "Coach Alex",
      location: "Community Hall",
      capacity: 25,
      enrolled: 20,
      status: "Available",
      description: "Anti-bullying strategies, confidence building, and self-defense",
      frequency: "Monthly",
      programType: "Bullyproofing",
      color: "bg-secondary",
      icon: "🛡️"
    },
    {
      id: "m2",
      day: "Saturday",
      time: "2:00 PM",
      program: "Family BJJ",
      ages: "All Ages",
      gender: "Mixed",
      instructor: "Coach Mike & Lisa",
      location: "Main Dojo",
      capacity: 30,
      enrolled: 22,
      status: "Available",
      description: "Family-friendly BJJ class for all ages and skill levels",
      frequency: "Weekly",
      programType: "BJJ",
      color: "bg-purple-600",
      icon: "👨‍👩‍👧‍👦"
    }
  ];

  // Filter options
  const programOptions = ["All", "BJJ", "Archery", "Outdoor Workshops", "Bullyproofing"];
  const genderOptions = ["All", "Boys", "Girls", "Mixed"];
  const ageOptions = ["All", "6-8", "9-12", "13-17", "All Ages"];

  // Filtered data
  const filteredData = useMemo(() => {
    return scheduleData.filter(item => {
      const matchesProgram = selectedProgram === "All" || item.programType === selectedProgram;
      const matchesGender = selectedGender === "All" || item.gender === selectedGender;
      const matchesAge = selectedAge === "All" || item.ages === selectedAge;
      const matchesSearch = searchTerm === "" || 
        item.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesProgram && matchesGender && matchesAge && matchesSearch;
    });
  }, [selectedProgram, selectedGender, selectedAge, searchTerm]);

  // Group by day for weekly view
  const weeklyData = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const grouped: Record<string, ScheduleItem[]> = {};
    
    days.forEach(day => {
      grouped[day] = filteredData.filter(item => item.day === day);
    });
    
    return grouped;
  }, [filteredData]);

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
      case "Full":
        return <Badge variant="destructive">Full</Badge>;
      case "Waitlist":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Waitlist</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export schedule as PDF (placeholder function)
  const exportSchedule = () => {
    // Implementation for PDF export
    alert("Schedule export feature coming soon!");
  };

  // Send email reminders (placeholder function)
  const sendReminders = () => {
    // Implementation for email reminders
    alert("Email reminder feature coming soon!");
  };

  return (
    <div className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-poppins font-bold text-4xl md:text-5xl text-gray-800 mb-4">
            Class Schedule
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find the perfect class for your child with our interactive schedule
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classes, instructors, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {/* Program Filter */}
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map(program => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Gender Filter */}
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(gender => (
                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Age Filter */}
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent>
                {ageOptions.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center mb-8">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "weekly" | "monthly")} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Weekly View
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button onClick={exportSchedule} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Schedule
            </Button>
            <Button onClick={sendReminders} variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Reminders
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Showing {filteredData.length} class{filteredData.length !== 1 ? 'es' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Schedule Content */}
        <TabsContent value="weekly" className="mt-0">
          <div className="space-y-6">
            {Object.entries(weeklyData).map(([day, classes]) => (
              classes.length > 0 && (
                <Card key={day} className="shadow-lg">
                  <CardHeader className={`${day === "Monday" || day === "Tuesday" ? "bg-primary" : 
                    day === "Wednesday" || day === "Thursday" ? "bg-earthGreen" : 
                    day === "Friday" ? "bg-secondary" : "bg-purple-600"} text-white`}>
                    <CardTitle className="text-center text-2xl font-poppins">
                      {day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid gap-4 p-6">
                      {classes.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.icon}</span>
                              <div>
                                <h3 className="font-semibold text-lg">{item.program}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {item.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {item.ages}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {item.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="mb-2">{getStatusBadge(item.status)}</div>
                              <p className="text-sm text-gray-500">Instructor: {item.instructor}</p>
                              <p className="text-sm text-gray-500">
                                {item.enrolled}/{item.capacity} enrolled
                              </p>
                              <Button size="sm" className="mt-2">
                                Register
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-0">
          <Card className="shadow-lg">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-center text-2xl font-poppins">
                Monthly Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-gray-600">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">Monthly calendar view coming soon!</p>
                <p className="text-sm">This will show a full calendar with class indicators and quick registration options.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center text-gray-600 text-lg">
            <AlertCircle className="text-primary mr-2" size={20} />
            Classes may be adjusted based on weather conditions. Indoor alternatives available.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
