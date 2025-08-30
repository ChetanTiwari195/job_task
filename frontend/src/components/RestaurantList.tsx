import { debounce } from "lodash";
import { Search } from "lucide-react";
import type { Restaurant } from "../types";
import { useMemo, useState } from "react";

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant | null) => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Filter restaurants based on search term
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];
    return restaurants.filter((r: Restaurant) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [restaurants, searchTerm]);

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 px-2">Restaurants</h2>
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
          {filteredRestaurants.map((r) => (
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
