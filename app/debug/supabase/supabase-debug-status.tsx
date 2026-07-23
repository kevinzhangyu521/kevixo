"use client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function SupabaseDebugStatus() {
  return (
    <dl className="mt-6 grid gap-4 text-sm">
      <DebugRow label="Supabase URL configured" value={Boolean(supabaseUrl)} />
      <DebugRow label="Supabase anon key configured" value={Boolean(supabaseAnonKey)} />
    </dl>
  );
}

function DebugRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/45 px-4 py-3">
      <dt className="font-medium text-slate-300">{label}</dt>
      <dd className={value ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>
        {value ? "YES" : "NO"}
      </dd>
    </div>
  );
}
