let userId = null;
let currentUser = null;
let isFollowersPage = false;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const path = window.location.pathname;
    
    if (path.startsWith('/followers/')) {
        isFollowersPage = true;
        const match = path.match(/\/followers\/(\d+)/);
        if (match) {
            userId = match[1];
            document.getElementById('pageTitle').textContent = 'Followers';
            loadUserInfo(userId);
            loadFollowers(userId);
        }
    } else if (path.startsWith('/following/')) {
        isFollowersPage = false;
        const match = path.match(/\/following\/(\d+)/);
        if (match) {
            userId = match[1];
            document.getElementById('pageTitle').textContent = 'Following';
            loadUserInfo(userId);
            loadFollowing(userId);
        }
    } else {
        document.querySelector('.follow-content').innerHTML = '<div class="empty-follow"><p>Invalid page</p></div>';
    }
});

async function loadUserInfo(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/user/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const user = response.data.user;
        document.getElementById('userInfo').innerHTML = `
            <h2>${user.username}</h2>
            <div class="user-meta">
                <span>${user.first_name || ''} ${user.last_name || ''}</span>
                ${user.bio ? `<span>• ${user.bio}</span>` : ''}
            </div>
        `;
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            document.getElementById('userInfo').innerHTML = `
                <div class="empty-follow">
                    <p>Error loading user: ${error.response?.data?.message || error.message}</p>
                </div>
            `;
        }
    }
}

async function loadFollowers(id) {
    const container = document.getElementById('followList');
    container.innerHTML = '<div class="loading">Loading followers...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/user/${id}/followers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const followers = response.data.followers;
        
        if (followers.length === 0) {
            container.innerHTML = '<div class="empty-follow"><p>No followers yet</p></div>';
            return;
        }

        displayFollowList(container, followers, true);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-follow"><p>Error loading followers: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

async function loadFollowing(id) {
    const container = document.getElementById('followList');
    container.innerHTML = '<div class="loading">Loading following...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/user/${id}/following`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const following = response.data.following;
        
        if (following.length === 0) {
            container.innerHTML = '<div class="empty-follow"><p>Not following anyone yet</p></div>';
            return;
        }

        displayFollowList(container, following, false);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-follow"><p>Error loading following: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

async function displayFollowList(container, users, isFollowers) {
    // Get follow status for each user if viewing someone else's page
    let followStatuses = {};
    const isOwnPage = parseInt(userId) === currentUser.id;
    
    if (!isOwnPage) {
        try {
            const token = localStorage.getItem('token');
            const statusPromises = users.map(user => 
                axios.get(`/api/user/${user.id}/follow/check`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => ({ userId: user.id, isFollowing: res.data.isFollowing }))
                .catch(() => ({ userId: user.id, isFollowing: false }))
            );
            
            const results = await Promise.all(statusPromises);
            results.forEach(result => {
                followStatuses[result.userId] = result.isFollowing;
            });
        } catch (error) {
            console.error('Error checking follow statuses:', error);
        }
    }

    container.innerHTML = users.map(user => {
        const isSelf = user.id === currentUser.id;
        const isFollowing = followStatuses[user.id] || false;
        
        return `
            <div class="follow-item" data-user-id="${user.id}">
                <a href="/user/${user.id}" class="user-profile">
                    <div class="user-avatar">
                        ${user.profile_picture 
                            ? `<img src="${user.profile_picture}" alt="${user.username}">` 
                            : user.username.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="user-details">
                        <div class="username">${user.username}</div>
                        <div class="fullname">${user.first_name || ''} ${user.last_name || ''}</div>
                    </div>
                </a>
                <div class="follow-actions">
                    ${!isSelf ? `
                        <button onclick="toggleFollow(${user.id}, ${isFollowing})" 
                                class="btn-follow ${isFollowing ? 'following' : ''}"
                                id="follow-btn-${user.id}">
                            ${isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                    ` : `
                        <span style="color: #718096; font-size: 14px;">You</span>
                    `}
                    <a href="/user/${user.id}" class="btn-view-profile">View Profile</a>
                </div>
            </div>
        `;
    }).join('');
}

async function toggleFollow(targetUserId, currentlyFollowing) {
    const btn = document.getElementById(`follow-btn-${targetUserId}`);
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const token = localStorage.getItem('token');
        
        if (currentlyFollowing) {
            // Unfollow
            await axios.delete(`/api/user/${targetUserId}/unfollow`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            btn.textContent = 'Follow';
            btn.classList.remove('following');
            showNotification('Unfollowed user successfully');
        } else {
            // Follow
            await axios.post(`/api/user/follow`, 
                { user_id: targetUserId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            btn.textContent = 'Unfollow';
            btn.classList.add('following');
            showNotification('Following user successfully');
        }
        
        btn.disabled = false;
        
        // Reload the list to refresh counts
        setTimeout(() => {
            if (isFollowersPage) {
                loadFollowers(userId);
            } else {
                loadFollowing(userId);
            }
        }, 1000);
    } catch (error) {
        btn.disabled = false;
        btn.textContent = currentlyFollowing ? 'Unfollow' : 'Follow';
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: #38a169;
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