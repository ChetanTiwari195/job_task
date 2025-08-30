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

// --- Data Loading ---
$restaurants = json_decode(file_get_contents('restaurants.json'), true);
$orders = json_decode(file_get_contents('orders.json'), true);

// --- Request Parsing ---
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', $path);
$endpoint = end($path_parts);

// --- API Routing ---
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

function handle_analytics($orders, $restaurants) {
    // Validate inputs
    $date_error = validate_date_range(
        $_GET['startDate'] ?? null,
        $_GET['endDate'] ?? null
    );
    if ($date_error) {
        http_response_code(400);
        echo json_encode(['error' => $date_error]);
        return;
    }
    
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
    
    // Apply all filters
    $filtered_orders = apply_filters($filtered_orders, $_GET);
    
    // Calculate analytics
    $daily_data = [];
    $total_revenue = 0;
    $total_orders = count($filtered_orders);
    $weekly_peak_hours = array_fill(0, 7, array_fill(0, 24, 0));

    foreach ($filtered_orders as $order) {
        $datetime = new DateTime($order['order_time']);
        $date = $datetime->format('Y-m-d');
        $hour = (int)$datetime->format('G');
        $day_of_week = (int)$datetime->format('w');
        
        // Initialize daily data
        if (!isset($daily_data[$date])) {
            $daily_data[$date] = [
                'date' => $date,
                'orders' => 0,
                'revenue' => 0,
                'hourly_orders' => array_fill(0, 24, 0)
            ];
        }
        
        // Update metrics
        $daily_data[$date]['orders']++;
        $daily_data[$date]['revenue'] += $order['order_amount'];
        $daily_data[$date]['hourly_orders'][$hour]++;
        $weekly_peak_hours[$day_of_week][$hour]++;
        $total_revenue += $order['order_amount'];
    }

    // Calculate daily peak hours
    foreach ($daily_data as $date => &$data) {
        $max_orders = max($data['hourly_orders']);
        if ($max_orders > 0) {
            $peak_hour = array_search($max_orders, $data['hourly_orders']);
            $data['peak_hour'] = sprintf('%02d:00 - %02d:00', $peak_hour, ($peak_hour + 1) % 24);
        } else {
            $data['peak_hour'] = 'No orders';
        }
        unset($data['hourly_orders']);
    }

    // Calculate weekly peak hours - return top 3 hours for each day
    $peak_hours_formatted = [];
    for ($day = 0; $day < 7; $day++) {
        $day_hours = $weekly_peak_hours[$day];
        arsort($day_hours);
        
        $top_hours = [];
        $count = 0;
        foreach ($day_hours as $hour => $order_count) {
            if ($order_count > 0 && $count < 3) {
                $top_hours[] = sprintf('%02d:00 - %02d:00', $hour, ($hour + 1) % 24);
                $count++;
            }
        }
        $peak_hours_formatted[$day] = $top_hours;
    }

    // Sort daily data by date
    ksort($daily_data);

    // Calculate top restaurants (use all orders for overall ranking)
    $top_restaurants = calculate_top_restaurants($orders, $restaurants, $_GET);

    $response = [
        'summary' => [
            'total_revenue' => round($total_revenue, 2),
            'total_orders' => $total_orders,
            'average_order_value' => $total_orders > 0 ? round($total_revenue / $total_orders, 2) : 0,
        ],
        'daily_trends' => array_values($daily_data),
        'top_restaurants' => $top_restaurants,
        'peak_hours' => $peak_hours_formatted
    ];

    echo json_encode($response);
}

function apply_filters($orders, $params) {
    $filtered_orders = $orders;
    
    // Filter by restaurant ID
    if (isset($params['restaurant_id']) && !empty($params['restaurant_id'])) {
        $restaurant_id = (int)$params['restaurant_id'];
        $filtered_orders = array_filter($filtered_orders, function($order) use ($restaurant_id) {
            return $order['restaurant_id'] === $restaurant_id;
        });
    }

    // Filter by date range
    if (isset($params['startDate']) && isset($params['endDate'])) {
        $start_date = new DateTime($params['startDate']);
        $end_date = (new DateTime($params['endDate']))->setTime(23, 59, 59);
        
        $filtered_orders = array_filter($filtered_orders, function($order) use ($start_date, $end_date) {
            $order_date = new DateTime($order['order_time']);
            return $order_date >= $start_date && $order_date <= $end_date;
        });
    }
    
    // Filter by amount range
    if (isset($params['minAmount']) && isset($params['maxAmount'])) {
        $min_amount = (float)$params['minAmount'];
        $max_amount = (float)$params['maxAmount'];
        
        $filtered_orders = array_filter($filtered_orders, function($order) use ($min_amount, $max_amount) {
            return $order['order_amount'] >= $min_amount && $order['order_amount'] <= $max_amount;
        });
    }

    // Filter by hour range
    if (isset($params['startHour']) && isset($params['endHour'])) {
        $start_hour = (int)$params['startHour'];
        $end_hour = (int)$params['endHour'];
        
        $filtered_orders = array_filter($filtered_orders, function($order) use ($start_hour, $end_hour) {
            $order_hour = (int)(new DateTime($order['order_time']))->format('G');
            return $order_hour >= $start_hour && $order_hour <= $end_hour;
        });
    }

    return $filtered_orders;
}

function calculate_top_restaurants($orders, $restaurants, $params) {
    // Apply date filter for top restaurants calculation
    $top_restaurants_orders = $orders;
    
    if (isset($params['startDate']) && isset($params['endDate'])) {
        $start_date = new DateTime($params['startDate']);
        $end_date = (new DateTime($params['endDate']))->setTime(23, 59, 59);
        
        $top_restaurants_orders = array_filter($top_restaurants_orders, function($order) use ($start_date, $end_date) {
            $order_date = new DateTime($order['order_time']);
            return $order_date >= $start_date && $order_date <= $end_date;
        });
    }

    $restaurant_revenue = [];
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
                'revenue' => round($revenue, 2)
            ];
        }
        $count++;
    }
    
    return $top_3_restaurants;
}

function handle_trends($orders) {
    $filtered_orders = array_filter($orders, function($order) {
        $order_date = new DateTime($order['order_time']);
        $now = new DateTime();
        $diff = $now->diff($order_date);
        return $diff->days <= 30;
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
        $day = $datetime->format('w');
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

function validate_date_range($start_date, $end_date) {
    if ($start_date && $end_date) {
        try {
            $start = new DateTime($start_date);
            $end = new DateTime($end_date);
            $now = new DateTime();
            
            if ($start > $end) {
                return "Start date cannot be after end date";
            }
            if ($start > $now || $end > $now) {
                return "Dates cannot be in the future";
            }
        } catch (Exception $e) {
            return "Invalid date format";
        }
    }
    return null;
}

function validate_numeric_range($min, $max, $field) {
    if ($min !== null && $max !== null) {
        if (!is_numeric($min) || !is_numeric($max)) {
            return "$field must be numeric";
        }
        $min = (float)$min;
        $max = (float)$max;
        if ($min > $max) {
            return "Minimum $field cannot be greater than maximum";
        }
        if ($field === 'hour' && ($min < 0 || $max > 23)) {
            return "Hour must be between 0 and 23";
        }
    }
    return null;
}

// --- Caching Functions ---
function get_cache_key() {
    return md5($_SERVER['REQUEST_URI'] . serialize($_GET));
}

function get_cached_response($key) {
    $cache_file = "cache/{$key}.json";
    if (file_exists($cache_file) && (time() - filemtime($cache_file) < 300)) {
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