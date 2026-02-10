import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types/database";
import DashboardHeader from "./components/DashboardHeader";
import SchoolAdminDashboard from "./components/SchoolAdminDashboard";
import DonorDashboard from "./components/DonorDashboard";
import VolunteerDashboard from "./components/VolunteerDashboard";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    redirect("/auth/login");
  }

  // Fetch school data if user is school admin
  let schoolData = null;
  if (profile.role === 'school_admin') {
    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("user_id", user.id)
      .single();
    schoolData = data;
    
    // Redirect to school registration if no school found
    if (!schoolData) {
      redirect("/school/register");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <DashboardHeader
        firstName={profile.first_name}
        lastName={profile.last_name}
        email={profile.email}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based Dashboard Content */}
        {profile.role === "school_admin" && (
          <SchoolAdminDashboard
            schoolName={schoolData?.name || "Your School"}
            firstName={profile.first_name}
          />
        )}

        {profile.role === "donor" && (
          <DonorDashboard firstName={profile.first_name} />
        )}

        {profile.role === "volunteer" && (
          <VolunteerDashboard
            firstName={profile.first_name}
            isOrganization={false}
          />
        )}

        {profile.role === "admin" && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              System Administrator Dashboard
            </h2>
            <p className="text-gray-600">
              Admin dashboard features coming soon...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
