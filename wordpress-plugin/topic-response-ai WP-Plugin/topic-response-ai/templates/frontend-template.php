<div id="topic-response-ai-app" class="tra-container"> 

    <!-- Page Header (Centered like in React) -->
    <header class="tra-header">
        <h1>Topic Response AI</h1>
    </header>

    <div class="tra-grid">

        <!-- Left Column: Create New Topic Form -->
        <div class="tra-form" id="create-topic-form-container">
            <h3>Create New Topic</h3>
            <form id="create-topic-form">
                <label for="topic-title">Title</label>
                <input type="text" id="topic-title" name="title" required>

                <label for="topic-description">Description</label>
                <textarea id="topic-description" name="description" required></textarea>

                <fieldset>
                    <legend>Category Selection</legend>
                    <label>
                        <input type="radio" name="category-type" value="existing">
                        Use an existing category
                    </label>
                    <label>
                        <input type="radio" name="category-type" value="new">
                        Add a new category
                    </label>
                </fieldset>

                <div id="existing-category-select" class="hidden">
                    <label for="existing-category">Select Existing Category</label>
                    <select id="existing-category" name="category">
                        <option value="">Select a category</option>
                    </select>
                </div>

                <div id="new-category-input" class="hidden">
                    <label for="new-category">New Category</label>
                    <input type="text" id="new-category" name="newCategory" placeholder="Enter new category">
                </div>

                <button type="submit">Create Topic</button>
            </form>
        </div>

        <!-- Right Column: Topics List -->
        <div id="topics-container">
            <div id="tra-topics-list">
                <p>Loading topics...</p>
            </div>
        </div>

    </div>
</div>
