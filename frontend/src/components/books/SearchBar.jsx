import { FaSearch } from "react-icons/fa";

function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-6">

      <label className="block text-lg font-semibold text-gray-700 mb-3">
        Search Books
      </label>

      <div className="relative">

        <FaSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, author or ISBN..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-blue-500
          transition"
        />

      </div>

    </div>
  );
}

export default SearchBar;