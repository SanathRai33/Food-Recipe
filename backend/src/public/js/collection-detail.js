let collectionId = null;

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const path = window.location.pathname;
  const match = path.match(/\/collection\/([^/]+)/);
  if (match) {
    collectionId = match[1];
    loadCollectionDetail(collectionId);
    setupAddRecipeListener();
  } else {
    document.getElementById("collectionDetail").innerHTML =
      '<div class="empty-message">Invalid collection ID</div>';
  }
});

async function loadCollectionDetail(id) {
  const container = document.getElementById("collectionDetail");
  container.innerHTML = '<div class="loading">Loading collection...</div>';

  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const collection = response.data.collection;
    displayCollectionDetail(container, collection);
    displayCollectionRecipes(collection.recipes || []);
    checkOwnership(collection);
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      container.innerHTML = `<div class="empty-message">Error loading collection: ${error.response?.data?.message || error.message}</div>`;
    }
  }
}

function displayCollectionDetail(container, collection) {
  container.innerHTML = `
        <h1>${collection.name}</h1>
        <div class="collection-description">${collection.description || "No description provided"}</div>
        <div class="collection-stats">
            <span>📚 ${collection.recipes?.length || 0} recipes</span>
            <span>${collection.is_public ? "🌐 Public" : "🔒 Private"}</span>
            <span>📅 Created: ${new Date(collection.created_at).toLocaleDateString()}</span>
            ${collection.updated_at ? `<span>📝 Updated: ${new Date(collection.updated_at).toLocaleDateString()}</span>` : ""}
        </div>
    `;
}

function checkOwnership(collection) {
  const actionsContainer = document.getElementById("collectionActions");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (collection.user_id === user.id) {
    actionsContainer.innerHTML = `
            <a href="/edit-collection/${collection.id}" class="btn btn-edit">✏️ Edit Collection</a>
            <button onclick="deleteCollection(${collection.id})" class="btn btn-delete">🗑️ Delete Collection</button>
            <button id="backBtn" class="btn btn-back">⬅️ Back</button>
        `;
  } else {
    actionsContainer.innerHTML = `
            <button id="backBtn" class="btn btn-back">⬅️ Back</button>
        `;
  }

  const backBtn = document.getElementById("backBtn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }
}

function displayCollectionRecipes(recipes) {
  const container = document.getElementById("collectionRecipes");

  if (!recipes || recipes.length === 0) {
    container.innerHTML =
      '<div class="empty-message">No recipes in this collection yet.</div>';
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner =
    document.querySelector(".collection-actions .btn-edit") !== null;

  container.innerHTML = recipes
    .map(
      (recipe) => `
        <a href="/recipe/${recipe.id}" class="recipe-card">
            ${
              isOwner
                ? `
                <button onclick="event.preventDefault(); event.stopPropagation(); removeRecipeFromCollection(${recipe.id})" 
                        class="remove-recipe-btn" title="Remove from collection">
                    ×
                </button>
            `
                : ""
            }
            <h5>${recipe.title}</h5>
            <p>${recipe.description ? recipe.description.substring(0, 100) + "..." : ""}</p>
            <div class="recipe-meta">
                <span>🕒 ${recipe.total_time || (recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
                <span>👤 ${recipe.author?.username || "Unknown"}</span>
                ${recipe.difficulty ? `<span>⭐ ${recipe.difficulty}</span>` : ""}
            </div>
        </a>
    `,
    )
    .join("");
}

function setupAddRecipeListener() {
  const addBtn = document.getElementById("addRecipeBtn");
  const input = document.getElementById("recipeIdInput");

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const recipeId = input.value.trim();
      if (recipeId) {
        addRecipeToCollection(recipeId);
      } else {
        showMessage("Please enter a recipe ID", "error");
      }
    });
  }
}

async function addRecipeToCollection(recipeId) {
  const messageEl = document.getElementById("addRecipeMessage");
  const errorEl = document.getElementById("addRecipeError");
  const addBtn = document.getElementById("addRecipeBtn");

  console.log({
    collectionId,
    recipeId,
  });

  messageEl.classList.remove("show");
  errorEl.classList.remove("show");
  addBtn.disabled = true;
  addBtn.textContent = "Adding...";

  try {
    const token = localStorage.getItem("token");
    await axios.post(
      `/api/collections/${collectionId}/recipes`,
      { recipe_id: recipeId },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    messageEl.textContent = "Recipe added to collection successfully!";
    messageEl.classList.add("show");
    addBtn.disabled = false;
    addBtn.textContent = "Add Recipe";

    document.getElementById("recipeIdInput").value = "";

    setTimeout(() => {
      loadCollectionDetail(collectionId);
    }, 1000);
  } catch (error) {
    errorEl.textContent = error.response?.data?.message || error.message;
    errorEl.classList.add("show");
    addBtn.disabled = false;
    addBtn.textContent = "Add Recipe";
  }
}

async function removeRecipeFromCollection(recipeId) {
  if (!confirm("Remove this recipe from the collection?")) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/collections/${collectionId}/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    alert("Recipe removed from collection successfully!");
    loadCollectionDetail(collectionId);
  } catch (error) {
    alert(
      "Error removing recipe: " +
        (error.response?.data?.message || error.message),
    );
  }
}

async function deleteCollection(id) {
  if (!confirm("Are you sure you want to delete this collection?")) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Collection deleted successfully!");
    window.location.href = "/collections";
  } catch (error) {
    alert(
      "Error deleting collection: " +
        (error.response?.data?.message || error.message),
    );
  }
}

function showMessage(message, type = "success") {
  const messageEl = document.getElementById("addRecipeMessage");
  const errorEl = document.getElementById("addRecipeError");

  if (type === "success") {
    messageEl.textContent = message;
    messageEl.classList.add("show");
    errorEl.classList.remove("show");
  } else {
    errorEl.textContent = message;
    errorEl.classList.add("show");
    messageEl.classList.remove("show");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
