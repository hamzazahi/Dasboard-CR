"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  role: string | null;
  orgId: string | null;
  orgSlug: string | null;
  orgName: string | null;
  orgLogoUrl: string | null;
  emailVerified: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  orgId: null,
  orgSlug: null,
  orgName: null,
  orgLogoUrl: null,
  emailVerified: false,
  loading: true,
});

/** Convert an org name like "Alkawitech" → "alkawitech" for use in URLs */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/[^a-z0-9-]/g, "") // strip non-alphanumeric
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setRole(null);
        setOrgId(null);
        setOrgSlug(null);
        setOrgName(null);
        setOrgLogoUrl(null);
        setUser(user);
        setEmailVerified(user.emailVerified);

        try {
          // Fetch user role and orgId from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userRole = data.role || "patient";
            const userOrgId = data.orgId || null;
            setRole(userRole);
            setOrgId(userOrgId);

            // Fetch org document to derive slug and name
            if (userOrgId) {
              const orgDoc = await getDoc(doc(db, "organizations", userOrgId));
              if (orgDoc.exists()) {
                const orgData = orgDoc.data();
                const resolvedName =
                  orgData.branding?.appName ||
                  orgData.name ||
                  orgData.orgName ||
                  userOrgId;
                setOrgSlug(toSlug(resolvedName));
                setOrgName(resolvedName);
                setOrgLogoUrl(orgData.branding?.logoUrl || null);
              } else {
                setOrgSlug(toSlug(userOrgId));
                setOrgName(null);
                setOrgLogoUrl(null);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setRole(null);
        setOrgId(null);
        setOrgSlug(null);
        setOrgName(null);
        setOrgLogoUrl(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        orgId,
        orgSlug,
        orgName,
        orgLogoUrl,
        emailVerified,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
