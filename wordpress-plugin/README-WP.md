
# 📌 Topic Response AI – WordPress Plugin

A lightweight and powerful WordPress plugin that integrates **Topic Response AI** to generate blog topics dynamically. This plugin provides an **easy-to-use shortcode** to display AI-generated blog topics directly on your WordPress site.

---

## 📂 Folder & File Structure
This plugin follows WordPress development best practices:

```
📁 topic-response-ai
├── 📄 topic-response-ai.php (Main plugin file)
├── 📁 assets/ (Holds JavaScript & CSS)
│   ├── 📄 js/frontend.js (Frontend JavaScript file)
│   ├── 📄 css/frontend.css (CSS styles for frontend UI)
│   ├── 📄 css/styles.css (Additional global styles)
├── 📁 templates/ (Holds plugin HTML templates)
│   ├── 📄 frontend-template.php (Template file for plugin output)
├── 📄 README-WP.md (This file, detailed documentation)
```

✅ **Modular design** with separate **JS, CSS, and templates**  
✅ **Uses WindPress Plugin to load Tailwind CSS classes dynamically**  

---

## 🚀 How to Install the Plugin

1. **Download** the latest version
2. **Log in to your WordPress Admin Panel**
3. Navigate to **Plugins → Add New**
4. Click **Upload Plugin** and select **`topic-response-ai.zip`**
5. Click **Install Now**, then **Activate Plugin**
6. **Ensure the "WindPress" Plugin is Installed & Activated** to enable Tailwind CSS classes
7. The plugin is now active and ready to use!

---

## 🖥️ How to Use the Plugin

Once activated, you can embed the AI-generated blog topics anywhere using this **WordPress shortcode**:

```
[topic-response-ai]
```

Simply add this shortcode to any WordPress page, post, or widget, and it will display AI-generated blog topics dynamically.

## 🎨 Styling & Customization

### WindPress Plugin Dependency
This plugin uses Tailwind CSS classes, which are dynamically provided by the WindPress Plugin.
If WindPress is not installed, Tailwind CSS styles will not be applied correctly.

To ensure styling works correctly:

1. Make sure WindPress is installed & activated (found in Plugins → Installed Plugins)
2. If you want to load Tailwind manually, add the following in functions.php of your WordPress theme:

```php
function load_tailwind_css() {
    wp_enqueue_style('tailwind-css', 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
}
add_action('wp_enqueue_scripts', 'load_tailwind_css');
```

### Custom CSS
If you prefer custom CSS, modify:
```
/assets/css/frontend.css
```

### JavaScript Customization
Modify the frontend interactions in:
```
/assets/js/frontend.js
```

### Template Customization
To adjust plugin output, edit:
```
/templates/frontend-template.php
```

## 📝 Frequently Asked Questions

### 1️⃣ How do I customize the plugin's output?
Modify the template file `/templates/frontend-template.php`. You can change how the AI-generated content is displayed.

### 2️⃣ Does this plugin require an API key?
Yes, but it should be configured on the backend. No API keys are hardcoded in the plugin.

### 3️⃣ Does the plugin require WindPress?
Yes. The plugin relies on Tailwind CSS, which is provided dynamically by the WindPress Plugin.
If WindPress is not installed, styles may not work correctly.

### 4️⃣ How can I manually load Tailwind without WindPress?
If you prefer to load Tailwind manually, add this to your functions.php:

```php
function load_tailwind_css() {
    wp_enqueue_style('tailwind-css', 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
}
add_action('wp_enqueue_scripts', 'load_tailwind_css');
```

## 📜 License

This plugin is licensed under GPL-2.0+.
For more details, see LICENSE.
