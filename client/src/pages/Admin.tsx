import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, formatDate } from "@/lib/exportUtils";

interface Contact {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

interface Registration {
  id: number;
  program_id: string;
  program_name: string;
  form_data: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin?password=${password}`);
      const data = await response.json();
      
      if (response.ok || (response.status === 500 && data.contacts !== undefined)) {
        // Login successful - even if database has error, we can still access
        setContacts(data.contacts || []);
        setRegistrations(data.registrations || []);
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: `Found ${data.totalContacts} contacts and ${data.totalRegistrations} registrations`,
        });
      } else if (response.status === 401) {
        toast({
          title: "Login failed",
          description: "Invalid password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login failed",
          description: "Server error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin?password=${password}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setRegistrations(data.registrations || []);
        toast({
          title: "Data refreshed",
          description: `Found ${data.totalContacts} contacts and ${data.totalRegistrations} registrations`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

    // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(registration => {
      const matchesSearch = searchTerm === "" || 
        registration.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.form_data.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
      const matchesProgram = programFilter === "all" || registration.program_id === programFilter;
      
      return matchesSearch && matchesStatus && matchesProgram;
    });
  }, [registrations, searchTerm, statusFilter, programFilter]);

  // Get unique programs for filter
  const uniquePrograms = useMemo(() => {
    const programs = registrations.map(r => ({ id: r.program_id, name: r.program_name }));
    return Array.from(new Map(programs.map(p => [p.id, p])).values());
  }, [registrations]);

  const handleExportCSV = () => {
    exportToCSV(filteredRegistrations, `registrations-${new Date().toISOString().split('T')[0]}.csv`);
    toast({
      title: "Export Successful",
      description: `Exported ${filteredRegistrations.length} registrations to CSV`,
    });
  };

  const renderRegistrationData = (formData: string) => {
    try {
      const data = JSON.parse(formData);
      return Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-2">
          <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
          <span className="ml-2 text-gray-700">{String(value)}</span>
        </div>
      ));
    } catch (error) {
      return <p className="text-gray-500">Error parsing form data</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="space-x-2">
            <Button onClick={refreshData} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
            >
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrations">
              Program Registrations ({registrations.length})
            </TabsTrigger>
            <TabsTrigger value="contacts">
              Contact Submissions ({contacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {uniquePrograms.map(program => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleExportCSV} variant="outline">
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </div>

            {filteredRegistrations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No program registrations found.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    To store registrations permanently, set up the D1 database.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    See DATABASE_SETUP.md for instructions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRegistrations.map((registration) => (
                  <Card key={registration.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{registration.program_name}</CardTitle>
                            {getStatusBadge(registration.status)}
                          </div>
                          <p className="text-sm text-gray-600">ID: {registration.id}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(registration.created_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {renderRegistrationData(registration.form_data)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            {contacts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No contact submissions found.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    To store contact submissions permanently, set up the D1 database.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    See DATABASE_SETUP.md for instructions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {contacts.map((contact, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{contact.name}</CardTitle>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(contact.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold">Subject:</span> {contact.subject}
                        </div>
                        <div>
                          <span className="font-semibold">Message:</span>
                          <p className="mt-1 text-gray-700">{contact.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin; 