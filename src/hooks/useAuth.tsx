import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Extend the User type to include our custom 'roles' array
export interface UserWithRoles extends User {
  roles: string[];
}

interface AuthContextType {
    session: Session | null | undefined;
    user: UserWithRoles | null;
    signOut: () => void;
    isLoading: boolean;
    // Helper function to easily check roles
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [user, setUser] = useState<UserWithRoles | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getSessionAndRoles = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);

                if (session) {
                    const { data: roles } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', session.user.id);

                    const userRoles = roles?.map(r => r.role) || [];
                    setUser({ ...session.user, roles: userRoles });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error fetching session and roles:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        getSessionAndRoles();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);

                if (session) {
                    const { data: roles } = await supabase
                        .from('user_roles')
                        .select('role')
                        .eq('user_id', session.user.id);

                    const userRoles = roles?.map(r => r.role) || [];
                    setUser({ ...session.user, roles: userRoles });
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
        try {
            setIsLoading(true);
            await supabase.auth.signOut();
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasRole = (role: string) => {
        return user?.roles.includes(role) ?? false;
    };

    return (
        <AuthContext.Provider value={{ session, user, signOut, isLoading, hasRole }}>
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
