"use client";

import LoginForm from "@/components/auth/loginForm";
import SignUpForm from "@/components/auth/signupform";
import GradientIcon from "@/components/landing/icon-container";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { auth, provider } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { signInWithPopup } from "firebase/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { toast } from "sonner";


export default function Page() {
  const searchParams = useSearchParams();
  const [tab, setTab] = React.useState<"login" | "signup">("login");
  const { loading, isAuthenticated } = useAuth()

  useEffect(() => {
    const paramTab = searchParams.get("p");
    if (paramTab === "signup") {
      setTab(paramTab);
    } else {
      setTab("login");
    }
  }, [searchParams]);

  function routeTo(targetTab: string) {
    if (targetTab === 'signup') {
      window.history.pushState({}, "", `${window.location.pathname}?p=${targetTab}`)
    }
    else {
      const url = new URL(window.location.href);
      url.searchParams.delete("p");
      window.history.replaceState({}, "", url)
    }
  }

  return (
    <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 sm:py-2">

      {loading || isAuthenticated ?
        <div className="flex flex-1 flex-col gap-3 w-full items-center justify-center h-[90dvh]">
          <Spinner />
          {isAuthenticated && <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>}
        </div>
        :
        <Tabs
          value={tab}
          onValueChange={(v) => {
            routeTo(v)
          }}
          className="space-y-8 py-10"
        >
          <Link href={"/home"} className="self-start flex gap-4 text-muted items-center">
            <ArrowLeft size={14} />
            <p className="text-xs">Back to home</p>
          </Link>
          {tab === "login" && (
            <div className="flex flex-col items-center gap-2">

              <h1 className="font-bold text-5xl text-primary">Login</h1>
              <p className="text-sm text-muted-foreground text-center">
                Welcome back! Please log in to access your account.
              </p>
            </div>
          )}

          {tab === "signup" && (
            <div className="flex flex-col items-center gap-2">
              <h1 className="font-bold text-5xl text-primary">Sign up</h1>
              <p className="text-sm text-muted-foreground text-center">
                Join our community today! Create an account to unlock exclusive
                features and personalized experiences.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <TabsList className="relative w-50 bg-[#282828] border border-[#404040] p-1 rounded-full">
              <div
                className={cn(
                  "absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ease-out",
                  tab === "signup" && "translate-x-full"
                )}
              />
              <TabsTrigger value="login" className="relative z-10 flex-1 rounded-full border-none">
                Log in
              </TabsTrigger>
              <TabsTrigger value="signup" className="relative z-10 flex-1 rounded-full border-none">
                Sign up
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login" className="w-full max-w-3xl self-center">
            <LoginForm onClickSignup={() => {
              routeTo("signup")

            }} />
          </TabsContent>

          <TabsContent value="signup" className="w-full max-w-3xl self-center">
            <SignUpForm onClickLogin={() => {
              routeTo("login")
            }}
            />
          </TabsContent>
          <div className="max-w-3xl self-center w-full">
            <Continue />
          </div>
        </Tabs>

      }

    </section>
  );
}

const Continue = () => {
  const [loading, setLoading] = React.useState(false)

  async function handleGoogleLogin() {
    setLoading(true);
    await signInWithPopup(auth, provider)
      .catch((err: any) => {
        toast.error(err?.message || "Error login",)

      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase">
          or continue with
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center items-center gap-10 mt-2">
        {loading ? <div className="p-2"><Spinner /> </div> :
          <GradientIcon onClick={() => handleGoogleLogin()}>
            <FaGoogle className="text-primary" size={18} />
          </GradientIcon>
        }
        {/* <button><GradientIcon onClick={() => console.log("facebook")}>
          <FaFacebook className="text-primary" size={18} />
        </GradientIcon></button>
        <button><GradientIcon onClick={() => console.log("apple")}>
          <FaApple className="text-primary" size={18} />
        </GradientIcon></button> */}
      </div>
    </>
  )
}
