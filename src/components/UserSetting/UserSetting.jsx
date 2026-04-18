import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
    deleteCurrentUserAccount,
    getTasksByColumn,
    updateCurrentUserProfile,
} from "../../services/firebase";
import ConfirmLogoutPopup from "../ConfirmLogoutPopup";
import { currentUserProfileQueryKeyRoot } from "../../hooks/useCurrentUserProfile.js";
import { allUsersQueryKeyRoot } from "../../hooks/useAllUsers.js";
import { COLUMN_TO_FIREBASE } from "../../hooks/useKanbanDnD.js";

export default function UserSetting({ avatarUrl, initialProfile }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [userName, setUserName] = useState("");
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

    const formatUpdatedAt = (raw) => {
        if (!raw) return "N/A";
        try {
            if (typeof raw?.toDate === "function") {
                return raw.toDate().toLocaleString("vi-VN");
            }
            if (raw instanceof Date) return raw.toLocaleString("vi-VN");
            const d = new Date(raw);
            return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleString("vi-VN");
        } catch {
            return "N/A";
        }
    };

    const downloadProfileAsTxt = async () => {
        try {
            const [todoTasks, inProgressTasks, reviewTasks, doneTasks] = await Promise.all([
                getTasksByColumn(COLUMN_TO_FIREBASE.todo),
                getTasksByColumn(COLUMN_TO_FIREBASE.inProgress),
                getTasksByColumn(COLUMN_TO_FIREBASE.review),
                getTasksByColumn(COLUMN_TO_FIREBASE.done),
            ]);

            const lines = [
                "=== PROFILE SUMMARY ===",
                `Full name: ${initialProfile?.FullName ?? fullName ?? "N/A"}`,
                `Username: ${initialProfile?.UserName ?? userName ?? "N/A"}`,
                `Email: ${initialProfile?.Email ?? email ?? "N/A"}`,
                `Updated at: ${formatUpdatedAt(initialProfile?.updatedAt)}`,
                "",
                "=== TASK STATS BY COLUMN ===",
                `Todo: ${todoTasks.length}`,
                `In Progress: ${inProgressTasks.length}`,
                `Review: ${reviewTasks.length}`,
                `Done: ${doneTasks.length}`,
                `Total: ${todoTasks.length + inProgressTasks.length + reviewTasks.length + doneTasks.length}`,
            ];

            const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
            const objectUrl = URL.createObjectURL(blob);
            const safeUser = String(initialProfile?.UserName || userName || "user")
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "");
            const datePart = new Date().toISOString().slice(0, 10);

            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = `profile-${safeUser || "user"}-${datePart}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            window.alert("Could not export profile. Please try again.");
        }
    };

    useEffect(() => {
        if (!initialProfile) return;
        setEmail(initialProfile.Email || "");
        setFullName(initialProfile.FullName || "");
        setUserName(initialProfile.UserName || "");
    }, [initialProfile]);

    const handleUpdateUser = async () => {
        await updateCurrentUserProfile({
            FullName: fullName,
            UserName: userName,
            avatar: avatarUrl,
            Email: email
        });
        await queryClient.invalidateQueries({ queryKey: currentUserProfileQueryKeyRoot });
        await queryClient.invalidateQueries({ queryKey: allUsersQueryKeyRoot });
    }
    return (
        <>
            {confirmDeleteAccount ? (
                <ConfirmLogoutPopup
                    message="Bạn có chắc muốn xoá tài khoản không?"
                    onCancel={() => setConfirmDeleteAccount(false)}
                    onOk={async () => {
                        try {
                            await deleteCurrentUserAccount();
                            await queryClient.invalidateQueries({ queryKey: currentUserProfileQueryKeyRoot });
                            queryClient.removeQueries({ queryKey: allUsersQueryKeyRoot });
                        } finally {
                            setConfirmDeleteAccount(false);
                            navigate("/");
                        }
                    }}
                />
            ) : null}
            <section className="md:col-span-8">
                <form className="space-y-4" action="#" method="post">
                    <div className="space-y-1.5">
                        <label htmlFor="profile-username" className="text-sm font-semibold text-slate-700">
                            Username
                        </label>
                        <input
                            id="profile-username"
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Your username"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="profile-email" className="text-sm font-semibold text-slate-700">
                                Email
                            </label>
                        </div>
                        <input
                            id="profile-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="profile-name" className="text-sm font-semibold text-slate-700">
                            Full name
                        </label>
                        <input
                            id="profile-name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label htmlFor="profile-language" className="text-sm font-semibold text-slate-700">
                                Language
                            </label>
                            <select
                                id="profile-language"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                                defaultValue="en-us"
                            >
                                <option value="en-us">English (US)</option>
                                <option value="en-uk">English (UK)</option>
                                <option value="vi-vn">Tiếng Việt</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button" onClick={handleUpdateUser}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                        >
                            Save
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                        <button
                            type="button"
                            onClick={downloadProfileAsTxt}
                            className="font-semibold text-slate-600 underline-offset-4 hover:underline"
                        >
                            Download profile
                        </button>
                        <button
                            type="button"
                            className="font-semibold text-emerald-700 underline-offset-4 hover:underline"
                            onClick={() => setConfirmDeleteAccount(true)}
                        >
                            Delete account
                        </button>
                    </div>
                </form>
            </section>
        </>
    )
}