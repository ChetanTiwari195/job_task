<?php
// Set headers for CORS and content type
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Pre-flight request handling
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

// --- Rate Limiting ---
// function check_rate_limit() {
//     $ip = $_SERVER['REMOTE_ADDR'];
//     $rate_limit_file = "rate_limits/{$ip}.json";
    
//     if (!is_dir('rate_limits')) {
//         mkdir('rate_limits');
//     }
    
//     $current_time = time();
//     $window_size = 60; // 1 minute
//     $max_requests = 60; // 60 requests per minute
    
//     if (file_exists($rate_limit_file)) {
//         $data = json_decode(file_get_contents($rate_limit_file), true);
//         $data = array_filter($data, function($timestamp) use ($current_time, $window_size) {
//             return $current_time - $timestamp < $window_size;
//         });
        
//         if (count($data) >= $max_requests) {
//             http_response_code(429);
//             echo json_encode(['error' => 'Too many requests. Please try again later.']);
//             exit;
//         }
        
//         $data[] = $current_time;
//     } else {
//         $data = [$current_time];
//     }
    
//     file_put_contents($rate_limit_file, json_encode($data));
// }

// Check rate limit for the request
// check_rate_limit();

// --- Data Loading ---
// Load restaurant and order data from JSON files. In a real application, this would come from a database.
$restaurants = json_decode(file_get_contents('restaurants.json'), true);
$orders = json_decode(file_get_contents('orders.json'), true);

// --- Request Parsing ---
// Get the requested endpoint from the URL path.
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', $path);
$endpoint = end($path_parts);

// --- API Routing ---
// Route the request to the appropriate function based on the endpoint.
$cache_key = get_cache_key();
$cached_response = get_cached_response($cache_key);

if ($cached_response !== null) {
    echo $cached_response;
    exit;
}

ob_start();
switch ($endpoint) {
    case 'restaurants':
        handle_restaurants($restaurants);
        break;
    case 'analytics':
        handle_analytics($orders, $restaurants);
        break;
    case 'trends':
        handle_trends($orders);
        break;
    case 'statistics':
        handle_statistics($orders, $restaurants);
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
$response = ob_get_clean();
set_cached_response($cache_key, $response);
echo $response;

// --- Handler Functions ---

/**
 * Handles requests for the /restaurants endpoint.
 * Supports searching, filtering by cuisine/location, sorting, and pagination.
 */
function handle_restaurants($restaurants) {
    $filtered_restaurants = $restaurants;

    // Search by name
    if (isset($_GET['search'])) {
        $search_term = strtolower($_GET['search']);
        $filtered_restaurants = array_filter($filtered_restaurants, function($r) use ($search_term) {
            return strpos(strtolower($r['name']), $search_term) !== false;
        });
    }

    // Filter by cuisine
    if (isset($_GET['cuisine'])) {
        $cuisine = $_GET['cuisine'];
        $filtered_restaurants = array_filter($filtered_restaurants, function($r) use ($cuisine) {
            return $r['cuisine'] === $cuisine;
        });
    }

    // Filter by location
    if (isset($_GET['location'])) {
        $location = $_GET['location'];
        $filtered_restaurants = array_filter($filtered_restaurants, function($r) use ($location) {
            return $r['location'] === $location;
        });
    }
    
    // Sort results
    if (isset($_GET['sortBy'])) {
        $sort_by = $_GET['sortBy'];
        $sort_order = isset($_GET['order']) && strtolower($_GET['order']) === 'desc' ? SORT_DESC : SORT_ASC;
        
        usort($filtered_restaurants, function($a, $b) use ($sort_by, $sort_order) {
            if ($sort_order === SORT_ASC) {
                return $a[$sort_by] <=> $b[$sort_by];
            } else {
                return $b[$sort_by] <=> $a[$sort_by];
            }
        });
    }

    // Get pagination parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;

    // Apply pagination
    $total_items = count($filtered_restaurants);
    $total_pages = ceil($total_items / $per_page);
    $offset = ($page - 1) * $per_page;
    
    $paginated_results = array_slice($filtered_restaurants, $offset, $per_page);
    
    echo json_encode([
        'data' => array_values($paginated_results),
        'meta' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total_items' => $total_items,
            'total_pages' => $total_pages
        ]
    ]);
}

/**
 * Handles requests for the /analytics endpoint.
 * Calculates metrics based on various filters like date range, restaurant, etc.
 */
function handle_analytics($orders, $restaurants) {
    // Validate date range
    $date_error = validate_date_range(
        $_GET['startDate'] ?? null,
        $_GET['endDate'] ?? null
    );
    if ($date_error) {
        http_response_code(400);
        echo json_encode(['error' => $date_error]);
        return;
    }
    
    // Validate amount range
    $amount_error = validate_numeric_range(
        $_GET['minAmount'] ?? null,
        $_GET['maxAmount'] ?? null,
        'amount'
    );
    if ($amount_error) {
        http_response_code(400);
        echo json_encode(['error' => $amount_error]);
        return;
    }
    
    // Validate hour range
    $hour_error = validate_numeric_range(
        $_GET['startHour'] ?? null,
        $_GET['endHour'] ?? null,
        'hour'
    );
    if ($hour_error) {
        http_response_code(400);
        echo json_encode(['error' => $hour_error]);
        return;
    }

    $filtered_orders = $orders;

    // Filter by restaurant ID
    if (isset($_GET['restaurant_id'])) {
        $restaurant_id = (int)$_GET['restaurant_id'];
        $filtered_orders = array_filter($filtered_orders, function($order) use ($restaurant_id) {
            return $order['restaurant_id'] === $restaurant_id;
        });
    }

    // Filter by date range
    $start_date = isset($_GET['startDate']) ? new DateTime($_GET['startDate']) : null;
    $end_date = isset($_GET['endDate']) ? (new DateTime($_GET['endDate']))->setTime(23, 59, 59) : null;
    if ($start_date && $end_date) {
        $filtered_orders = array_filter($filtered_orders, function($order) use ($start_date, $end_date) {
            $order_date = new DateTime($order['order_time']);
            return $order_date >= $start_date && $order_date <= $end_date;
        });
    }
    
    // Filter by amount range
    $min_amount = isset($_GET['minAmount']) ? (float)$_GET['minAmount'] : null;
    $max_amount = isset($_GET['maxAmount']) ? (float)$_GET['maxAmount'] : null;
    if ($min_amount !== null && $max_amount !== null) {
        $filtered_orders = array_filter($filtered_orders, function($order) use ($min_amount, $max_amount) {
            return $order['order_amount'] >= $min_amount && $order['order_amount'] <= $max_amount;
        });
    }

    // Filter by hour range
    $start_hour = isset($_GET['startHour']) ? (int)$_GET['startHour'] : null;
    $end_hour = isset($_GET['endHour']) ? (int)$_GET['endHour'] : null;
     if ($start_hour !== null && $end_hour !== null) {
        $filtered_orders = array_filter($filtered_orders, function($order) use ($start_hour, $end_hour) {
            $order_hour = (int)(new DateTime($order['order_time']))->format('G');
            return $order_hour >= $start_hour && $order_hour <= $end_hour;
        });
    }

    // --- Analytics Calculations ---
    $daily_data = [];
    $total_revenue = 0;
    $total_orders = count($filtered_orders);

    foreach ($filtered_orders as $order) {
        $date = (new DateTime($order['order_time']))->format('Y-m-d');
        $hour = (int)(new DateTime($order['order_time']))->format('G');
        
        if (!isset($daily_data[$date])) {
            $daily_data[$date] = [
                'date' => $date,
                'orders' => 0,
                'revenue' => 0,
                'hourly_orders' => array_fill(0, 24, 0)
            ];
        }
        
        $daily_data[$date]['orders']++;
        $daily_data[$date]['revenue'] += $order['order_amount'];
        $daily_data[$date]['hourly_orders'][$hour]++;
        $total_revenue += $order['order_amount'];
    }

    // Calculate peak hour for each day
    foreach ($daily_data as $date => &$data) {
        $peak_hour = array_keys($data['hourly_orders'], max($data['hourly_orders']))[0];
        $data['peak_hour'] = $peak_hour . ':00 - ' . ($peak_hour + 1) . ':00';
        unset($data['hourly_orders']); // Clean up response
    }

    // Sort daily data by date
    ksort($daily_data);

    // --- Top Restaurants Calculation ---
    // Note: This calculation ignores the restaurant_id filter to find the overall top restaurants
    $restaurant_revenue = [];
    $top_restaurants_orders = $orders; // Use original orders for this metric
    
    // Apply date filter if present
    if ($start_date && $end_date) {
        $top_restaurants_orders = array_filter($top_restaurants_orders, function($order) use ($start_date, $end_date) {
            $order_date = new DateTime($order['order_time']);
            return $order_date >= $start_date && $order_date <= $end_date;
        });
    }

    foreach ($top_restaurants_orders as $order) {
        $id = $order['restaurant_id'];
        if (!isset($restaurant_revenue[$id])) {
            $restaurant_revenue[$id] = 0;
        }
        $restaurant_revenue[$id] += $order['order_amount'];
    }
    arsort($restaurant_revenue);
    
    $top_3_restaurants = [];
    $count = 0;
    foreach ($restaurant_revenue as $id => $revenue) {
        if ($count >= 3) break;
        $restaurant_info = array_values(array_filter($restaurants, function($r) use ($id) {
            return $r['id'] === $id;
        }));
        if (!empty($restaurant_info)) {
            $top_3_restaurants[] = [
                'name' => $restaurant_info[0]['name'],
                'revenue' => $revenue
            ];
        }
        $count++;
    }

    // --- Final Response Assembly ---
    $response = [
        'summary' => [
            'total_revenue' => $total_revenue,
            'total_orders' => $total_orders,
            'average_order_value' => $total_orders > 0 ? round($total_revenue / $total_orders, 2) : 0,
        ],
        'daily_trends' => array_values($daily_data),
        'top_restaurants' => $top_3_restaurants
    ];

    echo json_encode($response);
}

/**
 * Handles requests for the /trends endpoint.
 * Returns hourly, daily, and weekly trends
 */
function handle_trends($orders) {
    $filtered_orders = array_filter($orders, function($order) {
        $order_date = new DateTime($order['order_time']);
        $now = new DateTime();
        $diff = $now->diff($order_date);
        return $diff->days <= 30; // Last 30 days
    });
    
    $hourly_trends = [];
    $daily_trends = [];
    $weekly_trends = [];
    
    foreach ($filtered_orders as $order) {
        $datetime = new DateTime($order['order_time']);
        $hour = $datetime->format('H');
        $date = $datetime->format('Y-m-d');
        $week = $datetime->format('W');
        
        // Aggregate hourly data
        if (!isset($hourly_trends[$hour])) {
            $hourly_trends[$hour] = ['orders' => 0, 'revenue' => 0];
        }
        $hourly_trends[$hour]['orders']++;
        $hourly_trends[$hour]['revenue'] += $order['order_amount'];
        
        // Aggregate daily data
        if (!isset($daily_trends[$date])) {
            $daily_trends[$date] = ['orders' => 0, 'revenue' => 0];
        }
        $daily_trends[$date]['orders']++;
        $daily_trends[$date]['revenue'] += $order['order_amount'];
        
        // Aggregate weekly data
        if (!isset($weekly_trends[$week])) {
            $weekly_trends[$week] = ['orders' => 0, 'revenue' => 0];
        }
        $weekly_trends[$week]['orders']++;
        $weekly_trends[$week]['revenue'] += $order['order_amount'];
    }
    
    echo json_encode([
        'hourly' => $hourly_trends,
        'daily' => $daily_trends,
        'weekly' => $weekly_trends
    ]);
}

/**
 * Handles requests for the /statistics endpoint.
 * Returns advanced statistics and insights
 */
function handle_statistics($orders, $restaurants) {
    $stats = [
        'peak_hours' => [],
        'restaurant_performance' => [],
        'growth_metrics' => []
    ];
    
    // Calculate peak hours for each day of the week
    $day_hours = [];
    foreach ($orders as $order) {
        $datetime = new DateTime($order['order_time']);
        $day = $datetime->format('w'); // 0 (Sunday) to 6 (Saturday)
        $hour = $datetime->format('H');
        
        if (!isset($day_hours[$day][$hour])) {
            $day_hours[$day][$hour] = 0;
        }
        $day_hours[$day][$hour]++;
    }
    
    foreach ($day_hours as $day => $hours) {
        arsort($hours);
        $stats['peak_hours'][$day] = array_slice(array_keys($hours), 0, 3);
    }
    
    // Calculate restaurant performance metrics
    foreach ($restaurants as $restaurant) {
        $restaurant_orders = array_filter($orders, function($order) use ($restaurant) {
            return $order['restaurant_id'] === $restaurant['id'];
        });
        
        $total_revenue = array_sum(array_column($restaurant_orders, 'order_amount'));
        $total_orders = count($restaurant_orders);
        
        $stats['restaurant_performance'][$restaurant['id']] = [
            'name' => $restaurant['name'],
            'total_revenue' => $total_revenue,
            'total_orders' => $total_orders,
            'average_order_value' => $total_orders > 0 ? $total_revenue / $total_orders : 0
        ];
    }
    
    echo json_encode($stats);
}

/**
 * Validates date range parameters
 */
function validate_date_range($start_date, $end_date) {
    if ($start_date && $end_date) {
        $start = new DateTime($start_date);
        $end = new DateTime($end_date);
        $now = new DateTime();
        
        if ($start > $end) {
            return "Start date cannot be after end date";
        }
        if ($start > $now || $end > $now) {
            return "Dates cannot be in the future";
        }
    }
    return null;
}

/**
 * Validates numeric range parameters
 */
function validate_numeric_range($min, $max, $field) {
    if ($min !== null && $max !== null) {
        if (!is_numeric($min) || !is_numeric($max)) {
            return "$field must be numeric";
        }
        if ($min > $max) {
            return "Minimum $field cannot be greater than maximum";
        }
    }
    return null;
}

// --- Caching Functions ---
function get_cache_key() {
    return md5($_SERVER['REQUEST_URI']);
}

function get_cached_response($key) {
    $cache_file = "cache/{$key}.json";
    if (file_exists($cache_file) && (time() - filemtime($cache_file) < 300)) { // 5 minutes cache
        return file_get_contents($cache_file);
    }
    return null;
}

function set_cached_response($key, $data) {
    if (!is_dir('cache')) {
        mkdir('cache');
    }
    file_put_contents("cache/{$key}.json", $data);
}
?>
