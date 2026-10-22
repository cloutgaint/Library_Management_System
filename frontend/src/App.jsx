import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/Forgotpassword";
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
import LibrarySettings from "./pages/settings/LibrarySettings";


function App() {
 
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/register" element={<Register />} />
      

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

<Route path="/librarian" element={<ProtectedRoute roles={["librarian"]}><LibrarianDashboard /></ProtectedRoute>} />

<Route path="/student" element={<ProtectedRoute roles={["member"]}><StudentDashboard /></ProtectedRoute>} />
<Route
path="/books"
element={<BookCatalog />}
/>
<Route path="/member-dashboard" element={<ProtectedRoute roles={["member"]}><MemberDashboard /></ProtectedRoute>} />
<Route path="/profile" element={<Profile />} />
<Route
  path="/reading-history"
  element={<ReadingHistory />}
/>
<Route
  path="/my-issued-books"
  element={<MyIssuedBooks />}
/>

<Route path="/issue-book" element={<ProtectedRoute roles={["admin","librarian"]}><IssueBook /></ProtectedRoute>} />

<Route path="/return-book" element={<ProtectedRoute roles={["admin","librarian"]}><ReturnBook /></ProtectedRoute>} />
<Route path="/renew-book" element={<ProtectedRoute roles={["admin","librarian"]}><Renewal /></ProtectedRoute>} />
<Route path="/qr-scanner" element={<ProtectedRoute roles={["admin","librarian"]}><QRScanner /></ProtectedRoute>} />

<Route path="/reservations" element={<Reservation />} />
<Route
  path="/reservation-queue"
  element={<ProtectedRoute roles={["admin","librarian"]}><ReservationQueue /></ProtectedRoute>}
/>
<Route path="/fines" element={<ProtectedRoute roles={["admin","librarian"]}><FineManagement /></ProtectedRoute>} />
<Route
  path="/fine-payment-status"
  element={<FinePaymentStatus />}
/>
<Route
  path="/notifications"
  element={<NotificationCenter />}
/>

<Route
  path="/analytics"
  element={<ProtectedRoute roles={["admin","librarian"]}><AnalyticsDashboard /></ProtectedRoute>}
/>
<Route
  path="/reports"
  element={<ProtectedRoute roles={["admin","librarian"]}><Reports /></ProtectedRoute>}
/>
<Route
  path="/charts"
  element={<ProtectedRoute roles={["admin","librarian"]}><Charts /></ProtectedRoute>}
/>


<Route path="/ebooks" element={<EbookPage />} />
<Route path="/library-settings" element={<ProtectedRoute roles={["admin"]}><LibrarySettings /></ProtectedRoute>} />



















    </Routes>
  );
}

export default App;