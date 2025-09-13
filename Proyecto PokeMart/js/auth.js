// Simulación de una base de datos de usuarios
let USERS = {
  'ash': 'pikachu123',
};

// Cargar usuarios de localStorage si existen
const storedUsers = localStorage.getItem('pokemartUsers');
if (storedUsers) {
  USERS = JSON.parse(storedUsers);
}

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginContainer = document.getElementById('login-form-container');
const registerContainer = document.getElementById('register-form-container');
const toastElement = document.getElementById('toast');
const toastBubble = document.getElementById('toastBubble');

function toast(msg, ok = true) {
  toastBubble.textContent = msg;
  toastBubble.className = 'bubble ' + (ok ? '' : 'err');
  toastElement.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastElement.classList.remove('show'), 1600);
}

function showLoginForm() {
  loginContainer.style.display = 'block';
  registerContainer.style.display = 'none';
}

function showRegisterForm() {
  loginContainer.style.display = 'none';
  registerContainer.style.display = 'block';
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = e.target['login-username'].value;
  const password = e.target['login-password'].value;

  if (USERS[username] && USERS[username] === password) {
    localStorage.setItem('currentUser', username);
    toast('¡Inicio de sesión exitoso!');
    setTimeout(() => {
      window.location.href = 'index.html'; // Redirigir a la página de la tienda
    }, 1000);
  } else {
    toast('Usuario o contraseña incorrectos.', false);
  }
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newUsername = e.target['register-username'].value;
  const newPassword = e.target['register-password'].value;
  const confirmPassword = e.target['confirm-password'].value;

  if (newPassword !== confirmPassword) {
    toast('Las contraseñas no coinciden.', false);
    return;
  }
  if (USERS[newUsername]) {
    toast('El nombre de usuario ya existe.', false);
    return;
  }
  if (newPassword.length < 4) {
    toast('La contraseña debe tener al menos 4 caracteres.', false);
    return;
  }

  USERS[newUsername] = newPassword;
  localStorage.setItem('pokemartUsers', JSON.stringify(USERS));
  toast('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
  showLoginForm();
});

// Inicializar la página para que muestre el formulario de login por defecto
showLoginForm();