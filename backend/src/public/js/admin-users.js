let currentPage = 1;
let totalPages = 1;
let currentSearch = '';

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
    loadUsers();
});

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', () => {
        currentSearch = document.getElementById('searchInput').value.trim();
        currentPage = 1;
        loadUsers();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        currentSearch = '';
        currentPage = 1;
        loadUsers();
    });
}

async function loadUsers(page = currentPage) {
    const container = document.getElementById('usersList');
    const pagination = document.getElementById('pagination');
    
    container.innerHTML = '<div class="loading">Loading users...</div>';

    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        const response = await axios.get(`/api/admin/users?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data;
        
        if (data.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <p>No users found</p>
                </div>
            `;
            pagination.innerHTML = '';
            return;
        }

        displayUsers(container, data.users);
        displayPagination(pagination, data);
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            alert('Access denied or session expired');
            window.location.href = '/login';
        } else {
            container.innerHTML = `<div class="empty-state"><p>Error loading users: ${error.response?.data?.message || error.message}</p></div>`;
        }
    }
}

function displayUsers(container, users) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    container.innerHTML = users.map(user => `
        <div class="user-item" data-user-id="${user.id}">
            <div class="user-info">
                <div>
                    <span class="username">${user.username}</span>
                    ${user.is_admin ? '<span class="badge badge-admin">Admin</span>' : ''}
                    ${user.is_banned ? '<span class="badge badge-banned">Banned</span>' : ''}
                </div>
                <div class="email">${user.email}</div>
                <div class="fullname">${user.first_name || ''} ${user.last_name || ''}</div>
            </div>
            <div class="user-actions">
                ${!user.is_admin ? `
                    <button onclick="makeAdmin(${user.id})" class="btn-admin btn-make-admin">Make Admin</button>
                ` : `
                    ${user.id !== currentUser.id ? `
                        <button onclick="removeAdmin(${user.id})" class="btn-admin btn-remove-admin">Remove Admin</button>
                    ` : ''}
                `}
                ${!user.is_banned ? `
                    <button onclick="banUser(${user.id})" class="btn-admin btn-ban">Ban</button>
                ` : `
                    <button onclick="unbanUser(${user.id})" class="btn-admin btn-unban">Unban</button>
                `}
                ${user.id !== currentUser.id ? `
                    <button onclick="deleteUser(${user.id})" class="btn-admin btn-delete">Delete</button>
                ` : ''}
                <a href="/user/${user.id}" class="btn-admin btn-view" style="text-decoration: none; display: inline-block; padding: 6px 15px; background: #4299e1; color: white; border-radius: 5px; font-size: 13px;">View</a>
            </div>
        </div>
    `).join('');
}

function displayPagination(container, data) {
    currentPage = data.page;
    totalPages = data.total_pages;

    container.innerHTML = `
        <button onclick="loadUsers(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="loadUsers(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

async function makeAdmin(userId) {
    if (!confirm('Make this user an admin?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/admin/users/${userId}/make-admin`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('User made admin successfully!');
        loadUsers(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

async function removeAdmin(userId) {
    if (!confirm('Remove admin privileges from this user?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/admin/users/${userId}/remove-admin`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Admin privileges removed successfully!');
        loadUsers(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

async function banUser(userId) {
    if (!confirm('Ban this user?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/admin/users/${userId}/ban`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('User banned successfully!');
        loadUsers(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

async function unbanUser(userId) {
    if (!confirm('Unban this user?')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.patch(`/api/admin/users/${userId}/unban`, {}, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('User unbanned successfully!');
        loadUsers(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('User deleted successfully!');
        loadUsers(currentPage);
    } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}