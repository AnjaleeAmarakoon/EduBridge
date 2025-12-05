import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "../auth/actions";
import type { Profile } from "@/lib/types/database";

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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "school_admin":
        return "School Administrator";
      case "donor":
        return "Donor";
      case "volunteer":
        return "Volunteer";
      case "admin":
        return "System Administrator";
      default:
        return role;
    }
  };

  const getRoleDashboardMessage = (role: string) => {
    switch (role) {
      case "school_admin":
        return "Manage your school profile, post resource requests, and schedule volunteer sessions.";
      case "donor":
        return "Browse requests from schools, make donations, and track your contributions.";
      case "volunteer":
        return "Find volunteer opportunities, register for sessions, and connect with schools.";
      case "admin":
        return "Manage users, verify schools, and oversee platform activities.";
      default:
        return "Welcome to your dashboard.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EduBridge</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {profile.first_name} {profile.last_name}
            </span>
            <form action={async () => {
              'use server';
              await logout();
            }}>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.first_name}!
          </h2>
          <p className="text-gray-600 mb-4">{getRoleDashboardMessage(profile.role)}</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {getRoleDisplayName(profile.role)}
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Information
          </h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.first_name} {profile.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {getRoleDisplayName(profile.role)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.phone || "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.address || "Not provided"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.role === "school_admin" && (
              <>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Complete School Profile
                  </h4>
                  <p className="text-sm text-gray-600">
                    Add school details for verification
                  </p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Post Request
                  </h4>
                  <p className="text-sm text-gray-600">
                    Request resources or support
                  </p>
                </button>
              </>
            )}
            {profile.role === "donor" && (
              <>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Browse Requests
                  </h4>
                  <p className="text-sm text-gray-600">
                    See requests from schools
                  </p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    My Donations
                  </h4>
                  <p className="text-sm text-gray-600">
                    Track your contributions
                  </p>
                </button>
              </>
            )}
            {profile.role === "volunteer" && (
              <>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Find Sessions
                  </h4>
                  <p className="text-sm text-gray-600">
                    Browse volunteer opportunities
                  </p>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    My Sessions
                  </h4>
                  <p className="text-sm text-gray-600">
                    View registered sessions
                  </p>
                </button>
              </>
            )}
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-left">
              <h4 className="font-semibold text-gray-900 mb-1">
                Edit Profile
              </h4>
              <p className="text-sm text-gray-600">
                Update your information
              </p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
