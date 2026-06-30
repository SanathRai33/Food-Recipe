let currentOffset = 0;
const limit = 20;
let totalActivities = 0;
let isLoading = false;
let hasMore = true;
let userId = null;
const API_BASE_URL = '/api';

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
    
    if (path === '/activity-feed') {
        loadActivityFeed();
    } else if (path === '/my-activities') {
        loadMyActivities();
    } else if (path.startsWith('/user-activities/')) {
        const match = path.match(/\/user-activities\/(\d+)/);
        if (match) {
            userId = match[1];
            loadUserActivities(userId);
        } else {
            document.querySelector('.activity-content').innerHTML = '<div class="empty-activity"><p>Invalid user</p></div>';
        }
    } else {
        document.querySelector('.activity-content').innerHTML = '<div class="empty-activity"><p>Invalid page</p></div>';
    }

    // Setup load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
    }
});

async function loadActivityFeed() {
    const container = document.getElementById('activityList');
    container.innerHTML = '<div class="loading">Loading activity feed...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/activities/feed?limit=${limit}&offset=0`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data;
        totalActivities = data.total;
        hasMore = data.offset + data.activities.length < data.total;
        
        if (data.activities.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <div class="empty-icon">📭</div>
                    <h4>No Activity Yet</h4>
                    <p>Follow some users to see their activities here!</p>
                </div>
            `;
            document.getElementById('loadMoreContainer').style.display = 'none';
            return;
        }

        displayActivities(container, data.activities);
        updateLoadMoreButton(data);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-activity"><p>Error loading activity feed: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

async function loadMyActivities() {
    const container = document.getElementById('activityList');
    container.innerHTML = '<div class="loading">Loading your activities...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/activities/me?limit=${limit}&offset=0`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data;
        totalActivities = data.total;
        hasMore = data.offset + data.activities.length < data.total;
        
        if (data.activities.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <div class="empty-icon">📝</div>
                    <h4>No Activities Yet</h4>
                    <p>Start creating recipes, reviewing, or interacting with the community!</p>
                </div>
            `;
            document.getElementById('loadMoreContainer').style.display = 'none';
            return;
        }

        displayActivities(container, data.activities);
        updateLoadMoreButton(data);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-activity"><p>Error loading activities: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

async function loadUserActivities(id) {
    const container = document.getElementById('activityList');
    container.innerHTML = '<div class="loading">Loading user activities...</div>';

    try {
        // Get user info first
        const token = localStorage.getItem('token');
        const userResponse = await axios.get(`/api/user/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const user = userResponse.data.user;
        document.getElementById('userActivityTitle').textContent = `${user.username}'s Activities`;
        document.getElementById('userActivitySubtitle').textContent = `Activities by ${user.username}`;

        // Load activities
        const response = await axios.get(`/api/activities/user/${id}?limit=${limit}&offset=0`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const data = response.data;
        totalActivities = data.total;
        hasMore = data.offset + data.activities.length < data.total;
        
        if (data.activities.length === 0) {
            container.innerHTML = `
                <div class="empty-activity">
                    <div class="empty-icon">📭</div>
                    <h4>No Activities</h4>
                    <p>This user hasn't been active yet.</p>
                </div>
            `;
            document.getElementById('loadMoreContainer').style.display = 'none';
            return;
        }

        displayActivities(container, data.activities);
        updateLoadMoreButton(data);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-activity"><p>Error loading user activities: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

function displayActivities(container, activities) {
    const html = activities.map(activity => {
        const icon = getActivityIcon(activity.type);
        const text = formatActivityText(activity);
        const time = formatTime(activity.created_at);
        const user = activity.user || {};
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${icon}
                </div>
                <div class="activity-content-detail">
                    <div class="activity-text">${text}</div>
                    <div class="activity-time">
                        <span>🕐 ${time}</span>
                        ${activity.recipe ? `<span>📖 ${activity.recipe.title || 'Recipe'}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function getActivityIcon(type) {
    const icons = {
        'recipe': '🍳',
        'favorite': '❤️',
        'follow': '👥',
        'review': '⭐',
        'collection': '📚',
        'rating': '🌟',
        'default': '📌'
    };
    return icons[type] || icons.default;
}

function formatActivityText(activity) {
    const user = activity.user || {};
    const username = user.username || 'Unknown User';
    const recipe = activity.recipe || {};
    const recipeTitle = recipe.title || 'a recipe';
    const collection = activity.collection || {};
    const collectionName = collection.name || 'a collection';
    const targetUser = activity.target_user || {};
    const targetUsername = targetUser.username || 'another user';
    
    const templates = {
        'recipe': `<strong>${username}</strong> created a new recipe <a href="/recipe/${recipe.id}">"${recipeTitle}"</a>`,
        'favorite': `<strong>${username}</strong> favorited <a href="/recipe/${recipe.id}">"${recipeTitle}"</a>`,
        'follow': `<strong>${username}</strong> started following <a href="/user/${targetUser.id}">${targetUsername}</a>`,
        'review': `<strong>${username}</strong> reviewed <a href="/recipe/${recipe.id}">"${recipeTitle}"</a>`,
        'collection': `<strong>${username}</strong> created a new collection <a href="/collection/${collection.id}">"${collectionName}"</a>`,
        'rating': `<strong>${username}</strong> rated <a href="/recipe/${recipe.id}">"${recipeTitle}"</a>`,
        'default': `<strong>${username}</strong> performed an action`
    };
    
    return templates[activity.type] || templates.default;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function updateLoadMoreButton(data) {
    const container = document.getElementById('loadMoreContainer');
    const btn = document.getElementById('loadMoreBtn');
    
    if (data.offset + data.activities.length >= data.total) {
        btn.disabled = true;
        btn.textContent = 'No more activities';
        return;
    }
    
    btn.disabled = false;
    btn.textContent = 'Load More';
    currentOffset = data.offset + data.activities.length;
}

async function loadMore() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    const btn = document.getElementById('loadMoreBtn');
    btn.disabled = true;
    btn.textContent = 'Loading...';

    try {
        const token = localStorage.getItem('token');
        const path = window.location.pathname;
        let url = '';
        
        if (path === '/activity-feed') {
            url = `/api/activities/feed`;
        } else if (path === '/my-activities') {
            url = `/api/activities/me`;
        } else if (path.startsWith('/user-activities/')) {
            url = `/api/activities/user/${userId}`;
        }
        
        const response = await axios.get(`${url}?limit=${limit}&offset=${currentOffset}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = response.data;
        hasMore = data.offset + data.activities.length < data.total;
        
        if (data.activities.length > 0) {
            const container = document.getElementById('activityList');
            const newActivitiesHtml = data.activities.map(activity => {
                const icon = getActivityIcon(activity.type);
                const text = formatActivityText(activity);
                const time = formatTime(activity.created_at);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            ${icon}
                        </div>
                        <div class="activity-content-detail">
                            <div class="activity-text">${text}</div>
                            <div class="activity-time">
                                <span>🕐 ${time}</span>
                                ${activity.recipe ? `<span>📖 ${activity.recipe.title || 'Recipe'}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML += newActivitiesHtml;
            updateLoadMoreButton(data);
            currentOffset = data.offset + data.activities.length;
        }
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            alert('Error loading more activities: ' + (error.response?.data?.message || error.message));
        }
    } finally {
        isLoading = false;
        btn.disabled = false;
        btn.textContent = hasMore ? 'Load More' : 'No more activities';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}