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

    let currentPage = 1; // ✅ Define properly before usage
    let totalPages = 0;
    const pageSize = 10;

    loadCategories();
    loadTopics(currentPage);

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
        const selectedCategory = $('#category-select').val();
        loadTopics(1, selectedCategory); // ✅ Pass selected category
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
                'x-api-key': tra_vars.api_key,
                'x-cors-token': tra_vars.cors_token
            },
            body: JSON.stringify(postData),
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to create topic.');
                return response.json();
            })
            .then(() => {
                alert('Topic created successfully!');
                loadTopics(1);
                loadCategories();
                $('#create-topic-form')[0].reset();
                $('#existing-category-select').hide();
                $('#new-category-input').hide();
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    });

    function loadTopics(page = 1, selectedCategory = "all") {
        currentPage = page;
        topicsContainer.html('<p>Fetching topics...</p>');
        const selectedPageSize = $('#items-per-page').val() || pageSize;
        const categoryFilter = selectedCategory !== "all" ? `&category=${encodeURIComponent(selectedCategory)}` : '';

        fetch(`${tra_vars.api_url}/topics?format=array&page=${page}&pageSize=${selectedPageSize}${categoryFilter}`, {
            headers: {
                'x-api-key': tra_vars.api_key,
                'x-cors-token': tra_vars.cors_token
            }
        })
            .then(response => response.json())
            .then(data => {
                let topics, total, pages;

                if (Array.isArray(data)) {
                    topics = data;
                    total = data.length;
                    pages = Math.ceil(total / selectedPageSize);
                } else if (data.items) {
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
                        <div class="topic" data-id="${topic.id}">
                            <h2 class="topic-title">
                                ${topic.title}
                                <div class="topic-buttons">
                                    <button class="generate-ideas">
                                        <i class="fas fa-magic"></i> Generate Ideas
                                    </button>
                                    <button class="delete-topic">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </h2>
                            <p class="topic-description">${topic.description}</p>
                            <span class="topic-category">Category: ${topic.category}</span>
                            <div class="ai-suggestions">
                                <button class="toggle-suggestions">Show AI Suggestions</button>
                                <div class="suggestions-content" style="display: none;">
                                    <pre>${topic.aiSuggestions || "No AI suggestions available."}</pre>
                                </div>
                            </div>
                        </div>
                    `;
                    html += topicHtml;
                });
                html += '</div>';

                html += '<div class="pagination">';
                const startIndex = Math.min((currentPage - 1) * selectedPageSize + 1, total);
                const endIndex = Math.min(currentPage * selectedPageSize, total);

                html += `<p>Showing ${total > 0 ? startIndex : 0} to ${endIndex} of ${total} topics</p>`;

                html += '<div class="pagination-buttons">';

                if (currentPage > 1) {
                    html += `<button class="page-btn prev-btn" data-page="${currentPage - 1}">&laquo; Previous</button>`;
                }

                for (let i = 1; i <= totalPages; i++) {
                    html += `<button class="page-btn ${i === currentPage ? 'current' : ''}" data-page="${i}">${i}</button>`;
                }

                if (currentPage < totalPages) {
                    html += `<button class="page-btn next-btn" data-page="${currentPage + 1}">Next &raquo;</button>`;
                }

                html += '</div></div>';

                topicsContainer.html(html);

                $('.page-btn').click(function() {
                    const page = $(this).data('page');
                    const selectedCategory = $('#category-select').val();
                    loadTopics(page, selectedCategory); // ✅ Ensure category persists during pagination
                });
            })
            .catch(error => {
                console.error('Error fetching topics:', error);
                topicsContainer.html('<p>Error loading topics. Please try again.</p>');
            });
    }

    function loadCategories() {
        fetch(`${tra_vars.api_url}/categories`, {
            headers: {
                'x-api-key': tra_vars.api_key,
                'x-cors-token': tra_vars.cors_token
            }
        })
            .then(response => response.json())
            .then(categories => {
                const categorySelect = $('#existing-category');
                const filterSelect = $('#category-select');

                categorySelect.empty();
                filterSelect.find('option:not([value="all"])').remove(); // ✅ Preserve "All Categories" option
                categorySelect.append('<option value="">Select a category</option>');

                if (categories && categories.length) {
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
                    if (!response.ok) throw new Error('Failed to generate ideas.');
                    return response.json();
                })
                .then(data => {
                    let rawText = data.aiSuggestions || "No AI suggestions available.";

                    let cleanText = rawText
                        .trim()
                        .replace(/\n\s*\n\s*\n+/g, '\n\n')
                        .replace(/[ \t]+/g, ' ')
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/\s+$/gm, '')
                        .replace(/\n{2,}(?=[^\n])/g, '\n\n');

                    cleanText = cleanText
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n- (.*?)/g, '<li>$1</li>')
                        .replace(/<\/li>\n<li>/g, '</li><li>')
                        .replace(/\n/g, '<br>');

                    suggestionsContent.html(`<div class="ai-suggestions-content">${cleanText}</div>`);

                    suggestionsContent.show();
                    toggleButton.text('Hide AI Suggestions');
                })
                .catch(error => alert('Error: ' + error.message))
                .finally(() => {
                    button.html('<i class="fas fa-magic"></i> Generate Ideas').prop('disabled', false);
                });
        });

        $(document).off('click', '.delete-topic').on('click', '.delete-topic', function () {
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
                        topicElement.remove();
                    })
                    .catch(error => alert('Error: ' + error.message));
            }
        });
    }

    function getCreateTopicForm() {
        return `
            <form id="create-topic-form">
                <div class="form-group">
                    <label for="topic-title">Title:</label>
                    <input type="text" id="topic-title" required>
                </div>

                <div class="form-group">
                    <label for="topic-description">Description:</label>
                    <textarea id="topic-description" required></textarea>
                </div>

                <div class="form-group category-selection">
                    <label>Category:</label>
                    <div class="category-type">
                        <input type="radio" id="existing-category-radio" name="category-type" value="existing">
                        <label for="existing-category-radio">Select Existing Category</label>
                    </div>
                    <div id="existing-category-select">
                        <select id="existing-category"></select>
                    </div>

                    <div class="category-type">
                        <input type="radio" id="new-category-radio" name="category-type" value="new">
                        <label for="new-category-radio">Create New Category</label>
                    </div>
                    <div id="new-category-input">
                        <input type="text" id="new-category" placeholder="Enter new category">
                    </div>
                </div>

                <button type="submit">Create Topic</button>
            </form>
        `;
    }
});
