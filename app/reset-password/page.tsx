import { AuthPageForm } from "@/components/auth-page-form";
import { SiteHeader } from "@/components/site-header";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <AuthPageForm mode="reset" />
    </main>
  );
}
