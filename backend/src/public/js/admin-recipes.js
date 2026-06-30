let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let currentStatus = '';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.is_admin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/dashboard';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    setupEventListeners();
    loadRecipes();
});

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', () => {
        currentSearch = document.getElementById('searchInput').value.trim();
        currentPage = 1;
        loadRecipes();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    document.getElementById('statusFilter').addEventListener('change', () => {
        currentStatus = document.getElementById('statusFilter').value;
        currentPage = 1;
        loadRecipes();
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('statusFilter').value = '';
        currentSearch = '';
        currentStatus = '';
        currentPage = 1;
        loadRecipes();
    });
}

async function loadRecipes(page = currentPage) {
    const container = document.getElementById('recipesList');
    const pagination = document.getElementById('pagination');
    
    container.innerHTML = '<div class="loading">Loading recipes...</div>';

    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        if (currentStatus) {
            params.append('status', currentStatus);
        }
        
        const response = await axios.get(`/api/admin/recipes?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data;
        
        if (data.recipes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍳</div>
                    <p>No recipes found</p>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        displayRecipes(container, data.recipes);
        displayPagination(pagination, data);
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            alert('Access denied or session expired');
            window.location.href = '/login';
        } else {
            container.innerHTML = `<div class="empty-state"><p>Error loading recipes: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

function displayRecipes(container, recipes) {
    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-item" data-recipe-id="${recipe.id}">
            <div class="recipe-info">
                <div>
                    <span class="title">${recipe.title}</span>
                    <span class="badge ${recipe.is_public ? 'badge-public' : 'badge-private'}">
                        ${recipe.is_public ? 'Public' : 'Private'}
                    </span>
                </div>
                <div class="description">${recipe.description ? recipe.description.substring(0, 150) + '...' : 'No description'}</div>
                <div class="meta">
                    <span>👤 ${recipe.author?.username || 'Unknown'}</span>
                    <span>⭐ ${recipe.average_rating ? recipe.average_rating.toFixed(1) : 'N/A'}</span>
                    <span>📅 ${new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="recipe-actions">
                <button onclick="toggleVisibility(${recipe.id}, ${recipe.is_public})" class="btn-admin btn-toggle">
                    ${recipe.is_public ? 'Make Private' : 'Make Public'}
                </button>
                <button onclick="deleteRecipe(${recipe.id})" class="btn-admin btn-delete">Delete</button>
                <a href="/recipe/${recipe.id}" class="btn-admin btn-view" style="text-decoration: none; display: inline-block; padding: 6px 15px; background: #4299e1; color: white; border-radius: 5px; font-size: 13px;">View</a>
            </div>
        </div>
    `).join('');
}

function displayPagination(container, data) {
    currentPage = data.page;
    totalPages = data.total_pages;

    container.innerHTML = `
        <button onclick="loadRecipes(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="loadRecipes(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

async function toggleVisibility(recipeId, currentStatus) {
    const action = currentStatus ? 'Make private' : 'Make public';
    if (!confirm(`${action} this recipe?`)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`/api/admin/recipes/${recipeId}/toggle-visibility`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert(`Recipe ${response.data.is_public ? 'made public' : 'made private'} successfully!`);
        loadRecipes(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/recipes/${recipeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Recipe deleted successfully!');
        loadRecipes(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}