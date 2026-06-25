import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types/database";
import DashboardHeader from "./components/DashboardHeader";
import SchoolAdminDashboard from "./components/SchoolAdminDashboard";
import DonorDashboard from "./components/DonorDashboard";
import VolunteerDashboard from "./components/VolunteerDashboard";
import AdminDashboard from "./components/AdminDashboard";

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
  let schoolRequests = [];
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

    // Fetch school's requests
    const { data: requests } = await supabase
      .from("requests")
      .select("*")
      .eq("school_id", schoolData.school_id)
      .order("created_at", { ascending: false });
    
    schoolRequests = requests || [];
  }

  if (profile.role === "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DashboardHeader
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={profile.email}
        />
        <AdminDashboard />
      </div>
    );
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
            requests={schoolRequests}
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
      </main>
    </div>
  );
}
