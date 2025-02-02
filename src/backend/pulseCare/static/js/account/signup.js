const form = document.querySelector('form');

function clearForm() {
    const error = document.getElementById('error');
    error.style.display = 'none';
    form.reset();
}

form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        form.submit();
    }
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    registerUser();
});

function registerUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmpass = document.getElementById('confirmpass').value;

    if (password !== confirmpass) {
        error.textContent = 'Passwords not match.'
        error.style.display = 'block';
        return;
    }

    fetch('/api/register/', {
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
            if (data.message) {
                window.location.href = "/login/";
                error.textContent = 'Registration successful! Please log in.'
                error.style.display = 'block';
                alert('Registration successful! Please log in.');
                error.classList.add('success-text');
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
