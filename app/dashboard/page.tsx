import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { UserInfo } from "@/components/user-info";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <UserInfo />
      </div>
      <p>Welcome to the repair shop management system dashboard.</p>
    </div>
  );
}