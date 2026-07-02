let currentPage = 1;
const limit = 10;
let totalPages = 1;

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

  if (path === "/my-recipes") {
    loadUserRecipes();
  } else if (path === "/my-favorites" || path === "/favorites") {
    loadUserFavorites();
  }
});

async function loadUserRecipes(page = 1) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `/api/users/my-recipes?page=${page}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = response.data;
    const recipesList = document.getElementById("recipesList");
    const pagination = document.getElementById("pagination");

    if (data.recipes.length === 0) {
      recipesList.innerHTML =
        '<div class="empty-message">No recipes found</div>';
      pagination.innerHTML = "";
      return;
    }

    displayRecipes(recipesList, data.recipes);
    displayPagination(pagination, data);
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      document.getElementById("recipesList").innerHTML =
        `<div class="empty-message">Error loading recipes: ${error.response?.data?.message || error.message}</div>`;
    }
  }
}

async function loadUserFavorites() {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("/api/users/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    const favoritesList =
      document.getElementById("favoritesList") ||
      document.getElementById("recipesList");

    if (data.favorites.length === 0) {
      favoritesList.innerHTML =
        '<div class="empty-message">No favorite recipes yet</div>';
      return;
    }

    displayRecipes(favoritesList, data.favorites);
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      const container =
        document.getElementById("favoritesList") ||
        document.getElementById("recipesList");
      container.innerHTML = `<div class="empty-message">Error loading favorites: ${error.response?.data?.message || error.message}</div>`;
    }
  }
}

function displayRecipes(container, recipes) {
  container.innerHTML = recipes
    .map(
      (recipe) => `
        <div class="recipe-card">
            <button class="menu-btn" data-id="${recipe.id}">⋮</button>
            ${
              recipe.image_url
                ? `<img src="${recipe.image_url}" alt="${recipe.title}" class="recipe-image">`
                : ""
            }

            <h4>${recipe.title || "Untitled Recipe"}</h4>

            <p>${recipe.description || "No description available"}</p>

            <div class="recipe-meta">
                <span>🕒 ${recipe.prep_time || 0} mins</span>
                <span>⭐ ${recipe.difficulty || "Easy"}</span>
            </div>

            <div class="recipe-actions">
                <button class="edit-btn" data-id="${recipe.id}">
                    ✏️ Edit
                </button>

                <button class="delete-btn" data-id="${recipe.id}">
                    🗑 Delete
                </button>
            </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      editRecipe(button.dataset.id);
    });
  });

  container.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      deleteRecipe(button.dataset.id);
    });
  });
}

function displayPagination(container, data) {
  currentPage = data.page;
  totalPages = data.total_pages;

  container.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage <= 1 ? "disabled" : ""}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage >= totalPages ? "disabled" : ""}>
            Next
        </button>
    `;
}

function changePage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadUserRecipes(page);
}

function editRecipe(recipeId) {
    window.location.href = `/edit-recipe/${recipeId}`;
}

async function deleteRecipe(recipeId) {
    const confirmDelete = confirm("Are you sure you want to delete this recipe?");

    if (!confirmDelete) return;

    try {
        const token = localStorage.getItem("token");

        await axios.delete(`/api/recipes/${recipeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        alert("Recipe deleted successfully.");

        loadUserRecipes(currentPage);

    } catch (error) {
        alert(
            error.response?.data?.message ||
            "Failed to delete recipe."
        );
    }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
