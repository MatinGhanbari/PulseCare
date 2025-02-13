const themeToggler = document.querySelector(".theme-toggler");
const datetime = document.getElementById("datetime");
const sideMenu = document.querySelector("aside");
const profile_btn = document.getElementById("profile-btn");

profile_btn.addEventListener('click', () => {
    if (!sideMenu.classList.contains("active")) {
        sideMenu.classList.add("active");
    } else {
        sideMenu.classList.remove("active");
    }
});

function updateDateTime() {
    const now = new Date();
    const options = {
        // year: 'numeric',
        // month: 'long',
        // day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    datetime.innerHTML = now.toLocaleString('en-US', options);
}

window.onscroll = () => {
    sideMenu.classList.remove('active');
    if (window.scrollY > 0) {
        document.querySelector('header').classList.add('active');
    } else {
        document.querySelector('header').classList.remove('active');
    }
}

themeToggler.onclick = function () {
    document.body.classList.toggle('dark-theme');
    themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
    themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');
}

function logoutUser() {
    localStorage.removeItem('token');
    document.cookie = `jwt_token=; path=/`;
    window.open('/', '_self');
}

setInterval(updateDateTime, 1000);
updateDateTime();