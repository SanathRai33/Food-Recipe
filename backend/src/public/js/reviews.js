let currentPage = 1;
let totalPages = 1;
const limit = 10;
let recipeId = null;
let recipeTitle = '';
let editingReviewId = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const path = window.location.pathname;
    const match = path.match(/\/recipe\/(\d+)\/reviews/);
    if (match) {
        recipeId = match[1];
        loadRecipeInfo(recipeId);
        loadReviews(recipeId);
        setupReviewForm();
    } else {
        document.querySelector('.reviews-content').innerHTML = '<div class="empty-reviews"><p>Invalid recipe</p></div>';
    }
});

async function loadRecipeInfo(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/recipes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const recipe = response.data.recipe;
        recipeTitle = recipe.title;
        
        document.getElementById('recipeInfo').innerHTML = `
            <h2>${recipe.title}</h2>
            <div class="recipe-meta">
                <span>👤 By: ${recipe.author?.username || 'Unknown'}</span>
                <span>🕒 ${recipe.total_time || (recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
            </div>
        `;
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            document.getElementById('recipeInfo').innerHTML = `
                <div class="empty-reviews">
                    <p>Error loading recipe: ${error.response?.data?.message || error.message}</p>
                </div>
            `;
        }
    }
}

async function loadReviews(id, page = currentPage) {
    const container = document.getElementById('reviewsList');
    const pagination = document.getElementById('pagination');
    
    container.innerHTML = '<div class="empty-reviews"><p>Loading reviews...</p></div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/recipes/${id}/reviews?page=${page}&limit=${limit}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const data = response.data;
        
        if (data.reviews.length === 0) {
            container.innerHTML = '<div class="empty-reviews"><p>No reviews yet. Be the first to review this recipe!</p></div>';
            pagination.innerHTML = '';
            return;
        }

        displayReviews(container, data.reviews);
        displayPagination(pagination, data);
    } catch (error) {
        if (error.response?.status === 401) {
            // Not authenticated - show public reviews
            try {
                const publicResponse = await axios.get(`/api/recipes/${id}/reviews?page=${page}&limit=${limit}`);
                const data = publicResponse.data;
                
                if (data.reviews.length === 0) {
                    container.innerHTML = '<div class="empty-reviews"><p>No reviews yet. Be the first to review this recipe!</p></div>';
                    pagination.innerHTML = '';
                    return;
                }

                displayReviews(container, data.reviews);
                displayPagination(pagination, data);
            } catch (publicError) {
                container.innerHTML = `<div class="empty-reviews"><p>Error loading reviews: ${publicError.response?.data?.message || publicError.message}</p></div>`;
            }
        } else {
            container.innerHTML = `<div class="empty-reviews"><p>Error loading reviews: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

function displayReviews(container, reviews) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    container.innerHTML = reviews.map(review => {
        const isOwner = review.user_id === user.id;
        const isEditing = editingReviewId === review.id;
        
        return `
            <div class="review-item" id="review-${review.id}">
                <div class="review-header">
                    <span class="review-author">${review.user?.username || 'Unknown User'}</span>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString()} ${new Date(review.created_at).toLocaleTimeString()}</span>
                </div>
                ${isEditing ? `
                    <textarea class="review-edit-textarea" id="edit-content-${review.id}" rows="4">${review.content}</textarea>
                    <div class="review-actions">
                        <button onclick="saveReview(${review.id})" class="btn-save-review">💾 Save</button>
                        <button onclick="cancelEdit()" class="btn-cancel-review">❌ Cancel</button>
                    </div>
                ` : `
                    <div class="review-content">${review.content}</div>
                    ${isOwner ? `
                        <div class="review-actions">
                            <button onclick="startEdit(${review.id})" class="btn-edit-review">✏️ Edit</button>
                            <button onclick="deleteReview(${review.id})" class="btn-delete-review">🗑️ Delete</button>
                        </div>
                    ` : ''}
                `}
            </div>
        `;
    }).join('');
}

function displayPagination(container, data) {
    currentPage = data.page;
    totalPages = data.total_pages;

    container.innerHTML = `
        <button onclick="loadReviews(${recipeId}, ${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="loadReviews(${recipeId}, ${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', handleSubmitReview);
}

async function handleSubmitReview(e) {
    e.preventDefault();
    const content = document.getElementById('reviewContent').value.trim();
    const messageEl = document.getElementById('reviewMessage');
    const errorEl = document.getElementById('reviewError');
    const submitBtn = document.getElementById('submitReviewBtn');
    
    messageEl.classList.remove('show');
    errorEl.classList.remove('show');
    
    if (!content) {
        errorEl.textContent = 'Please enter a review';
        errorEl.classList.add('show');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`/api/recipes/${recipeId}/reviews`, 
            { content },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        messageEl.textContent = response.data.message;
        messageEl.classList.add('show');
        document.getElementById('reviewForm').reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
        
        setTimeout(() => {
            loadReviews(recipeId);
        }, 1000);
    } catch (error) {
        errorEl.textContent = error.response?.data?.message || error.message;
        errorEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
    }
}

function startEdit(reviewId) {
    editingReviewId = reviewId;
    loadReviews(recipeId, currentPage);
}

function cancelEdit() {
    editingReviewId = null;
    loadReviews(recipeId, currentPage);
}

async function saveReview(reviewId) {
    const content = document.getElementById(`edit-content-${reviewId}`).value.trim();
    
    if (!content) {
        alert('Review content cannot be empty');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.put(`/api/reviews/${reviewId}`,
            { content },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        editingReviewId = null;
        loadReviews(recipeId, currentPage);
        alert('Review updated successfully!');
    } catch (error) {
        alert('Error updating review: ' + (error.response?.data?.message || error.message));
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/reviews/${reviewId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        loadReviews(recipeId, currentPage);
        alert('Review deleted successfully!');
    } catch (error) {
        alert('Error deleting review: ' + (error.response?.data?.message || error.message));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}