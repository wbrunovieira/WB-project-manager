import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TimeTrackerProvider } from "@/contexts/time-tracker-context";
import { FloatingTimer } from "@/components/time-tracker/floating-timer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TimeTrackerProvider>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <FloatingTimer />
      </div>
    </TimeTrackerProvider>
  );
}
