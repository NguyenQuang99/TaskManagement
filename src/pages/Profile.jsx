import { Link, useLocation } from "react-router-dom";
import MenuSetting from "../components/MenuSetting";
import UserSetting from "../components/UserSetting/UserSetting";
import ChangeAvatar from "../components/UserSetting/ChangeAvatar";
import ChangePassword from "../components/UserSetting/ChangePassword";
import StartPage from "../components/UserSetting/StartPage.jsx";
import { useState } from "react";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile.js";

export default function Profile() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState((location.state && location.state.highlight) ?  location.state.highlight : "User settings");
  const { user, loading, error, refetch } = useCurrentUserProfile();
  const [avatarOverride, setAvatarOverride] = useState(null);
  const avatarUrl = avatarOverride || user?.avatar || null;
  let page = null;
  const onSelectPage = (page) =>{
    setCurrentPage(page);
  }
  switch (currentPage) {
    case "User settings":
      page = (<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">User Settings</h2>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-12">
          <ChangeAvatar setAvatar={setAvatarOverride} initialAvatar={avatarUrl} />
          <UserSetting avatarUrl={avatarUrl} initialProfile={user} />
        </div>
      </div>)
      break;
    case "Change password":
      page = (<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Change password</h2>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-12">
          <ChangePassword />
        </div>
      </div>)
      break;
    case "Set start pages":
      page = <StartPage />
      break;
    default:
      page = (<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">User Settings</h2>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-12">
          <ChangeAvatar setAvatar={setAvatarOverride} initialAvatar={avatarUrl} />
          <UserSetting avatarUrl={avatarUrl} initialProfile={user} />
        </div>
      </div>)
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">User Settings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your profile and preferences.</p>
          </div>
          <Link
            to="/kanban" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <MenuSetting activeLabel={currentPage} onSelectPage={onSelectPage} />
          <main className="lg:col-span-9">
            {loading ? (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Loading profile…
              </p>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-white p-8 text-center">
                <p className="text-sm text-rose-700">Could not load profile.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Try again
                </button>
              </div>
            ) : (
              page
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

