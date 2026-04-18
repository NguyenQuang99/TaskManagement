import { useState } from "react"
import { reauthenticateAndUpdatePassword } from "../../services/firebase";
import {useNavigate } from "react-router-dom"

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState(null);
  const [newPassword, setNewPassword] = useState(null);
  const [reNewPassword, setReNewPassword] = useState(null);

  const handleUpdatePassword = async () => {
    if ((newPassword ?? "") !== (reNewPassword ?? "")) {
      window.alert("New password and retype password do not match.");
      return;
    }

     try {
      await reauthenticateAndUpdatePassword(currentPassword, newPassword);
      navigate("/");
     } catch (err) {
      console.error(err.code, err.message);
     }
  }
  return (
    <section className="md:col-span-8">
      <form className="space-y-4" action="#" method="post">
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="text-sm font-semibold text-slate-700">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
            New password
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="retype-new-password" className="text-sm font-semibold text-slate-700">
            Retype new password
          </label>
          <input
            id="retype-new-password"
            name="retypeNewPassword"
            type="password"
            autoComplete="new-password"
            value={reNewPassword}
            onChange={(e) => setReNewPassword(e.target.value)}
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleUpdatePassword}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Save
          </button>
        </div>
      </form>
    </section>
  )
}

