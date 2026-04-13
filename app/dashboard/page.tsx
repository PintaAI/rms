import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") || "/dashboard";
  console.log({ currentPath });
  
  // This page should never be accessed - proxy redirects all users to their role-specific dashboard
  // If somehow accessed directly, redirect to a default location
  redirect("/dashboard/staff");
}