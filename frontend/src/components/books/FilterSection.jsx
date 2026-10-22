function FilterSection({
  category,
  status,
  categories,
  onCategoryChange,
  onStatusChange,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-8">

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-5">

        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            Filter Books
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Narrow results by category or availability
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Category */}
        <div>

          <label className="block mb-2 font-medium text-gray-600">
            Category
          </label>

          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3
            bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
            transition"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

        </div>

        {/* Status */}
        <div>

          <label className="block mb-2 font-medium text-gray-600">
            Availability Status
          </label>

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3
            bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
            transition"
          >
            <option value="All Books">
              All Books
            </option>

            <option value="Available">
              Available
            </option>

            <option value="Issued">
              Issued
            </option>

          </select>

        </div>

      </div>

    </div>
  );
}

export default FilterSection;