import ProtectedRoute from "./components/ProtectedRoute";
import LibraryShell from "./components/LibraryShell";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/Forgotpassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import BookCatalog from "./pages/books/BookCatalog";

import MemberDashboard from "./pages/member/MemberDashboard";
import Profile from "./pages/member/Profile";
import ReadingHistory from "./pages/member/ReadingHistory";
import MyIssuedBooks from "./pages/member/MyIssuedBooks";
import IssueBook from "./pages/transactions/IssueBook";
import ReturnBook from "./pages/transactions/ReturnBook";
import Renewal from "./pages/transactions/Renewal";
import QRScanner from "./pages/transactions/QRScanner";
import Reservation from "./pages/reservations/Reservations";
import ReservationQueue from "./pages/reservations/ReservationQueue";
import FineManagement from "./pages/fines/FineManagement";
import FinePaymentStatus from "./pages/fines/FinePaymentStatus";
import NotificationCenter from "./pages/notifications/NotificationCenter";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import Reports from "./pages/reports/Reports";
import Charts from "./pages/analytics/Charts";
import EbookPage from "./pages/ebooks/EbookPage";
import MyRequisitions from "./pages/member/MyRequisitions";
import Recommendations from "./pages/member/Recommendations";
import UserManagement from "./pages/admin/UserManagement";


const STAFF = ["admin", "librarian"];
const MEMBER = ["member"];

// Route guards are for navigation only; the backend authorises every request.
const guard = (element, roles, dashboard = false) => <ProtectedRoute roles={roles}>{dashboard ? element : <LibraryShell>{element}</LibraryShell>}</ProtectedRoute>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/admin" element={guard(<AdminDashboard />, ["admin"], true)} />
      <Route path="/admin/users" element={guard(<UserManagement />, ["admin"])} />
      <Route path="/librarian" element={guard(<LibrarianDashboard />, ["librarian"], true)} />
      <Route path="/student" element={guard(<StudentDashboard />, MEMBER)} />
      <Route path="/member-dashboard" element={guard(<MemberDashboard />, MEMBER)} />

      <Route path="/books" element={guard(<BookCatalog />)} />
      <Route path="/ebooks" element={guard(<EbookPage />)} />
      <Route path="/notifications" element={guard(<NotificationCenter />)} />

      <Route path="/profile" element={guard(<Profile />, MEMBER)} />
      <Route path="/reading-history" element={guard(<ReadingHistory />, MEMBER)} />
      <Route path="/my-issued-books" element={guard(<MyIssuedBooks />, MEMBER)} />
      <Route path="/reservations" element={guard(<Reservation />, MEMBER)} />
      <Route path="/my-requisitions" element={guard(<MyRequisitions />, MEMBER)} />
      <Route path="/recommendations" element={guard(<Recommendations />, MEMBER)} />
      <Route path="/fine-payment-status" element={guard(<FinePaymentStatus />)} />

      <Route path="/issue-book" element={guard(<IssueBook />, STAFF)} />
      <Route path="/return-book" element={guard(<ReturnBook />, STAFF)} />
      <Route path="/renew-book" element={guard(<Renewal />, STAFF)} />
      <Route path="/qr-scanner" element={guard(<QRScanner />, STAFF)} />
      <Route path="/reservation-queue" element={guard(<ReservationQueue />, STAFF)} />
      <Route path="/fines" element={guard(<FineManagement />, STAFF)} />
      <Route path="/analytics" element={guard(<AnalyticsDashboard />, STAFF)} />
      <Route path="/reports" element={guard(<Reports />, STAFF)} />
      <Route path="/charts" element={guard(<Charts />, STAFF)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
