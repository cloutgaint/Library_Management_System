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


function App() {
 
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/register" element={<Register />} />
      

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route path="/admin" element={<AdminDashboard />} />

<Route path="/librarian" element={<LibrarianDashboard />} />

<Route path="/student" element={<StudentDashboard />} />
<Route
path="/books"
element={<BookCatalog />}
/>
<Route path="/member-dashboard" element={<MemberDashboard />} />
<Route path="/profile" element={<Profile />} />
<Route
  path="/reading-history"
  element={<ReadingHistory />}
/>
<Route
  path="/my-issued-books"
  element={<MyIssuedBooks />}
/>

<Route path="/issue-book" element={<IssueBook />} />

<Route path="/return-book" element={<ReturnBook />} />
<Route path="/renew-book" element={<Renewal />} />
<Route path="/qr-scanner" element={<QRScanner />} />

<Route path="/reservations" element={<Reservation />} />
<Route
  path="/reservation-queue"
  element={<ReservationQueue />}
/>
<Route path="/fines" element={<FineManagement />} />
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
  element={<AnalyticsDashboard />}
/>
<Route
  path="/reports"
  element={<Reports />}
/>
<Route
  path="/charts"
  element={<Charts />}
/>


<Route path="/ebooks" element={<EbookPage />} />



















    </Routes>
  );
}

export default App;