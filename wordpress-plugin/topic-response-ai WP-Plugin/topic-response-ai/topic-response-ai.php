<?php 
/*
Plugin Name: Topic Response AI
Description: WordPress frontend integration for the TopicResponseAI backend.
Version: 1.0
Author: Your Name
*/

// Load CSS and JS
function tra_enqueue_assets() {
    $plugin_url = plugins_url( '', __FILE__ );

    // Load FontAwesome from CDN
    wp_enqueue_style(
        'fontawesome',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        [],
        '6.5.1'
    );

    // Load frontend CSS
    wp_enqueue_style(
        'tra-frontend-style',
        $plugin_url . '/assets/css/frontend.css',
        [],
        '1.0'
    );

    // Load frontend JS
    wp_enqueue_script(
        'tra-frontend-script',
        $plugin_url . '/assets/js/frontend.js',
        ['jquery'],
        '1.0',
        true
    );

    // Securely pass API URL and API Key to JavaScript
    wp_localize_script(
        'tra-frontend-script',
        'tra_vars',
        [
            'api_url' => 'https://app.topicresponseai.com/api',
            'api_key' => defined('TRA_API_KEY') ? TRA_API_KEY : '',
            'cors_token' => defined('CORS_TOKEN') ? CORS_TOKEN : '' // Pass CORS token
        ]
    );
}
add_action( 'wp_enqueue_scripts', 'tra_enqueue_assets' );

// Shortcode to load the frontend template
function tra_shortcode() {
    ob_start();
    include plugin_dir_path(__FILE__) . 'templates/frontend-template.php';
    return ob_get_clean();
}
add_shortcode('topic_response_ai', 'tra_shortcode');

// Handle API Request Proxy with CORS Token Validation
function tra_proxy_api_request() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Validate the CORS Token
        $received_cors_token = $_SERVER['HTTP_X_CORS_TOKEN'] ?? '';

        if (!defined('CORS_TOKEN') || empty($received_cors_token) || $received_cors_token !== CORS_TOKEN) {
            http_response_code(403);
            echo json_encode(["error" => "Invalid or missing CORS token"]);
            exit;
        }

        // Retrieve API Key securely
        $auth_api_key = defined('TRA_API_KEY') ? TRA_API_KEY : '';
        if (empty($auth_api_key)) {
            http_response_code(500);
            echo json_encode(["error" => "API key not configured"]);
            exit;
        }

        // Forward the request to TopicResponseAI API
        $request_body = json_decode(file_get_contents('php://input'), true);
        $response = wp_remote_post('https://app.topicresponseai.com/api/topics', [
            'headers' => [
                'Content-Type' => 'application/json',
                'x-api-key' => $auth_api_key,
                'x-cors-token' => CORS_TOKEN
            ],
            'body' => json_encode($request_body)
        ]);

        if (is_wp_error($response)) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to reach TopicResponseAI API"]);
            exit;
        }

        echo wp_remote_retrieve_body($response);
        exit;
    }
}
add_action('wp_ajax_tra_proxy_api_request', 'tra_proxy_api_request');
add_action('wp_ajax_nopriv_tra_proxy_api_request', 'tra_proxy_api_request');
