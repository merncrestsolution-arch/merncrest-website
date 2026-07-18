import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/i18n/routing";

export default function RegisterPage() {
  return (
    <div className="relative min-h-[100svh] flex items-center justify-center pt-24 pb-16 px-4">
      <div className="absolute inset-0 ocean-mesh opacity-50 pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Link href="/" className="font-display text-xl font-bold gradient-text mb-10">
          MernCrest
        </Link>
        <RegisterForm />
      </div>
    </div>
  );
}
