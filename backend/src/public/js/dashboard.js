document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const response = await axios.get("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const user = response.data.user;
    displayUserData(user);

    // Show admin link if user is admin
    if (user.is_admin) {
      document.getElementById("adminLink").style.display = "inline-block";
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    } else {
      alert(
        "Failed to load user data: " +
          (error.response?.data?.message || error.message),
      );
    }
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

function displayUserData(user) {
  document.getElementById("userName").textContent =
    user.first_name || user.username;
  document.getElementById("displayUsername").textContent = user.username;
  document.getElementById("displayEmail").textContent = user.email;
  document.getElementById("displayFullName").textContent =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Not provided";
  document.getElementById("displayRole").textContent = user.is_admin
    ? "Administrator"
    : "User";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
