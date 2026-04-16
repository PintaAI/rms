import { redirect } from "next/navigation";
import { getTechnicianDashboard, type TechnicianDashboardData } from "@/actions";
import { TechnicianOverview } from "@/components/dashboard/technician-overview";

export default async function TechnicianPage() {
  const result = await getTechnicianDashboard();

  if (!result.success) {
    redirect("/auth");
  }

  const initialData: TechnicianDashboardData = result.data || {
    stats: { totalAssigned: 0, availableCount: 0, inProgressCount: 0, doneCount: 0 },
    availableServices: [],
    myTasks: [],
  };

  return <TechnicianOverview initialData={initialData} />;
}