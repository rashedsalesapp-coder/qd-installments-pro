import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const AuthLayout = () => {
  const { session, user } = useAuth();

  // Show a loading state while the session is being fetched
  if (session === undefined) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Skeleton className="h-12 w-1/2" />
        </div>
    );
  }

  // If there is no user session, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there is a user session, render the nested routes
  return <Outlet />;
};

export default AuthLayout;
