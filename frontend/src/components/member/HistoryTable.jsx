function HistoryTable({ history }) {
  return (
    <div className="w-full">

      {history.length > 0 ? (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px]">

            <thead className="bg-gray-100">

              <tr>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Book
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Author
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Borrowed
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Returned
                </th>

                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {history.map((item) => (

                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >

                  <td className="px-5 py-4 font-medium text-gray-800">
                    📖 {item.title}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.author}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.issue_date
                      ? new Date(item.issue_date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {item.return_date
                      ? new Date(item.return_date).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-center">

                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        item.transaction_status === "Returned"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.transaction_status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ) : (

        <div className="p-10 text-center">

          <div className="text-5xl mb-4">
            📚
          </div>

          <h3 className="text-xl font-bold text-gray-800">
            No Reading History
          </h3>

          <p className="text-gray-500 mt-2">
            Your borrowed and returned books will appear here.
          </p>

        </div>

      )}

    </div>
  );
}

export default HistoryTable;