"use client";

import { PortalLoginForm } from "@/components/portal-login-form";
import { UsersRound } from "lucide-react";

export default function ParentLoginPage() {
  return <PortalLoginForm title="Parent Portal" subtitle="Sign in to the Parent Portal" demoEmail="parent@nalanda.demo" icon={UsersRound} />;
}
