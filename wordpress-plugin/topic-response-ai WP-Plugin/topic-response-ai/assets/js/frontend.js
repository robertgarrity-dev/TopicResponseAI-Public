jQuery(document).ready(function ($) { 
    const topicsContainer = $('#tra-topics-list');
    const formContainer = $('#tra-create-topic');

    // Inject Display Topic Filter (Categories & Items per Page)
    const filterContainer = $(`
        <div id="display-topic-filter">
            <label for="category-select">Categories:</label>
            <select id="category-select">
                <option value="all">All Categories</option>
            </select>

            <label for="items-per-page">Items per Page:</label>
            <select id="items-per-page">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
                <option value="50">50</option>
            </select>
        </div>
    `);
    topicsContainer.before(filterContainer);

    formContainer.html(getCreateTopicForm());

    $(document).ready(function () {
        loadCategories();
        loadTopics(); // ✅ Now runs only when the document is ready
    });

    $('#existing-category-select').hide();
    $('#new-category-input').hide();

    $(document).on('change', 'input[name="category-type"]', function () {
        const selected = $(this).val();
        if (selected === 'existing') {
            $('#existing-category-select').show();
            $('#new-category-input').hide();
        } else if (selected === 'new') {
            $('#existing-category-select').hide();
            $('#new-category-input').show();
        } else {
            $('#existing-category-select').hide();
            $('#new-category-input').hide();
        }
    });

    // Reload topics when category or items per page change
    $(document).on('change', '#category-select, #items-per-page', function () {
        loadTopics(1); // Load topics without manually passing the category (handled in loadTopics)
    });

    $(document).on('submit', '#create-topic-form', function (e) {
        e.preventDefault();

        const title = $('#topic-title').val();
        const description = $('#topic-description').val();
        const categoryType = $('input[name="category-type"]:checked').val();
        const category = categoryType === 'existing'
            ? $('#existing-category').val()
            : $('#new-category').val();

        if (!title || !description || !categoryType || !category) {
            alert('Please complete all fields.');
            return;
        }

        const postData = { title, description, categoryType, category };

        fetch(`${tra_vars.api_url}/topics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': tra_vars.api_key,  // ✅ Securely pass API Key
                'x-cors-token': tra_vars.cors_token // ✅ Securely pass CORS Token
            },
            body: JSON.stringify(postData),
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to create topic.');
                return response.json();
            })
            .then(() => {
                alert('Topic created successfully!');
                loadTopics();
                loadCategories();
                $('#create-topic-form')[0].reset();
                $('#existing-category-select').hide();
                $('#new-category-input').hide();
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    });

    let currentPage; // Declare without initializing
    let totalPages = 0;
    const pageSize = 10;

    $(document).ready(function () {
        currentPage = 1; // Initialize inside jQuery ready function
    });

    function loadTopics(page = 1) {
        currentPage = page;
        topicsContainer.html('<p>Fetching topics...</p>');
        const selectedPageSize = $('#items-per-page').val() || pageSize; // Get selected page size
        const selectedCategory = $('#category-select').val();
        const categoryFilter = selectedCategory === "all" ? "" : `&category=${encodeURIComponent(selectedCategory)}`;

        fetch(`${tra_vars.api_url}/topics?format=paginated&page=${page}&pageSize=${selectedPageSize}${categoryFilter}`, {

            headers: {
                'x-api-key': tra_vars.api_key,  // ✅ Securely pass API Key
                'x-cors-token': tra_vars.cors_token // ✅ Securely pass CORS Token
            }
        })
            .then(response => response.json())
            .then(data => {
                let topics, total, pages;

                if (Array.isArray(data)) {
                    // ✅ API returned a plain array (adjust handling)
                    topics = data;
                    total = data.length; // Total count is the array length
                    pages = Math.ceil(total / pageSize); // Calculate total pages
                } else if (data.items) {
                    // ✅ API returned expected paginated object format
                    topics = data.items;
                    total = data.total;
                    pages = data.totalPages;
                } else {
                    console.error('Unexpected API response format:', data);
                    topicsContainer.html('<p>Error loading topics. Please try again.</p>');
                    return;
                }

                totalPages = pages;

                if (!topics || topics.length === 0) {
                    topicsContainer.html('<p>No topics found.</p>');
                    return;
                }

                let html = '<div class="topics-list">';
                topics.forEach(topic => {
                    const topicHtml = `
                        <div class="topic rounded-lg border bg-white text-gray-900 shadow-sm p-6" data-id="${topic.id}">
                            <!-- Header with Title and Buttons -->
                            <div class="topic-header flex justify-between items-center">
                                <h3 class="text-2xl font-semibold leading-none tracking-tight">${topic.title}</h3>
                                
                                <!-- Buttons aligned to the right -->
                                <div class="topic-buttons flex space-x-3">
                                    <button class="generate-ideas px-4 py-2 bg-green-500 text-white text-sm font-medium rounded shadow-sm hover:bg-green-600">
                                        <i class="fas fa-magic"></i> Generate Ideas
                                    </button>
                                    <button class="delete-topic-btn px-3 py-2 bg-red-500 text-white text-sm font-medium rounded shadow-sm hover:bg-red-600">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Topic Description -->
                            <p class="text-sm text-gray-600 mt-2">${topic.description}</p>

                            <!-- Topic Category -->
                            <span class="text-sm text-gray-900 bg-gray-200 px-3 py-2 rounded-lg">${topic.category}</span>

                            <!-- AI Suggestions -->
                            <div class="ai-suggestions mt-4">
                                <button class="toggle-suggestions">Show AI Suggestions</button>
                                <div class="suggestions-content hidden">
                                    <pre>${topic.aiSuggestions || "No AI suggestions available."}</pre>
                                </div>
                            </div>
                        </div>
                    `;
                    html += topicHtml;
                });
                html += '</div>';

                // Add pagination controls
                // Ensure variables are properly defined before use
                const startIndex = (currentPage - 1) * selectedPageSize + 1;
                const endIndex = Math.min(currentPage * selectedPageSize, total);

                // Add pagination controls with left/right justification
                html += `
                    <div class="pagination flex justify-between items-center mt-4">
                        <p class="pagination-info text-sm text-gray-600 ml-2">Showing ${startIndex} to ${endIndex} of ${total} topics</p>
                        <div class="pagination-buttons flex items-center space-x-2">
                `;

                // Previous button
                if (currentPage > 1) {
                    html += `
                        <button class="page-btn prev-btn border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3" data-page="${currentPage - 1}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left h-4 w-4">
                                <path d="m15 18-6-6 6-6"></path>
                            </svg>
                        </button>`;
                }

                // Page numbers
                for (let i = 1; i <= totalPages; i++) {
                    html += `
                        <button class="page-btn ${i === currentPage ? 'current' : ''} h-9 rounded-md px-3" data-page="${i}">
                            ${i}
                        </button>`;
                }

                // Next button
                if (currentPage < totalPages) {
                    html += `
                        <button class="page-btn next-btn border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3" data-page="${currentPage + 1}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right h-4 w-4">
                                <path d="m9 18 6-6-6-6"></path>
                            </svg>
                        </button>`;
                }

                html += `</div></div>`; // Close pagination div

                topicsContainer.html(html);

                // Add click handlers for pagination buttons
                $('.page-btn').click(function() {
                    const page = $(this).data('page');
                    const selectedCategory = $('#category-select').val();
                    loadTopics(page, selectedCategory);
                });

                // Initialize topic action handlers once
                addSuggestionToggles();
                addTopicActions();
            })
            .catch(error => {
                console.error('Error fetching topics:', error);
                topicsContainer.html('<p>Error loading topics. Please try again.</p>');
            });
    }

    function loadCategories() {
        fetch(`${tra_vars.api_url}/categories`, {
            headers: {
                'x-api-key': tra_vars.api_key,  // ✅ Securely pass API Key
                'x-cors-token': tra_vars.cors_token // ✅ Securely pass CORS Token
            }
        })
            .then(response => response.json())
            .then(data => {
            const categories = Array.isArray(data) ? data.sort() : [];

            const categorySelect = $('#existing-category');
            const filterSelect = $('#category-select');

            if (!Array.isArray(data)) {
                console.error("Invalid categories response:", data);
                return;
            }
                categorySelect.empty();
                filterSelect.html('<option value="all">All Categories</option>');

                categorySelect.append('<option value="">Select a category</option>');

                if (categories.length) {
                    categories.forEach(category => {
                        categorySelect.append(
                            `<option value="${category}">${category}</option>`
                        );
                        filterSelect.append(
                            `<option value="${category}">${category}</option>`
                        );
                    });
                } else {
                    categorySelect.append(
                        '<option value="">No categories available</option>'
                    );
                }
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    function renderTopics(topics) {
        topicsContainer.empty();
        if (!topics.length) {
            topicsContainer.html('<p>No topics found.</p>');
            return;
        }

        topics.forEach(topic => {
            const topicHtml = `
                <div class="topic" data-id="${topic.id}">
                    <h2 class="topic-title">
                        ${topic.title}
                        <div class="topic-buttons">
                            <button class="generate-ideas">
                                <i class="fas fa-magic"></i> Generate Ideas
                            </button>
                            <button class="delete-topic-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </h2>
                    <p class="topic-description">${topic.description}</p>
                    <span class="topic-category px-2 py-1 text-gray-700 bg-gray-100 rounded">${topic.category}</span>
                    <div class="ai-suggestions">
                        <button class="toggle-suggestions">Show AI Suggestions</button>
                        <div class="suggestions-content" style="display: none;">
                            <div class="ai-suggestions-content">${topic.aiSuggestions || "No AI suggestions available."}</div>
                        </div>
                    </div>                </div>
            `;
            topicsContainer.append(topicHtml);
        });

        addSuggestionToggles();
        addTopicActions();
    }

    function addSuggestionToggles() {
        $(document).off('click', '.toggle-suggestions').on('click', '.toggle-suggestions', function () {
            const suggestions = $(this).next('.suggestions-content');
            suggestions.toggle();
            $(this).text(
                suggestions.is(':visible')
                    ? 'Hide AI Suggestions'
                    : 'Show AI Suggestions'
            );
        });
    }

    function addTopicActions() {
        $(document).off('click', '.generate-ideas').on('click', '.generate-ideas', function () {
            const topicElement = $(this).closest('.topic');
            const topicId = topicElement.data('id');
            const button = $(this);
            const suggestionsContent = topicElement.find('.suggestions-content');
            const toggleButton = topicElement.find('.toggle-suggestions');

            button.html('<i class="fas fa-spinner fa-spin"></i> Generating...').prop('disabled', true);

            fetch(`${tra_vars.api_url}/topics/${topicId}/suggestions`, {
                method: 'POST',
                headers: {
                    'x-api-key': tra_vars.api_key,
                    'x-cors-token': tra_vars.cors_token
                }
            })
                .then(response => {
                    if (!response.ok) throw new Error('⚠️Warning! Failed to generate ideas. Limits enforced for this Demo-Only app. Exceeded attempts. Try again after 60 seconds.');
                    return response.json();
                })
                .then(data => {
                    let rawText = data.aiSuggestions || "No AI suggestions available.";

                    // Clean up unwanted whitespace, extra lines, and indentation
                    let cleanText = rawText
                        .replace(/```(?:html|markdown)?\s*/g, '')  // ✅ Remove ```html, ```markdown, or just ```
                        .replace(/```\s*$/g, '')     // ✅ Remove closing ```
                        .trim() // ✅ Ensure clean formatting
                        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Collapse multiple newlines
                        .replace(/[ \t]+/g, ' ') // Remove excessive spaces/tabs
                        .replace(/\n{3,}/g, '\n\n') // Ensure no more than 2 consecutive newlines
                        .replace(/\s+$/gm, '') // Trim trailing spaces from each line
                        .replace(/\n{2,}(?=[^\n])/g, '\n\n'); // Prevent excessive spacing between sections

                    // Convert Markdown-style formatting to HTML
                    cleanText = cleanText
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold **text**
                        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic *text*
                        .replace(/\n- (.*?)/g, '<li>$1</li>') // Convert bullet points
                        .replace(/<\/li>\n<li>/g, '</li><li>') // Fix bullet spacing
                        .replace(/\n/g, '<br>'); // Convert newlines to <br>

                    // Wrap in a styled div instead of <pre> for better formatting
                    // Automatically show AI suggestions
                    // Extract warning messages
                    // Extract warning messages only ONCE
                    if (!window.hasProcessedWarnings) {
                        const warnings = [];
                        const warningPatterns = [
                            /⚠️.*?Note:.*?limited overview.*?app\./gs,
                            /⚠️.*?token.*?limit.*?reached.*?\./gs,
                            /Warning:.*?token.*?limit.*?\./gs
                        ];

                        warningPatterns.forEach(pattern => {
                            const matches = rawText.match(pattern);
                            if (matches) {
                                matches.forEach(match => {
                                    warnings.push(`<div class="warning">${match}</div>`); // ✅ Store warning separately
                                    rawText = rawText.replace(match, ''); // ✅ Remove warning from main content
                                });
                            }
                        });

                        // ✅ Append warnings at the bottom only once
                        if (warnings.length > 0) {
                            cleanText += '<br><br>' + warnings.join('<br>');
                        }
                        
                        // Mark that warnings have been processed so they don't duplicate
                        window.hasProcessedWarnings = true;
                    }

                    // ✅ Ensure only one instance of AI suggestions is displayed
                    if (!suggestionsContent.hasClass('processed')) {
                        suggestionsContent.html(`<div class="ai-suggestions-content">${cleanText}</div>`);
                        suggestionsContent.show();
                        suggestionsContent.addClass('processed'); // ✅ Prevent multiple insertions
                    }
            
                    toggleButton.text('Hide AI Suggestions');
                })
                .catch(error => alert('Error: ' + error.message))
                .finally(() => {
                    button.html('<i class="fas fa-magic"></i> Generate Ideas').prop('disabled', false);
                });
        });

        $(document).off('click', '.delete-topic-btn').on('click', '.delete-topic-btn', function () {
            const topicElement = $(this).closest('.topic');
            const topicId = topicElement.data('id');

            if (confirm('Are you sure you want to delete this topic?')) {
                fetch(`${tra_vars.api_url}/topics/${topicId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-api-key': tra_vars.api_key,
                        'x-cors-token': tra_vars.cors_token
                    }
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to delete topic.');
                        const currentPage = $('.pagination .current').data('page') || 1;
                        const selectedCategory = $('#category-select').val();
                        loadTopics(currentPage, selectedCategory);
                    })
                    .catch(error => alert('Error: ' + error.message));
            }
        });
    }

    function getCreateTopicForm() {
        // (Keep your original form function here)
    }
});