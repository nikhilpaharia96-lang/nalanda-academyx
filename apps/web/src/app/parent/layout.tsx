import { ChildProvider } from "@/lib/child-context";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <ChildProvider>{children}</ChildProvider>;
}
