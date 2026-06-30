let recipeId = null;

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
    const match = path.split("/").pop();;
    if (match) {
        recipeId = match;
        loadRecipeDetail(recipeId);
    } else {
        document.getElementById('recipeDetail').innerHTML = '<div class="error-detail">Invalid recipe ID</div>';
    }
});

async function loadRecipeDetail(id) {
    const container = document.getElementById('recipeDetail');
    container.innerHTML = '<div class="loading-detail">Loading recipe...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/recipes/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const recipe = response.data.recipe;
        displayRecipeDetail(container, recipe);
        checkOwnership(recipe);
        
        // Add favorite button listener
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => toggleFavorite(id));
            await checkFavoriteStatus(id);
        }
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="error-detail">Error loading recipe: ${error.response?.data?.message || error.message}</div>`;
        }
    }
}

function displayRecipeDetail(container, recipe) {
    container.innerHTML = `
        ${recipe?.image_url ? `<img src="${recipe?.image_url}" alt="${recipe?.title}">` : ''}
        <h1>${recipe.title}</h1>
        <div class="recipe-description">${recipe.description}</div>
        
        <div class="recipe-stats">
            <span>⏱️ Prep: ${recipe.prep_time || 0} min</span>
            <span>🔥 Cook: ${recipe.cook_time || 0} min</span>
            <span>🕒 Total: ${recipe.total_time || (recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
            <span>🍽️ Servings: ${recipe.servings || 1}</span>
            <span>⭐ Difficulty: ${recipe.difficulty || 'Not specified'}</span>
            <span>${recipe.is_public ? '🌐 Public' : '🔒 Private'}</span>
        </div>
        
        ${recipe.dietary_preferences && recipe.dietary_preferences.length > 0 ? `
            <div class="dietary-tags">
                <strong>Dietary:</strong> ${recipe.dietary_preferences.join(', ')}
            </div>
        ` : ''}
        
        <h3 class="section-title">Ingredients</h3>
        <ul class="ingredients-list">
            ${Array.isArray(recipe.ingredients) 
                ? recipe.ingredients.map(i => `<li>${i}</li>`).join('')
                : recipe.ingredients.split('\n').map(i => `<li>${i.trim()}</li>`).filter(i => i).join('')
            }
        </ul>
        
        <h3 class="section-title">Instructions</h3>
        <ol class="instructions-list">
            ${Array.isArray(recipe.instructions)
                ? recipe.instructions.map(i => `<li>${i}</li>`).join('')
                : recipe.instructions.split('\n').map(i => `<li>${i.trim()}</li>`).filter(i => i).join('')
            }
        </ol>
        
        <div class="recipe-footer">
            <span class="recipe-author">👤 Created by: ${recipe.author?.username || 'Unknown'}</span>
            <span class="recipe-views">👁️ ${recipe.views || 0} views</span>
        </div>
        
        <div class="favorite-section">
            <button id="favoriteBtn" class="btn-favorite">🤍 Add to Favorites</button>
        </div>
    `;
}

function checkOwnership(recipe) {
    const actionsContainer = document.getElementById('recipeActions');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (recipe.author && recipe.author.id === user.id) {
        actionsContainer.innerHTML = `
            <a href="/edit-recipe/${recipe.id}" class="btn btn-edit">✏️ Edit Recipe</a>
            <button onclick="deleteRecipe(${recipe.id})" class="btn btn-delete">🗑️ Delete Recipe</button>
            <button onclick="window.history.back()" class="btn btn-back">⬅️ Back</button>
        `;
    } else {
        actionsContainer.innerHTML = `
            <button onclick="window.history.back()" class="btn btn-back">⬅️ Back</button>
        `;
    }
}

async function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/recipes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Recipe deleted successfully!');
        window.location.href = '/recipes';
    } catch (error) {
        alert('Error deleting recipe: ' + (error.response?.data?.message || error.message));
    }
}

async function checkFavoriteStatus(recipeId) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/favorites/check/${recipeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        updateFavoriteButton(response.data.isFavorite);
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

function updateFavoriteButton(isFavorite) {
    const btn = document.getElementById('favoriteBtn');
    if (isFavorite) {
        btn.textContent = '❤️ Remove from Favorites';
        btn.classList.add('favorited');
    } else {
        btn.textContent = '🤍 Add to Favorites';
        btn.classList.remove('favorited');
    }
}

async function toggleFavorite(recipeId) {
    const btn = document.getElementById('favoriteBtn');
    const isFavorited = btn.classList.contains('favorited');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const token = localStorage.getItem('token');
        if (isFavorited) {
            await axios.delete(`/api/favorites/${recipeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            updateFavoriteButton(false);
            showNotification('Recipe removed from favorites', 'success');
        } else {
            await axios.post('/api/favorites', { recipe_id: parseInt(recipeId) }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            updateFavoriteButton(true);
            showNotification('Recipe added to favorites!', 'success');
        }
    } catch (error) {
        showNotification('Error: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
        btn.disabled = false;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#38a169' : '#e53e3e'};
        color: white;
        border-radius: 5px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}