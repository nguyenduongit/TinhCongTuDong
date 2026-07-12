import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';

type User = {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar?: string | null;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, refetch } = useQuery<{ user: User }>({
    queryKey: ['auth', 'me'],
    queryFn: () => customFetch('/api/auth/me'),
    retry: false,
    refetchOnWindowFocus: true,
  });

  const value = React.useMemo(() => ({
    user: data?.user || null,
    isLoading,
    refetchUser: refetch,
  }), [data?.user, isLoading, refetch]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
