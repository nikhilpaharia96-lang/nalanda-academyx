"use client";

import { PortalLoginForm } from "@/components/portal-login-form";

export default function AdminLoginPage() {
  return <PortalLoginForm title="Admin Portal" subtitle="Sign in to the Admin Portal" demoEmail="admin@nalanda.demo" showPortalSwitcher={false} />;
}
