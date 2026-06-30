document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Load profile data
    loadProfile();

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Check if we're on public profile page
    const path = window.location.pathname;
    if (path.startsWith('/user/')) {
        const match = path.match(/\/user\/(\d+)/);
        if (match) {
            const userId = match[1];
            loadPublicProfile(userId);
        }
    }
});

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = response.data.user;
        
        document.getElementById('username').value = user.username || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('first_name').value = user.first_name || '';
        document.getElementById('last_name').value = user.last_name || '';
        document.getElementById('bio').value = user.bio || '';
        document.getElementById('dietary_preferences').value = 
            Array.isArray(user.dietary_preferences) ? user.dietary_preferences.join(', ') : '';
        document.getElementById('profile_picture').value = user.profile_picture || '';
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            alert('Failed to load profile: ' + (error.response?.data?.message || error.message));
        }
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const messageEl = document.getElementById('updateMessage');
    const errorEl = document.getElementById('updateError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    messageEl.classList.remove('show');
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        const token = localStorage.getItem('token');
        const dietaryPrefs = document.getElementById('dietary_preferences').value
            .split(',')
            .map(item => item.trim())
            .filter(item => item);

        const response = await axios.put('/api/users/profile', {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            bio: document.getElementById('bio').value,
            dietary_preferences: dietaryPrefs,
            profile_picture: document.getElementById('profile_picture').value
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        messageEl.textContent = response.data.message;
        messageEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Profile';
        
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
        errorEl.textContent = error.response?.data?.message || error.message;
        errorEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Profile';
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    const messageEl = document.getElementById('passwordMessage');
    const errorEl = document.getElementById('passwordError');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    messageEl.classList.remove('show');
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing...';

    try {
        const token = localStorage.getItem('token');
        await axios.put('/api/users/change-password', {
            current_password: document.getElementById('current_password').value,
            new_password: document.getElementById('new_password').value
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        messageEl.textContent = 'Password changed successfully!';
        messageEl.classList.add('show');
        e.target.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
    } catch (error) {
        errorEl.textContent = error.response?.data?.message || error.message;
        errorEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Change Password';
    }
}

// ============ PUBLIC PROFILE FUNCTIONS ============

async function loadPublicProfile(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/users/${userId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        const user = response.data.user;
        displayPublicProfile(user);
        loadFollowStatus(userId);
        loadFollowCounts(userId);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            alert('Error loading profile: ' + (error.response?.data?.message || error.message));
        }
    }
}

function displayPublicProfile(user) {
    document.getElementById('profileName').textContent = `${user.username}'s Profile`;
    document.getElementById('displayUsername').textContent = user.username;
    document.getElementById('displayFullName').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Not provided';
    document.getElementById('displayBio').textContent = user.bio || 'No bio provided';
    document.getElementById('displayDietary').textContent = user.dietary_preferences?.join(', ') || 'None specified';
}

async function loadFollowStatus(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/follows/check/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const isFollowing = response.data.isFollowing;
        const container = document.getElementById('followButtonContainer');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (parseInt(userId) === currentUser.id) {
            container.innerHTML = '<span style="color: #718096;">This is you</span>';
            return;
        }
        
        container.innerHTML = `
            <button onclick="toggleFollow(${userId}, ${isFollowing})" 
                    class="btn-follow-profile ${isFollowing ? 'following' : ''}"
                    id="follow-profile-btn">
                ${isFollowing ? 'Unfollow' : 'Follow'}
            </button>
        `;
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

async function loadFollowCounts(userId) {
    try {
        // Load followers count
        const followersResponse = await axios.get(`/api/follows/followers/${userId}`);
        document.getElementById('followersCount').textContent = followersResponse.data.followers.length;
        
        // Load following count
        const followingResponse = await axios.get(`/api/follows/following/${userId}`);
        document.getElementById('followingCount').textContent = followingResponse.data.following.length;
    } catch (error) {
        console.error('Error loading follow counts:', error);
    }
}

async function toggleFollow(targetUserId, currentlyFollowing) {
    const btn = document.getElementById('follow-profile-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const token = localStorage.getItem('token');
        
        if (currentlyFollowing) {
            await axios.delete(`/api/follows/unfollow/${targetUserId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            btn.textContent = 'Follow';
            btn.classList.remove('following');
            showNotification('Unfollowed user successfully');
        } else {
            await axios.post('/api/follows/follow', 
                { user_id: targetUserId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            btn.textContent = 'Unfollow';
            btn.classList.add('following');
            showNotification('Following user successfully');
        }
        
        btn.disabled = false;
        loadFollowCounts(targetUserId);
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