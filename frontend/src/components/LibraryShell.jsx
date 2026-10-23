import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

const adminLinks = [
  ["Dashboard", "/admin"], ["User Management", "/admin/users"], ["Books", "/books"], ["E-Books", "/ebooks"],
  ["Issue Book", "/issue-book"], ["Return Book", "/return-book"], ["Renew Book", "/renew-book"],
  ["QR Scanner", "/qr-scanner"], ["Book Requisitions", "/requisition-management"],
  ["Reservations", "/reservation-queue"], ["Fines", "/fines"], ["Notifications", "/notifications"],
  ["Analytics", "/analytics"], ["Reports", "/reports"], ["Charts", "/charts"]
];
const librarianLinks = [
  ["Dashboard", "/librarian"], ["Book Catalog", "/books"], ["E-Books", "/ebooks"],
  ["Issue Book", "/issue-book"], ["Return Book", "/return-book"], ["Renew Book", "/renew-book"],
  ["QR Scanner", "/qr-scanner"], ["Book Requisitions", "/requisition-management"],
  ["Reservation Queue", "/reservation-queue"], ["Fine Management", "/fines"],
  ["Notifications", "/notifications"], ["Reports", "/reports"], ["Analytics", "/analytics"]
];
const memberLinks = [
  ["Dashboard", "/member-dashboard"], ["Student Dashboard", "/student"], ["Book Catalog", "/books"], ["E-Books", "/ebooks"],
  ["My Profile", "/profile"], ["Issued Books", "/my-issued-books"], ["Reading History", "/reading-history"],
  ["Reservations", "/reservations"], ["Requisitions", "/my-requisitions"],
  ["Recommendations", "/recommendations"], ["Fine Status", "/fine-payment-status"],
  ["Notifications", "/notifications"]
];

export default function LibraryShell({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const links = role === "admin" ? adminLinks : role === "librarian" ? librarianLinks : memberLinks;
  const home = role === "admin" ? "/admin" : role === "librarian" ? "/librarian" : "/member-dashboard";
  const current = links.find(([, url]) => url === location.pathname)?.[0] || "Library";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:pl-72">
      {open && <button type="button" aria-label="Close navigation overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" />}
      <aside aria-label="Library navigation" className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col bg-slate-950 text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div><p className="text-lg font-bold">📚 Library LMS</p><p className="text-xs text-slate-400">{role === "admin" ? "Administration" : role === "librarian" ? "Librarian" : "Member"} Portal</p></div>
          <button type="button" className="rounded p-2 hover:bg-slate-800 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
          {links.map(([label, url]) => <Link key={url} to={url} onClick={() => setOpen(false)} aria-current={location.pathname === url ? "page" : undefined} className={`block rounded-lg px-4 py-3 text-sm transition hover:bg-slate-800 ${location.pathname === url ? "bg-blue-600 font-semibold text-white" : "text-slate-200"}`}>{label}</Link>)}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button type="button" onClick={() => { logout(); navigate("/", { replace: true }); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-300 hover:bg-slate-800">Logout</button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-slate-200 px-3 py-2 lg:hidden" aria-label="Open navigation menu">☰</button>
          <button type="button" onClick={() => { if (window.history.length > 1) navigate(-1); else navigate(home); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-100" aria-label="Go back">← Back</button>
          <span className="min-w-0 truncate font-semibold">{current}</span>
          <Link to={home} className="ml-auto shrink-0 text-sm font-semibold text-blue-700 hover:underline">Dashboard</Link>
        </div>
        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
