async function fetchECGData() {
    const response = await fetch('http://127.0.0.1:8000/api/ecg/?format=json');
    const data = await response.json();
    return data.ecg_data;
}

async function renderECG() {
    const ecgData = await fetchECGData();

    const ctx = document.getElementById('ecgChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: ecgData.length }, (_, i) => i),
            datasets: [{
                label: 'ECG Signal',
                data: ecgData,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Time (ms)' } },
                y: { title: { display: true, text: 'Amplitude (mV)' } }
            }
        }
    });
}

renderECG();