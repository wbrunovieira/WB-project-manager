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
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">My Issues</h1>
      </div>

      <div className="flex items-center gap-4">
        <UserDropdown user={session.user} initials={initials} />
      </div>
    </header>
  );
}
