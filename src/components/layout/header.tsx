import { auth } from "@/lib/auth";
import { UserDropdown } from "./user-dropdown";

export async function Header() {
  const session = await auth();

  if (!session?.user) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#792990]/20 bg-[#350459] px-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-px bg-[#792990]/30"></div>
      </div>

      <div className="flex items-center gap-4">
        <UserDropdown user={session.user} initials={initials} />
      </div>
    </header>
  );
}
