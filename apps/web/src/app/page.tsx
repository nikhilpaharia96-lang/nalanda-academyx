import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy px-6 text-center text-white">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Nalanda Academy Cloud</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Building Knowledge. Inspiring Excellence.</h1>
        <p className="mx-auto mt-4 max-w-md text-neutral-300">
          The public marketing site is being built in a later phase of this project. For now, the Admin Portal is live.
        </p>
      </div>
      <Link
        href="/admin/login"
        className="rounded-md bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold-light"
      >
        Go to Admin Portal
      </Link>
      <div className="flex gap-4 text-sm">
        <Link href="/teacher/login" className="text-neutral-300 underline-offset-4 hover:text-white hover:underline">
          Teacher Portal
        </Link>
        <Link href="/student/login" className="text-neutral-300 underline-offset-4 hover:text-white hover:underline">
          Student Portal
        </Link>
        <Link href="/parent/login" className="text-neutral-300 underline-offset-4 hover:text-white hover:underline">
          Parent Portal
        </Link>
      </div>
    </main>
  );
}
