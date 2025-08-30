import { debounce } from "lodash";
import { Search, ChevronDown } from "lucide-react";
import type { Restaurant } from "../types";
import { useMemo, useState } from "react";

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant | null) => void;
}

type SortField = "name" | "cuisine" | "location";
type SortOrder = "asc" | "desc";

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Get unique cuisines and locations for filters
  const cuisines = useMemo(() => {
    if (!restaurants) return [];
    return Array.from(new Set(restaurants.map((r) => r.cuisine))).sort();
  }, [restaurants]);

  const locations = useMemo(() => {
    if (!restaurants) return [];
    return Array.from(new Set(restaurants.map((r) => r.location))).sort();
  }, [restaurants]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Filter and sort restaurants
  const filteredAndSortedRestaurants = useMemo(() => {
    if (!restaurants) return [];

    // Apply filters
    const filtered = restaurants.filter((r: Restaurant) => {
      const matchesSearch = r.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCuisine = !cuisineFilter || r.cuisine === cuisineFilter;
      const matchesLocation = !locationFilter || r.location === locationFilter;
      return matchesSearch && matchesCuisine && matchesLocation;
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [
    restaurants,
    searchTerm,
    cuisineFilter,
    locationFilter,
    sortBy,
    sortOrder,
  ]);

  // Toggle sort order
  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 px-2">Restaurants</h2>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search restaurants..."
          aria-label="Search restaurants"
          role="searchbox"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <select
          className="p-2 border border-gray-300 rounded-lg"
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
        >
          <option value="">All Cuisines</option>
          {cuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>

        <select
          className="p-2 border border-gray-300 rounded-lg"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        {["name", "cuisine", "location"].map((field) => (
          <button
            key={field}
            onClick={() => handleSortChange(field as SortField)}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
              sortBy === field ? "bg-indigo-100 text-indigo-700" : "bg-gray-100"
            }`}
          >
            {field.charAt(0).toUpperCase() + field.slice(1)}
            {sortBy === field && (
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  sortOrder === "desc" ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Restaurant List */}
      <div className="max-h-60 overflow-y-auto pr-2">
        <ul className="space-y-2">
          <li
            onClick={() => onSelectRestaurant(null)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              !selectedRestaurant
                ? "bg-indigo-100 text-indigo-700 font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            All Restaurants
          </li>
          {filteredAndSortedRestaurants.map((r) => (
            <li
              key={r.id}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectRestaurant(r);
                }
              }}
              onClick={() => onSelectRestaurant(r)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedRestaurant?.id === r.id
                  ? "bg-indigo-100 text-indigo-700 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-gray-500">
                {r.cuisine} - {r.location}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
