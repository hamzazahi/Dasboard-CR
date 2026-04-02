"use client";

import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const router = useRouter();
  const { role } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess(false);

    try {
      const cleanEmail = resetEmail.toLowerCase().trim();

      // Check if user exists in dashboard 'users' collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", cleanEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setResetError("This email address is not registered.");
        return;
      }

      // Verify if the user has a dashboard-eligible role
      const dashboardDoc = querySnapshot.docs.find((doc) => {
        const role = doc.data().role?.toLowerCase();
        return role === "platform_admin" || role === "org_admin";
      });

      if (!dashboardDoc) {
        setResetError(
          "This account is for mobile app users only. Dashboard access is restricted to administrators.",
        );
        return;
      }

      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSuccess(true);
      setResetEmail("");
    } catch (err: any) {
      console.error("Reset Error:", err);
      setResetError(
        err.message ||
          "Failed to send reset email. Please verify the email address.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Fetch role to redirect correctly
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userRole = data.role?.toLowerCase();

        if (userRole === "platform_admin") {
          router.push("/admin/organisations");
        } else if (userRole === "org_admin" && data.orgId) {
          // Fetch org doc to derive slug
          const orgDoc = await getDoc(doc(db, "organizations", data.orgId));
          let slug = data.orgId;
          if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            const orgName =
              orgData.branding?.appName || orgData.orgName || data.orgId;
            slug = orgName
              .toLowerCase()
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .replace(/-+/g, "-")
              .replace(/^-|-$/g, "");
          }
          router.push(`/${slug}/dashboard`);
        } else {
          setError("Access denied. You do not have administrative privileges.");
          await auth.signOut();
        }
      } else {
        setError("User profile not found.");
        await auth.signOut();
      }
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] p-4 relative overflow-hidden">
      {/* Ambient Background Effect */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#4da63f]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#4da63f]/5 blur-[120px] rounded-full pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-[#333333] bg-[#262626] text-white overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

        <CardHeader className="space-y-1 text-center pt-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-56 h-20 transition-transform hover:scale-105 duration-300">
              <Image
                src="/logo.png"
                alt="H360 Health Logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white mb-2">
            H360 Health Dashboard
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign-in with your dashboard credentials to access the admin portal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-slate-300 font-medium ml-1"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@healthcheck.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#1e1e1e] border-[#333333] text-white placeholder:text-slate-600 h-12 rounded-lg focus:ring-[#4da63f]/20 focus:border-[#4da63f] transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label
                  htmlFor="password"
                  university-id="password-label"
                  className="text-slate-300 font-medium"
                >
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="text-xs text-primary hover:underline transition-all"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#1e1e1e] border-[#333333] text-white h-12 rounded-lg pr-12 focus:ring-[#4da63f]/20 focus:border-[#4da63f] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 hover:text-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 font-bold text-lg rounded-lg shadow-lg shadow-[#4da63f]/10 bg-[#4da63f] hover:bg-[#439c38] transition-all hover:translate-y-[-1px] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-6 text-center text-sm pb-10 px-8 border-t border-slate-800/50 pt-8 mt-2">
          <p className="text-slate-400">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Sign up your organization
            </button>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span>© 2024 H360 Health</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full" />
            <span className="hover:text-slate-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="bg-sidebar border-slate-800 text-white sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {resetSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-primary" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {resetSuccess
                ? "We've sent a password reset link to your email. Please check your inbox (and spam folder)."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {!resetSuccess ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-slate-300 ml-1">
                  Email address
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white h-12 rounded-xl focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {resetError && (
                <div className="flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{resetError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="py-6">
              <Button
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetSuccess(false);
                }}
                className="w-full h-12 font-bold rounded-xl"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
