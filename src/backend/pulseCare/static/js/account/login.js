const form = document.querySelector('form');

function clearForm() {
    const error = document.getElementById('error');
    error.style.display = 'none';
    form.reset();
}

form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        loginUser();
    }
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    loginUser();
});

function loginUser() {
    const error = document.getElementById('error');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.access) {
                localStorage.setItem('token', data.access);
                document.cookie = `jwt_token=${data.access}; path=/`;
                window.open('/dashboard/', '_self');
            } else {
                error.textContent = data.error;
                error.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            error.textContent = 'An error occurred. Please try again.'
            error.style.display = 'block';
        });
}
