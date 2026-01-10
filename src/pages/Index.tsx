import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role) {
      // Redirect based on role
      if (role === 'student') {
        navigate('/class', { replace: true });
      } else if (role === 'teacher') {
        navigate('/faculty', { replace: true });
      }
      // Admin stays on dashboard
    }
  }, [role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only admin sees the full dashboard
  if (role === 'admin') {
    return <Dashboard />;
  }

  // For other roles, show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
