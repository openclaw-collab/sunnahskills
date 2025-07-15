import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

const Admin = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin?password=${password}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setIsAuthenticated(true);
        toast({
          title: "Login successful",
          description: `Found ${data.total} contact submissions`,
        });
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
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
        toast({
          title: "Data refreshed",
          description: `Found ${data.total} contact submissions`,
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
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

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No contact submissions found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Note: Data is stored in memory and may reset when the server restarts.
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
      </div>
    </div>
  );
};

export default Admin; 