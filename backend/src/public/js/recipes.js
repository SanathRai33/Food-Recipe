let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  search: "",
  dietary: "",
  difficulty: "",
  maxTime: "",
  sort: "created_at",
};

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

  setupEventListeners();
  loadRecipes();
});

function setupEventListeners() {
  document.getElementById("searchBtn").addEventListener("click", () => {
    currentFilters.search = document.getElementById("searchInput").value.trim();
    currentPage = 1;
    loadRecipes();
  });

  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("searchBtn").click();
    }
  });

  document.getElementById("dietaryFilter").addEventListener("change", () => {
    currentFilters.dietary = document.getElementById("dietaryFilter").value;
    currentPage = 1;
    loadRecipes();
  });

  document.getElementById("difficultyFilter").addEventListener("change", () => {
    currentFilters.difficulty =
      document.getElementById("difficultyFilter").value;
    currentPage = 1;
    loadRecipes();
  });

  document.getElementById("maxTime").addEventListener("input", () => {
    currentFilters.maxTime = document.getElementById("maxTime").value;
    currentPage = 1;
    loadRecipes();
  });

  document.getElementById("sortBy").addEventListener("change", () => {
    currentFilters.sort = document.getElementById("sortBy").value;
    currentPage = 1;
    loadRecipes();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("dietaryFilter").value = "";
    document.getElementById("difficultyFilter").value = "";
    document.getElementById("maxTime").value = "";
    document.getElementById("sortBy").value = "created_at";

    currentFilters = {
      search: "",
      dietary: "",
      difficulty: "",
      maxTime: "",
      sort: "created_at",
    };
    currentPage = 1;
    loadRecipes();
  });
}

async function loadRecipes(page = currentPage) {
  const recipesList = document.getElementById("recipesList");
  const pagination = document.getElementById("pagination");

  recipesList.innerHTML = '<div class="loading">Loading recipes...</div>';

  try {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      page: page,
      limit: 10,
      ...currentFilters,
    });

    const response = await axios.get(`/api/recipes?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = response.data;

    if (data.recipes.length === 0) {
      recipesList.innerHTML =
        '<div class="empty-message">No recipes found. Try adjusting your filters.</div>';
      pagination.innerHTML = "";
      return;
    }

    displayRecipes(recipesList, data.recipes);
    displayPagination(pagination, data);
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      recipesList.innerHTML = `<div class="empty-message">Error loading recipes: ${error.response?.data?.message || error.message}</div>`;
    }
  }
}

function displayRecipes(container, recipes) {

  console.log(recipes[0]?.id)

  container.innerHTML = recipes
    .map(
      (recipe) => `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div class="recipe-menu-wrapper">
                        <button class="menu-btn" data-id="${recipe.id}">
                            ⋮
                        </button>
                        <div class="recipe-menu">
                            <button class="copy-id-btn" data-id="${recipe.id}">
                                📋 Copy Recipe ID
                            </button>
                        </div>
                    </div>
                    ${recipe.image_url
                        ? `<img src="${recipe.image_url}" alt="${recipe.title}">`
                        : ""
                    }
                    <h4>${recipe.title}</h4>
                    <p>${ recipe.description ? recipe.description.substring(0, 120) + "..." : "" }</p>
                    <div class="recipe-meta">
                        <span>🕒 ${ recipe.total_time || Number(recipe.prep_time || 0) + Number(recipe.cook_time || 0) } min</span>
                        <span>👤 ${recipe.author?.username || "Unknown"}</span>
                        ${recipe.difficulty ? `<span>⭐ ${recipe.difficulty}</span>` : ""}
                        <span>${recipe.is_public ? "🌐 Public" : "🔒 Private"}</span>
                        ${recipe.is_favorited ? "<span>❤️</span>" : ""}
                    </div>
                </div>
            `,
    )
    .join("");

  container.querySelectorAll(".recipe-card").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `/recipe/${card.dataset.id}`;
    });
  });

  container.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const menu = btn.nextElementSibling;

      document.querySelectorAll(".recipe-menu.show").forEach((m) => {
        if (m !== menu) {
          m.classList.remove("show");
        }
      });

      menu.classList.toggle("show");
    });
  });

  container.querySelectorAll(".copy-id-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      await copyRecipeId(btn.dataset.id);

      btn.closest(".recipe-menu").classList.remove("show");
    });
  });
}

document.addEventListener("click", () => {
  document.querySelectorAll(".recipe-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});

async function copyRecipeId(recipeId) {
  try {
    await navigator.clipboard.writeText(recipeId);

    alert("Recipe ID copied successfully.");
  } catch (error) {
    console.error(error);
    alert("Failed to copy Recipe ID.");
  }
}

function displayPagination(container, data) {
  currentPage = data.page;
  totalPages = data.total_pages;

  container.innerHTML = `
        <button onclick="loadRecipes(${currentPage - 1})" ${currentPage <= 1 ? "disabled" : ""}>
            Previous
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button onclick="loadRecipes(${currentPage + 1})" ${currentPage >= totalPages ? "disabled" : ""}>
            Next
        </button>
    `;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
