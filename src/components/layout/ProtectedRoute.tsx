import { Navigate, Outlet } from "react-router-dom";
import { FAKE_AUTH_TOKEN } from "@/pages/LoginPage"; // Adjust path as needed

const ProtectedRoute = () => {
  // In a real app, you'd have a more robust check,
  // probably involving a context or a call to a verification endpoint.
  const isAuthenticated = FAKE_AUTH_TOKEN !== null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
