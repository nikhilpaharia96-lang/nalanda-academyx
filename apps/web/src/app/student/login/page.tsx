"use client";

import { PortalLoginForm } from "@/components/portal-login-form";
import { GraduationCap } from "lucide-react";

export default function StudentLoginPage() {
  return <PortalLoginForm title="Student Portal" subtitle="Sign in to the Student Portal" demoEmail="student@nalanda.demo" icon={GraduationCap} />;
}
