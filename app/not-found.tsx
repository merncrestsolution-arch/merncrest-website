import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-4xl font-bold">404</p>
      <p className="text-muted">This page could not be found.</p>
      <Link href="/en" className="text-sm text-violet-400 underline underline-offset-4">
        Back to home
      </Link>
    </div>
  );
}
