import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Briefcase, Users, Bot, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUserRole(data?.role || null);
      
      // Redirect based on role
      if (data?.role === "employer") {
        navigate("/employer");
      } else if (data?.role === "employee") {
        navigate("/employee");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (session && userRole) {
    return null; // Will redirect based on role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Job Portal India
          </h1>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Connect Talent with Opportunity
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            India's intelligent job marketplace powered by AI. Find the perfect job or hire the best talent.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-card p-8 rounded-lg shadow-md border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <Briefcase className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-3">For Employers</h3>
            <p className="text-muted-foreground mb-4">
              Post job listings and find the perfect candidates for your company. Reach talented professionals across India.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Easy job posting</li>
              <li>✓ Reach qualified candidates</li>
              <li>✓ Manage all listings in one place</li>
            </ul>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-md border-2 border-accent/20 hover:border-accent/40 transition-colors">
            <Users className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-2xl font-semibold mb-3">For Job Seekers</h3>
            <p className="text-muted-foreground mb-4">
              Get personalized job recommendations from our AI assistant. Voice-enabled and multilingual support.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ AI-powered job matching</li>
              <li>✓ Voice input & screen reading</li>
              <li>✓ Multilingual support (EN, HI, PA)</li>
            </ul>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg shadow-md max-w-3xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <Bot className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Job Assistant</h3>
              <p className="text-muted-foreground">
                Our intelligent chatbot helps job seekers find the perfect match based on their skills, 
                experience, and preferences. With voice input and text-to-speech capabilities, 
                finding your dream job is easier than ever.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Globe className="h-8 w-8 text-accent flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Multilingual Support</h3>
              <p className="text-muted-foreground">
                Interact in your preferred language - English, Hindi (हिंदी), or Punjabi (ਪੰਜਾਬੀ). 
                Our platform is designed to serve the diverse Indian job market.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2024 Job Portal India. Empowering careers across India.</p>
      </footer>
    </div>
  );
};

export default Index;
