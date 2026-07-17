import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  plan: 'free' | 'pro';
  proExpiryDate?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.message !== 'Auth session missing!') throw error;
      if (user) {
        const plan = user.user_metadata?.plan || 'free';
        const proExpiryDate = user.user_metadata?.pro_expires_at || null;
        let finalPlan = plan;
        if (plan === 'pro' && proExpiryDate) {
          if (new Date(proExpiryDate) < new Date()) {
            finalPlan = 'free'; // Hết hạn
          }
        }

        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          avatar: user.user_metadata?.avatar_url,
          plan: finalPlan,
          proExpiryDate: proExpiryDate,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching auth session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const plan = session.user.user_metadata?.plan || 'free';
        const proExpiryDate = session.user.user_metadata?.pro_expires_at || null;
        let finalPlan = plan;
        if (plan === 'pro' && proExpiryDate) {
          if (new Date(proExpiryDate) < new Date()) {
            finalPlan = 'free';
          }
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Unknown',
          avatar: session.user.user_metadata?.avatar_url,
          plan: finalPlan,
          proExpiryDate: proExpiryDate,
        });
        import('@/lib/onesignal').then(({ loginOneSignal }) => {
          loginOneSignal(session.user.id);
        });
      } else {
        setUser(null);
        import('@/lib/onesignal').then(({ logoutOneSignal }) => {
          logoutOneSignal();
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = React.useMemo(() => ({
    user,
    isLoading,
    refetchUser: fetchUser,
    signOut
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
