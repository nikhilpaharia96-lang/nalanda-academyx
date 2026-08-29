"use client";

import { PortalLoginForm } from "@/components/portal-login-form";
import { Users } from "lucide-react";

export default function TeacherLoginPage() {
  return <PortalLoginForm title="Teacher Portal" subtitle="Sign in to the Teacher Portal" demoEmail="teacher@nalanda.demo" icon={Users} />;
}
