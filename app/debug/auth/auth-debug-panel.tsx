"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import {
  getSupabaseClient,
  getSupabaseConfigurationError,
  isSupabaseConfigured,
} from "@/lib/supabase";

type ProfileDebugRow = {
  email: string | null;
  role: string | null;
  status: string | null;
};

type AuthDebugState = {
  authUserExists: boolean;
  authEmail: string;
  configError: string;
  headerAdminEligible: boolean;
  profileEmail: string;
  profileExists: boolean;
  profileRole: string;
  profileStatus: string;
  sessionExists: boolean;
  statusMessage: string;
};

const initialDebugState: AuthDebugState = {
  authUserExists: false,
  authEmail: "Not available",
  configError: "",
  headerAdminEligible: false,
  profileEmail: "Not available",
  profileExists: false,
  profileRole: "Not available",
  profileStatus: "Not available",
  sessionExists: false,
  statusMessage: "Checking client auth state...",
};

export function AuthDebugPanel() {
  const [debugState, setDebugState] = useState<AuthDebugState>(initialDebugState);

  const loadDebugState = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDebugState({
        ...initialDebugState,
        configError: getSupabaseConfigurationError() ?? "Supabase client is not configured.",
        statusMessage: "Supabase client configuration is missing.",
      });
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData.user;

      if (sessionError || userError || !user) {
        setDebugState({
          ...initialDebugState,
          authEmail: user?.email ?? "Not available",
          authUserExists: Boolean(user),
          sessionExists: Boolean(sessionData.session),
          statusMessage: sessionError?.message ?? userError?.message ?? "No auth user found.",
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, role, status")
        .eq("id", user.id)
        .maybeSingle<ProfileDebugRow>();

      setDebugState({
        authEmail: user.email ?? "Not available",
        authUserExists: true,
        configError: "",
        headerAdminEligible: profile?.role === "admin" && profile.status === "active",
        profileEmail: profile?.email ?? "Not available",
        profileExists: Boolean(profile),
        profileRole: profile?.role ?? "Not available",
        profileStatus: profile?.status ?? "Not available",
        sessionExists: Boolean(sessionData.session),
        statusMessage: profileError?.message ?? "Client auth diagnostic loaded.",
      });
    } catch (error) {
      setDebugState({
        ...initialDebugState,
        statusMessage: error instanceof Error ? error.message : "Auth diagnostic failed.",
      });
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadDebugState();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [loadDebugState]);

  return (
    <Card className="mt-8 p-5 md:p-6">
      <CardTitle>Client Auth State</CardTitle>
      <div className="mt-5 grid gap-3">
        <DebugRow label="Auth session exists" value={yesNo(debugState.sessionExists)} />
        <DebugRow label="Auth user exists" value={yesNo(debugState.authUserExists)} />
        <DebugRow label="Auth email" value={debugState.authEmail} />
        <DebugRow label="Profile exists" value={yesNo(debugState.profileExists)} />
        <DebugRow label="Profile email" value={debugState.profileEmail} />
        <DebugRow label="Profile role" value={debugState.profileRole} />
        <DebugRow label="Profile status" value={debugState.profileStatus} />
        <DebugRow label="Header admin eligible" value={yesNo(debugState.headerAdminEligible)} />
      </div>
      {debugState.configError ? (
        <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
          {debugState.configError}
        </p>
      ) : null}
      <p className="mt-5 text-sm leading-6 text-slate-400" role="status" aria-live="polite">
        {debugState.statusMessage}
      </p>
    </Card>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/48 p-4 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="break-words text-sm font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? "YES" : "NO";
}
