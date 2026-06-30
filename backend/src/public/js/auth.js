document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const errorElement = document.getElementById("errorMessage");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  errorElement.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const response = await API.auth.login({ email, password });
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    window.location.href = "/dashboard";
  } catch (error) {
    errorElement.textContent = error.response?.data?.message || "Login failed";
    errorElement.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
}

async function handleRegister(e) {
  e.preventDefault();

  const errorElement = document.getElementById("errorMessage");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const first_name = document.getElementById("first_name").value;
  const last_name = document.getElementById("last_name").value;

  errorElement.textContent = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  console.log("1")

  console.log("Axios:", axios);
console.log("Axios.post:", axios.post);
  
  try {
    console.log("2")
    const response = await axios.post("/api/auth/register", {
      username,
      email,
      password,
      first_name,
      last_name,
    });

    console.log("3")
    console.log(response.data);

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    window.location.href = "/dashboard";
  } catch (error) {
    console.log(error.response);
    console.log(error.response.data);
    console.log(error.response.status);

    console.error(error);

    errorElement.textContent = error.response?.data?.message || error.message;

    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
  }
  console.log('5')
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

