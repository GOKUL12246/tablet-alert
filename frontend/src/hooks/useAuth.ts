import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useAuthContext();
  const isPatient = context.user?.role === 'patient';
  const isCaregiver = context.user?.role === 'caregiver';
  const isHealthcare = context.user?.role === 'healthcare_professional';
  const isAdmin = context.user?.role === 'admin';

  return {
    ...context,
    isPatient,
    isCaregiver,
    isHealthcare,
    isAdmin,
    isAuthenticated: !!context.token && !!context.user,
  };
};

export default useAuth;
