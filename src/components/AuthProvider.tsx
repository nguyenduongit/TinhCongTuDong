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
  isAdmin: boolean;
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

/**
 * Kiểm tra và áp dụng mã referral sau khi user đăng nhập.
 * Chỉ chạy 1 lần khi có referral_code trong localStorage.
 */
async function tryApplyReferral(userId: string) {
  const refCode = localStorage.getItem('referral_code');
  if (!refCode) return;

  try {
    const { data, error } = await supabase.rpc('apply_referral', {
      p_referee_id: userId,
      p_referral_code: refCode.toUpperCase(),
    });

    if (error) {
      console.warn('[Referral] RPC error:', error.message);
    } else if (data?.success) {
      console.log('[Referral] Applied successfully');
    } else if (data?.error === 'already_referred') {
      console.log('[Referral] User already has a referrer');
    } else if (data?.error === 'self_referral') {
      console.warn('[Referral] Cannot refer yourself');
    } else if (data?.error === 'invalid_code') {
      console.warn('[Referral] Invalid referral code');
    }
  } catch (e) {
    console.warn('[Referral] Failed to apply:', e);
  } finally {
    // Luôn xóa khỏi localStorage sau khi thử áp dụng (dù thành công hay thất bại)
    localStorage.removeItem('referral_code');
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.message !== 'Auth session missing!') throw error;
      if (user) {
        const sub = user.user_metadata?.subscription || {};
        const plan = sub.plan || user.user_metadata?.plan || 'free';
        const proExpiryDate = sub.expires_at || user.user_metadata?.pro_expires_at || null;
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
          isAdmin: user.user_metadata?.isAdmin === true || user.user_metadata?.isAdmin === 'true' || user.user_metadata?.isadmin === true || user.user_metadata?.isadmin === 'true',
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
        const sub = session.user.user_metadata?.subscription || {};
        const plan = sub.plan || session.user.user_metadata?.plan || 'free';
        const proExpiryDate = sub.expires_at || session.user.user_metadata?.pro_expires_at || null;
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
          isAdmin: session.user.user_metadata?.isAdmin === true || session.user.user_metadata?.isAdmin === 'true' || session.user.user_metadata?.isadmin === true || session.user.user_metadata?.isadmin === 'true',
        });

        // Tự động áp dụng referral code nếu có trong localStorage
        // Chạy fire-and-forget, không block UI
        tryApplyReferral(session.user.id);

      } else {
        setUser(null);

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
