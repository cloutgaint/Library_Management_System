const notifications = [
  {
    id: 1,
    title: "Book Due Soon",
    message: "Your borrowed book is due tomorrow.",
    type: "Reminder",
    time: "10 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Reservation Confirmed",
    message: "Your book reservation has been confirmed.",
    type: "Reservation",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Fine Reminder",
    message: "You have an outstanding library fine.",
    type: "Fine",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    title: "New Book Added",
    message: "A new programming book has been added to the library.",
    type: "Library",
    time: "2 days ago",
    read: true,
  },
];

export default notifications;