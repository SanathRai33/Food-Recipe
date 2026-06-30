let isEditMode = false;
let collectionId = null;

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
    
    if (path === '/collections') {
        loadCollections();
    } else if (path === '/create-collection') {
        isEditMode = false;
        document.getElementById('submitBtn').textContent = 'Create Collection';
        document.querySelector('h3').textContent = 'Create New Collection';
        setupForm();
    } else if (path.startsWith('/edit-collection/')) {
        isEditMode = true;
        const match = path.match(/\/edit-collection\/(\d+)/);
        if (match) {
            collectionId = match[1];
            document.getElementById('submitBtn').textContent = 'Update Collection';
            document.querySelector('h3').textContent = 'Edit Collection';
            loadCollectionData(collectionId);
            setupForm();
        }
    }
});

async function loadCollections() {
    const container = document.getElementById('collectionsList');
    container.innerHTML = '<div class="loading">Loading collections...</div>';

    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/collections`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const collections = response.data.collections;
        
        if (collections.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    <p>You haven't created any collections yet.</p>
                    <p><a href="/create-collection">Create your first collection</a></p>
                </div>
            `;
            return;
        }

        displayCollections(container, collections);
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            container.innerHTML = `<div class="empty-message">Error loading collections: ${error.response?.data?.message || error.message}</div>`;
        }
    }
}

function displayCollections(container, collections) {
    container.innerHTML = collections.map(collection => `
        <a href="/collection/${collection.id}" class="collection-card">
            <h4>${collection.name}</h4>
            <p>${collection.description || 'No description'}</p>
            <div class="collection-meta">
                <span>📚 ${collection.recipes?.length || 0} recipes</span>
                <span>${collection.is_public ? '🌐 Public' : '🔒 Private'}</span>
                <span>📅 ${new Date(collection.created_at).toLocaleDateString()}</span>
            </div>
        </a>
    `).join('');
}

function setupForm() {
    const form = document.getElementById('collectionForm');
    form.addEventListener('submit', handleFormSubmit);

    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
}

async function loadCollectionData(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/collections/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const collection = response.data.collection;
        document.getElementById('name').value = collection.name || '';
        document.getElementById('description').value = collection.description || '';
        document.getElementById('is_public').checked = collection.is_public !== false;
    } catch (error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            alert('Error loading collection: ' + (error.response?.data?.message || error.message));
            window.location.href = '/collections';
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const messageEl = document.getElementById('formMessage');
    const errorEl = document.getElementById('formError');
    const submitBtn = document.getElementById('submitBtn');
    
    messageEl.classList.remove('show');
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = isEditMode ? 'Updating...' : 'Creating...';

    try {
        const token = localStorage.getItem('token');
        const data = {
            name: document.getElementById('name').value.trim(),
            description: document.getElementById('description').value.trim(),
            is_public: document.getElementById('is_public').checked
        };

        let response;
        if (isEditMode) {
            response = await axios.put(`/api/collections/${collectionId}`, data, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } else {
            response = await axios.post(`/api/collections`, data, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        messageEl.textContent = response.data.message;
        messageEl.classList.add('show');
        
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? 'Update Collection' : 'Create Collection';
        
        setTimeout(() => {
            window.location.href = `/collection/${response.data.collection.id}`;
        }, 1500);
    } catch (error) {
        errorEl.textContent = error.response?.data?.message || error.message;
        errorEl.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? 'Update Collection' : 'Create Collection';
    }
}

async function handleDelete() {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/collections/${collectionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Collection deleted successfully!');
        window.location.href = '/collections';
    } catch (error) {
        alert('Error deleting collection: ' + (error.response?.data?.message || error.message));
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}