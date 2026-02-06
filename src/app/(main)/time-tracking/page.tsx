import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimeTrackingClient } from "@/components/time-tracking/time-tracking-client";

export default async function TimeTrackingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-[#350459]">
      <div className="flex-1 space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-100">Time Tracking</h1>
          <p className="text-gray-300 mt-1">
            View and analyze time spent on issues
          </p>
        </div>

        <TimeTrackingClient />
      </div>
    </div>
  );
}
