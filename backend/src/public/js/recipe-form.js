let isEditMode = false;
let recipeId = null;

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

  if (path === "/create-recipe") {
    isEditMode = false;
    document.getElementById("submitBtn").textContent = "Create Recipe";
    document.querySelector("h3").textContent = "Create New Recipe";
  } else if (path.startsWith("/edit-recipe/")) {
    isEditMode = true;
    const match = path.match(/\/edit-recipe\/([^/]+)/);
    if (match) {
      recipeId = match[1];
      document.getElementById("submitBtn").textContent = "Update Recipe";
      document.querySelector("h3").textContent = "Edit Recipe";
      loadRecipeData(recipeId);
    }
  }

  const form = document.getElementById("recipeForm");
  form.addEventListener("submit", handleFormSubmit);

  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", handleDelete);
  }
});

async function loadRecipeData(id) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/recipes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const recipe = response.data.recipe;

    document.getElementById("title").value = recipe.title || "";
    document.getElementById("description").value = recipe.description || "";
    document.getElementById("ingredients").value = Array.isArray(
      recipe.ingredients,
    )
      ? recipe.ingredients.join("\n")
      : recipe.ingredients || "";
    document.getElementById("instructions").value = Array.isArray(
      recipe.instructions,
    )
      ? recipe.instructions.join("\n")
      : recipe.instructions || "";
    document.getElementById("prep_time").value = recipe.prep_time || "";
    document.getElementById("cook_time").value = recipe.cook_time || "";
    document.getElementById("servings").value = recipe.servings || "";
    document.getElementById("difficulty").value = recipe.difficulty || "Medium";
    document.getElementById("dietary_preferences").value =
      recipe.dietary_preferences ? recipe.dietary_preferences.join(", ") : "";
    document.getElementById("is_public").checked = recipe.is_public !== false;
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      alert(
        "Error loading recipe: " +
          (error.response?.data?.message || error.message),
      );
      window.location.href = "/recipes";
    }
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById("formMessage");
  const errorEl = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  messageEl.classList.remove("show");
  errorEl.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = isEditMode ? "Updating..." : "Creating...";

  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("title", document.getElementById("title").value.trim());
    formData.append(
      "description",
      document.getElementById("description").value.trim(),
    );

    const ingredientsText = document.getElementById("ingredients").value;
    const ingredients = ingredientsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
    formData.append("ingredients", JSON.stringify(ingredients));

    const instructionsText = document.getElementById("instructions").value;
    const instructions = instructionsText
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
    formData.append("instructions", JSON.stringify(instructions));

    formData.append(
      "prep_time",
      document.getElementById("prep_time").value || 0,
    );
    formData.append(
      "cook_time",
      document.getElementById("cook_time").value || 0,
    );
    formData.append("servings", document.getElementById("servings").value || 1);
    formData.append("difficulty", document.getElementById("difficulty").value);

    const dietary = document
      .getElementById("dietary_preferences")
      .value.split(",")
      .map((d) => d.trim())
      .filter((d) => d);
    formData.append("dietary_preferences", JSON.stringify(dietary));

    formData.append("is_public", document.getElementById("is_public").checked);

    const imageFile = document.getElementById("recipeImage").files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const endpoint = isEditMode ? `/api/recipes/${recipeId}` : "/api/recipes";
    const method = isEditMode ? "PUT" : "POST";

    const response = await axios({
      method: method,
      url: endpoint,
      data: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    messageEl.textContent = response.data.message;
    messageEl.classList.add("show");

    submitBtn.disabled = false;
    submitBtn.textContent = isEditMode ? "Update Recipe" : "Create Recipe";

    if (!isEditMode) {
      document.getElementById("recipeForm").reset();
    }

    setTimeout(() => {
      window.location.href = `/recipe/${response.data.recipe.id}`;
    }, 1500);
  } catch (error) {
    errorEl.textContent = error.response?.data?.message || error.message;
    errorEl.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = isEditMode ? "Update Recipe" : "Create Recipe";
  }
}

async function handleDelete() {
  if (
    !confirm(
      "Are you sure you want to delete this recipe? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Recipe deleted successfully!");
    window.location.href = "/recipes";
  } catch (error) {
    alert(
      "Error deleting recipe: " +
        (error.response?.data?.message || error.message),
    );
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
