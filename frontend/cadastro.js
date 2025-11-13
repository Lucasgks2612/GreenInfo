document.getElementById('cadastro-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://localhost:3000/api/auth/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem('userId', data.userId);
    alert("Cadastro realizado");
    window.location.href = "index.html";
  } else {
    alert(data.message);
  }
});