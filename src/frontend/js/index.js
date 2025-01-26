async function fetchECGData(frame = 0, frame_size = 200) {
    const start = frame * frame_size;
    const response = await fetch(`http://127.0.0.1:8000/api/ecg?format=json&start=${start}&length=${frame_size}`);
    return await response.json();
}

function processECGData(ecg) {
    const start = frame * frame_size;
    const ecg_data = ecg.ecg_data;
    const peaks = ['r_peaks', 't_peaks', 'p_peaks', 'q_peaks', 's_peaks'].reduce((acc, peak) => {
        acc[peak] = ecg[peak].filter(x => x < start + ecg_data.length).map(x => [x, ecg_data[x][1]]);
        return acc;
    }, {});
    return {ecg_data, peaks};
}

async function updateChartData(ecg) {
    const {ecg_data, peaks} = processECGData(ecg);

    // Update labels and datasets
    chart.data.labels = Array.from({length: ecg_data.length}, (_, i) => i);
    chart.data.datasets.forEach((dataset, index) => {
        if (index < 5) { // For peak datasets
            dataset.data = peaks[Object.keys(peaks)[index]];
        } else { // For ECG signal dataset
            dataset.data = ecg_data;
        }
    });

    chart.update();
    console.log("Chart updated");
}

async function renderECG(frame = 0, frame_size = 200) {
    const ecg = await fetchECGData(frame, frame_size);
    const {ecg_data, peaks} = processECGData(ecg);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: ecg_data.length}, (_, i) => i),
            datasets: [
                {type: 'bubble', label: 'R Peak', data: peaks.r_peaks, borderColor: 'rgb(220,8,8)', pointRadius: 8},
                {type: 'bubble', label: 'T Peak', data: peaks.t_peaks, borderColor: 'rgb(0,124,9)', pointRadius: 8},
                {type: 'bubble', label: 'P Peak', data: peaks.p_peaks, borderColor: 'rgb(255,99,132)', pointRadius: 8},
                {type: 'bubble', label: 'Q Peak', data: peaks.q_peaks, borderColor: 'rgb(173,185,0)', pointRadius: 8},
                {type: 'bubble', label: 'S Peak', data: peaks.s_peaks, borderColor: 'rgb(185,56,0)', pointRadius: 8},
                {
                    type: 'line',
                    label: 'ECG Signal',
                    data: ecg_data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(100,100,100,0.15)',
                    tension: 0.2,
                    pointStyle: 'circle',
                    pointRadius: 0.5,
                    fill: true
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: 'Time (ms)'}},
                y: {title: {display: true, text: 'Amplitude (mV)'}}
            },
            plugins: {
                annotation: {
                    clip: false,
                    annotations: {
                        annotation1: {
                            type: 'point',
                            backgroundColor: 'rgba(0, 255, 255, 0.4)',
                            borderColor: 'black',
                            borderWidth: 3,
                            scaleID: 'y',
                            xValue: (ctx) => value(ctx, 0, 2, 'x'),
                            yValue: (ctx) => value(ctx, 0, 2, 'y')
                        }
                    }
                }
            }
        }
    });

    console.log("Chart rendered");
}

async function prevFrame() {
    if (frame <= 0) return;
    document.querySelector("#page-loader").style.display = "block";
    frame--;
    console.log(frame);
    const ecg = await fetchECGData(frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

async function nextFrame() {
    document.querySelector("#page-loader").style.display = "block";
    frame++;
    console.log(frame);
    const ecg = await fetchECGData(frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

// Initialize variables
let frame = 0;
const frame_size = 400;

// Start rendering the ECG chart
renderECG(frame, frame_size).then(() => {
    document.querySelector("#wave-loader").style.display = "none";
    document.querySelector("#ecgChart").style.display = "block";
});