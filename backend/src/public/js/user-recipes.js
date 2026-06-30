let currentPage = 1;
const limit = 10;
let totalPages = 1;

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
    
    if (path === '/my-recipes') {
        loadUserRecipes();
    } else if (path === '/my-favorites' || path === '/favorites') {
        loadUserFavorites();
    }
});

async function loadUserRecipes(page = 1) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/users/recipes?page=${page}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data;
        const recipesList = document.getElementById('recipesList');
        const pagination = document.getElementById('pagination');
        
        if (data.recipes.length === 0) {
            recipesList.innerHTML = '<div class="empty-message">No recipes found</div>';
            pagination.innerHTML = '';
            return;
        }

        displayRecipes(recipesList, data.recipes);
        displayPagination(pagination, data);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            document.getElementById('recipesList').innerHTML = 
                `<div class="empty-message">Error loading recipes: ${error.response?.data?.message || error.message}</div>`;
        }
    }
}

async function loadUserFavorites() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data;
        const favoritesList = document.getElementById('favoritesList') || document.getElementById('recipesList');
        
        if (data.favorites.length === 0) {
            favoritesList.innerHTML = '<div class="empty-message">No favorite recipes yet</div>';
            return;
        }

        displayRecipes(favoritesList, data.favorites);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            const container = document.getElementById('favoritesList') || document.getElementById('recipesList');
            container.innerHTML = 
                `<div class="empty-message">Error loading favorites: ${error.response?.data?.message || error.message}</div>`;
        }
    }
}

function displayRecipes(container, recipes) {
    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            <h4>${recipe.title || 'Untitled Recipe'}</h4>
            <p>${recipe.description || 'No description available'}</p>
            <div class="recipe-meta">
                <span>🕒 ${recipe.prep_time || 'N/A'} mins</span>
                <span>👤 ${recipe.author?.username || 'Unknown'}</span>
                ${recipe.difficulty ? `<span>⭐ ${recipe.difficulty}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function displayPagination(container, data) {
    currentPage = data.page;
    totalPages = data.total_pages;

    container.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadUserRecipes(page);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}