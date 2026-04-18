import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import ConfirmLogoutPopup from "./ConfirmLogoutPopup.jsx"
import { logout } from "../services/firebase.js"
import {
  currentUserProfileQueryKeyRoot,
  useCurrentUserProfile,
} from "../hooks/useCurrentUserProfile.js"

export default function UserMenuPopup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, loading } = useCurrentUserProfile()
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  return (
    <>
      {confirmLogoutOpen ? (
        <ConfirmLogoutPopup
          message="Bạn có chắc muốn đăng xuất không?"
          onCancel={() => setConfirmLogoutOpen(false)}
          onOk={async () => {
            try {
              await logout()
              queryClient.removeQueries({ queryKey: currentUserProfileQueryKeyRoot })
            } finally {
              setConfirmLogoutOpen(false)
              navigate("/")
            }
          }}
        />
      ) : null}

      <div className="absolute right-0 top-12 z-40 w-72 rounded-sm border border-slate-200 bg-white p-4 shadow-xl">
      <div
        className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white"
        aria-hidden
      />

      <div className="flex items-center gap-3 pb-4">
        {loading ? (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-200 text-xs text-slate-500 ring-1 ring-slate-200">
            …
          </div>
        ) : user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600 ring-1 ring-slate-200">
            {(user?.FullName || user?.UserName || user?.Email || "?")
              .toString()
              .trim()
              .charAt(0)
              .toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-slate-800">{user?.UserName ?? ""}</p>
          <p className="truncate text-sm text-slate-500">{user?.Email ?? ""}</p>
        </div>
      </div>

      <div className="space-y-0.5 border-t border-cyan-200 pt-3">
        <Link
          to="/profile"
          state={{ highlight: "Change password" }}
          className="block w-full py-2 text-left text-base font-semibold text-slate-600 transition hover:text-slate-900"
        > Account settings 
        </Link>
        <Link
          to="/profile"
          state={{ highlight: "User settings" }}
          className="block w-full py-2 text-left text-base font-semibold text-slate-600 transition hover:text-slate-900"
        > Edit profile 
        </Link>
      </div>

      <div className="mt-3 border-t border-cyan-200 pt-2">
        <button
          type="button"
          className="block w-full py-2 text-left text-base font-semibold text-cyan-700 transition hover:text-cyan-600"
          onClick={() => setConfirmLogoutOpen(true)}
        >
          Logout
        </button>
      </div>
      </div>
    </>
  )
}

