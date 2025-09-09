import UserList from '@/components/users/UserList';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const UserManagementPage = () => {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // Protect the route client-side as well
  if (!hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-10">
      <UserList />
    </div>
  );
};

export default UserManagementPage;