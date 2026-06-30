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

    loadStats();
});

async function loadStats() {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = '<div class="loading">Loading statistics...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const stats = response.data;
        displayStats(stats);
        displayRecentActivities(stats.recentActivities || []);
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            alert('Access denied or session expired');
            window.location.href = '/login';
        } else {
            grid.innerHTML = `<div class="empty-state"><p>Error loading statistics: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

function displayStats(stats) {
    const grid = document.getElementById('statsGrid');
    
    const statCards = [
        { icon: '👥', label: 'Total Users', value: stats.totalUsers || 0 },
        { icon: '🍳', label: 'Total Recipes', value: stats.totalRecipes || 0 },
        { icon: '⭐', label: 'Total Reviews', value: stats.totalReviews || 0 },
        { icon: '🌟', label: 'Average Rating', value: stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A' }
    ];

    grid.innerHTML = statCards.map(stat => `
        <div class="stat-card">
            <span class="stat-icon">${stat.icon}</span>
            <span class="stat-number">${stat.value}</span>
            <span class="stat-label">${stat.label}</span>
        </div>
    `).join('');
}

function displayRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recent activities</p></div>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <span class="activity-text">
                ${activity.username || 'User'} joined the platform
            </span>
            <span class="activity-time">${formatTime(activity.created_at)}</span>
        </div>
    `).join('');
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}