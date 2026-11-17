import Link from "next/link";
import { RegisterForm } from "./register-form";

/**
 * O portão de verdade é o POST /api/auth/register, que devolve 403 quando o
 * cadastro está fechado. Esta página só evita que a UI prometa algo que o
 * backend vai recusar.
 */
export default function RegisterPage() {
  if (process.env.ALLOW_REGISTRATION !== "true") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4 px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Registration is closed</h2>
          <p className="text-sm text-gray-600">
            This workspace doesn&apos;t accept public sign-ups. Ask an admin for an account.
          </p>
          <Link
            href="/login"
            className="inline-block font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return <RegisterForm />;
}
