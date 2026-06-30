let recipeId = null;
let recipeTitle = '';
let userRating = null;
let selectedRating = 0;

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
    const match = path.match(/\/recipe\/(\d+)\/ratings/);
    if (match) {
        recipeId = match[1];
        loadRecipeInfo(recipeId);
        loadRatings(recipeId);
        setupRatingStars();
    } else {
        document.querySelector('.ratings-content').innerHTML = '<div class="empty-ratings"><p>Invalid recipe</p></div>';
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
                <div class="empty-ratings">
                    <p>Error loading recipe: ${error.response?.data?.message || error.message}</p>
                </div>
            `;
        }
    }
}

async function loadRatings(id) {
    try {
        // Load all ratings
        const ratingsResponse = await axios.get(`/api/recipes/${id}/ratings`);
        const ratingsData = ratingsResponse.data;
        
        // Load user's rating if authenticated
        const token = localStorage.getItem('token');
        let userRatingData = null;
        
        if (token) {
            try {
                const userResponse = await axios.get(`/api/recipes/${id}/rating`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                userRatingData = userResponse.data;
                userRating = userRatingData.rating;
            } catch (error) {
                // User hasn't rated yet or error
                userRating = null;
            }
        }
        
        displayRatingSummary(ratingsData);
        displayUserRating(userRating);
        displayAllRatings(ratingsData.ratings || []);
        
        if (userRating) {
            selectedRating = userRating;
            updateStarSelection(selectedRating);
        }
    } catch (error) {
        document.getElementById('ratingsList').innerHTML = 
            `<div class="empty-ratings"><p>Error loading ratings: ${error.response?.data?.message || error.message}</p></div>`;
    }
}

function displayRatingSummary(data) {
    const summary = document.getElementById('ratingSummary');
    const average = data.average_rating || 0;
    const total = data.total_ratings || 0;
    
    // Calculate rating distribution
    const distribution = {};
    const ratings = data.ratings || [];
    ratings.forEach(r => {
        const stars = Math.round(r.rating);
        distribution[stars] = (distribution[stars] || 0) + 1;
    });
    
    let barsHtml = '';
    for (let i = 5; i >= 1; i--) {
        const count = distribution[i] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        barsHtml += `
            <div class="rating-bar">
                <span class="star-label">${i}★</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="count">${count}</span>
            </div>
        `;
    }
    
    summary.innerHTML = `
        <div class="average-rating">
            <span class="big-number">${average.toFixed(1)}</span>
            <span class="stars">${getStarDisplay(Math.round(average))}</span>
            <span class="total">${total} rating${total !== 1 ? 's' : ''}</span>
        </div>
        <div class="rating-stats">
            ${barsHtml}
        </div>
    `;
}

function displayUserRating(rating) {
    const section = document.getElementById('userRatingSection');
    
    if (rating) {
        section.innerHTML = `
            <h4>Your Rating</h4>
            <div class="rating-display">
                <span class="stars">${getStarDisplay(Math.round(rating))}</span>
                <span class="rating-text">You rated this recipe ${rating} out of 5 stars</span>
            </div>
            <div class="rating-stars-input">
                ${[1, 2, 3, 4, 5].map(num => `
                    <button class="star-btn ${num <= rating ? 'active' : ''}" data-value="${num}" onclick="setRating(${num})">★</button>
                `).join('')}
            </div>
            <button id="submitRatingBtn" onclick="submitRating()">Update Rating</button>
            <div id="ratingMessage" class="success-message"></div>
            <div id="ratingError" class="error-message"></div>
        `;
    } else {
        section.innerHTML = `
            <h4>Rate This Recipe</h4>
            <p style="color: #4a5568; margin-bottom: 10px;">Share your rating for this recipe</p>
            <div class="rating-stars-input">
                ${[1, 2, 3, 4, 5].map(num => `
                    <button class="star-btn" data-value="${num}" onclick="setRating(${num})">★</button>
                `).join('')}
            </div>
            <button id="submitRatingBtn" onclick="submitRating()">Submit Rating</button>
            <div id="ratingMessage" class="success-message"></div>
            <div id="ratingError" class="error-message"></div>
        `;
    }
    
    // Re-attach star listeners
    setupStarListeners();
}

function displayAllRatings(ratings) {
    const container = document.getElementById('ratingsList');
    
    if (!ratings || ratings.length === 0) {
        container.innerHTML = '<div class="empty-ratings"><p>No ratings yet</p></div>';
        return;
    }
    
    container.innerHTML = ratings.map(rating => `
        <div class="rating-item">
            <div class="rating-avatar">
                ${rating.user?.username ? rating.user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="rating-info">
                <div class="rating-user">${rating.user?.username || 'Unknown User'}</div>
                <div class="rating-stars-display">${getStarDisplay(Math.round(rating.rating))}</div>
                <div class="rating-date">${new Date(rating.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

function setupRatingStars() {
    setupStarListeners();
}

function setupStarListeners() {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.dataset.value);
            highlightStars(value);
        });
        
        star.addEventListener('mouseleave', function() {
            highlightStars(selectedRating);
        });
    });
}

function setRating(value) {
    selectedRating = value;
    updateStarSelection(value);
    
    // Enable submit button if disabled
    const submitBtn = document.getElementById('submitRatingBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

function highlightStars(value) {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= value) {
            star.style.color = '#f6ad55';
        } else {
            star.style.color = '#e2e8f0';
        }
    });
}

function updateStarSelection(value) {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= value) {
            star.classList.add('active');
            star.style.color = '#f6ad55';
        } else {
            star.classList.remove('active');
            star.style.color = '#e2e8f0';
        }
    });
}

async function submitRating() {
    const messageEl = document.getElementById('ratingMessage');
    const errorEl = document.getElementById('ratingError');
    const submitBtn = document.getElementById('submitRatingBtn');
    
    messageEl.classList.remove('show');
    errorEl.classList.remove('show');
    
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
        errorEl.textContent = 'Please select a rating from 1 to 5 stars';
        errorEl.classList.add('show');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`/api/recipes/${recipeId}/rating`,
            { rating: selectedRating },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        messageEl.textContent = response.data.message;
        messageEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = userRating ? 'Update Rating' : 'Submit Rating';
        
        // Reload ratings to update summary and list
        setTimeout(() => {
            loadRatings(recipeId);
        }, 1000);
    } catch (error) {
        errorEl.textContent = error.response?.data?.message || error.message;
        errorEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = userRating ? 'Update Rating' : 'Submit Rating';
    }
}

function getStarDisplay(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}