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

    loadFavorites();
});

async function loadFavorites() {
    const container = document.getElementById('favoritesList');
    container.innerHTML = '<div class="loading">Loading favorites...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/favorites', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const favorites = response.data.favorites;
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>You haven't added any favorites yet.</p>
                    <p><a href="/recipes" style="color: #667eea;">Browse recipes</a> to find your favorites!</p>
                </div>
            `;
            return;
        }

        displayFavorites(container, favorites);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-message">Error loading favorites: ${error.response?.data?.message || error.message}</div>`;
        }
    }
}

function displayFavorites(container, favorites) {

    container.innerHTML = favorites.map(recipe => `
        <a href="/recipe/${recipe?.Recipe?.id}" class="recipe-card">
            ${recipe?.Recipe?.image ? `<img src="${recipe?.Recipe?.image}" alt="${recipe?.Recipe?.title}">` : ''}
            <h4>${recipe?.Recipe?.title}</h4>
            <p>${recipe?.Recipe?.description ? recipe?.Recipe?.description.substring(0, 120) + '...' : ''}</p>
            <div class="recipe-meta">
                <span>🕒 ${recipe?.Recipe?.total_time || (recipe?.Recipe?.prep_time || 0) + (recipe?.Recipe?.cook_time || 0)} min</span>
                <span>👤 ${recipe?.Recipe?.User?.username || 'Unknown'}</span>
                ${recipe?.Recipe?.difficulty ? `<span>⭐ ${recipe?.Recipe?.difficulty}</span>` : ''}
                <span>❤️ Favorited</span>
            </div>
        </a>
    `).join('');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}