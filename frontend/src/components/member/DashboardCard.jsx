function DashboardCard({ title, value, color }) {
  return (
    <div
      className={`rounded-2xl shadow-lg p-6 text-white ${color} hover:scale-105 transition duration-300`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="text-4xl font-bold mt-4">
        {value}
      </p>
    </div>
  );
}

export default DashboardCard;