"use client";

import { useState } from "react";
import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CheckSquareIcon, LogInIcon, UserPlusIcon } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("signin");

  return (
    <div className="flex flex-col items-center w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <CheckSquareIcon className="size-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome to Todo
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
          Organize your tasks, projects, and productivity in one place.
        </p>
      </div>

      {/* Tabs Controller */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 p-1 h-11 bg-muted/80 rounded-xl mb-4">
          <TabsTrigger
            value="signin"
            className="rounded-lg font-medium text-xs sm:text-sm gap-1.5 data-active:shadow-xs"
          >
            <LogInIcon className="size-4" />
            <span>Sign In</span>
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-lg font-medium text-xs sm:text-sm gap-1.5 data-active:shadow-xs"
          >
            <UserPlusIcon className="size-4" />
            <span>Sign Up</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-0">
          <SignInForm onSwitchTab={() => setActiveTab("signup")} />
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <SignUpForm onSwitchTab={() => setActiveTab("signin")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}