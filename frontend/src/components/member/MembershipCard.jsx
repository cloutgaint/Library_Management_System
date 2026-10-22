function MembershipCard({ member }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white">

        <div className="p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Library Management System
            </h2>

            <p className="text-blue-100 text-sm">
              Digital Membership Card
            </p>
          </div>

          <div className="bg-white text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
            {member.membership_status}
          </div>
        </div>

        <div className="bg-white text-gray-800 rounded-t-3xl p-8">
          <div className="flex items-center gap-5">
<img
  src={
    member.profile_image
      ? `http://localhost:5000${member.profile_image}`
      : "/default-profile.png"
  }
  alt="Profile"
  className="w-24 h-24 rounded-full border-4 border-blue-600 object-cover"
/>
            <div>
              <h3 className="text-2xl font-bold">
                {member.full_name}
              </h3>

              <p className="text-gray-500">
                Member ID: {member.id}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex justify-between">
              <span className="font-semibold">Email</span>
              <span>{member.email}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">Phone</span>
              <span>{member.phone || "Not provided"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">Valid Till</span>
              <span>{member.membership_expiry}</span>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-gray-900 h-16 rounded-lg flex items-center justify-center">
              <div className="tracking-[6px] text-white text-xl">
                || |||| ||| || |||| |||
              </div>
            </div>

            <p className="text-center mt-3 text-gray-500 text-sm">
              Member Barcode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipCard;