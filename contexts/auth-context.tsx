"use client";

import { usePathname } from "next/navigation";
import { useRouter } from 'nextjs-toploader/app';
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import axios from "@/lib/axios";

type DBUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  picture: string
};

type AuthContextType = {

  user: DBUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({

  user: null,
  loading: true,
  isAdmin: false,
  isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [authData, setAuthData] = useState<DBUser | null>(null);
  const pathname = usePathname();


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      try {
        if (!fbUser?.email) {
          setAuthData(null);
          return;
        }

        const res = await axios.get(`/userdetail?email=${fbUser.email}`);

        if (res?.data?.status === "inactive") {
          setAuthData({ ...res.data, status: "inactive" });
          return;
        }

        setAuthData(res.data);
      } catch {
        setAuthData(null);
        signOut(auth);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!authData) {
      if (!pathname.startsWith("/portal/auth")) {
        router.replace("/portal/auth");
      }
      return;
    }

    if (authData.status === "inactive") {
      router.replace("/portal/restrict");
      return;
    }
    const correctRoute = `/portal/${authData.role}`;
    if (!pathname.startsWith(correctRoute)) {
      router.replace(correctRoute);
      return
    }
    setUser(authData)
  }, [authData, pathname, loading]);


  const isAdmin = authData?.role === 'admin'
  const isAuthenticated = Boolean(authData)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
