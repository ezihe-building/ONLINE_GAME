import { createContext, useContext, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, UserProfile } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  return (
    <AuthContext.Provider value={{ user, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
