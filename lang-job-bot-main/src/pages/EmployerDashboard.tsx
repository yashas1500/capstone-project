import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Briefcase, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Job {
  id: string;
  title: string;
  company_name: string;
  role: string;
  salary: string;
  location: string;
  skills_required: string[];
  description: string;
  created_at: string;
}

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    role: "",
    salary: "",
    location: "",
    skills_required: "",
    description: "",
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("jobs").insert({
        employer_id: user.id,
        ...formData,
        skills_required: formData.skills_required.split(",").map((s) => s.trim()),
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Job posted successfully.",
      });

      setFormData({
        title: "",
        company_name: "",
        role: "",
        salary: "",
        location: "",
        skills_required: "",
        description: "",
      });
      setShowForm(false);
      fetchJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Employer Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your Job Listings</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Post a New Job</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    placeholder="e.g., ₹5-8 LPA"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai, Delhi"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills Required (comma-separated)</Label>
                  <Input
                    id="skills"
                    placeholder="e.g., React, Node.js, MongoDB"
                    value={formData.skills_required}
                    onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Posting..." : "Post Job"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No jobs posted yet. Create your first job listing!</p>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <p className="text-muted-foreground">{job.company_name}</p>
                  </div>
                  <Badge variant="secondary">{job.location}</Badge>
                </div>
                <div className="space-y-2 mb-4">
                  <p><span className="font-semibold">Role:</span> {job.role}</p>
                  <p><span className="font-semibold">Salary:</span> {job.salary}</p>
                  <div>
                    <span className="font-semibold">Skills: </span>
                    {job.skills_required.map((skill, i) => (
                      <Badge key={i} variant="outline" className="mr-2">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                {job.description && (
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
