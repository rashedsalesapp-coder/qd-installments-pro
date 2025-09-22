import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export interface UserWithRoles extends User {
  roles: string[];
}

interface AuthContextType {
    session: Session | null;
    user: UserWithRoles | null;
    signOut: () => void;
    isLoading: boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserWithRoles | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                if (session?.user) {
                    try {
                        const { data: roles } = await supabase
                            .from('user_roles')
                            .select('role')
                            .eq('user_id', session.user.id);

                        const userRoles = roles?.map(r => r.role) || [];
                        setUser({ ...session.user, roles: userRoles });
                    } catch (error) {
                        console.error("Error fetching user roles:", error);
                        setUser({ ...session.user, roles: [] });
                    }
                } else {
                    setUser(null);
                }
                setIsLoading(false);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const hasRole = (role: string) => {
        return user?.roles.includes(role) ?? false;
    };

    const value = {
        session,
        user,
        signOut,
        isLoading,
        hasRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
