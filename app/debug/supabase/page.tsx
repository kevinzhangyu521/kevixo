import { SupabaseDebugStatus } from "./supabase-debug-status";

export default function SupabaseDebugPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-slate-100">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
        <h1 className="text-2xl font-semibold">Supabase Debug</h1>
        <SupabaseDebugStatus />
      </section>
    </main>
  );
}
