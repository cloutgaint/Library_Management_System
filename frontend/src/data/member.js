const member = {
  id: "MEM001",
  name: "John Doe",
  email: "john@example.com",
  phone: "+91 9876543210",
  membershipType: "Premium",
  joinedDate: "15 Jan 2025",
  validTill: "15 Jan 2027",

  stats: {
    borrowed: 12,
    returned: 20,
    due: 2,
  },
};
member.history = [
  {
    id: 1,
    book: "Java Programming",
    borrowed: "01 Jul 2026",
    returned: "15 Jul 2026",
    status: "Returned",
  },
  {
    id: 2,
    book: "Python Basics",
    borrowed: "18 Jul 2026",
    returned: "-",
    status: "Borrowed",
  },
  {
    id: 3,
    book: "Database Management System",
    borrowed: "22 Jul 2026",
    returned: "-",
    status: "Borrowed",
  },
];

export default member;