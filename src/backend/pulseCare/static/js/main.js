function updateDateTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true // Set to false for 24-hour format
    };
    document.getElementById('live-datetime').innerText = now.toLocaleString('en-US', options);
}

setInterval(updateDateTime, 1000);
updateDateTime();