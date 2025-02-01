var chart = null;
let patient = null;
let frame = 0;
let frame_size = 1000;
let base_frame_size = 1000;

function calcSampto() {
    return ((2 * (++frame_size)) < 1000) ? 1000 : (500 + (++frame_size))
}

async function fetchECGData(patient, frame = 0, frame_size = 200) {
    const start = frame * frame_size;
    const token = localStorage.getItem('token');

    const response = await fetch(`http://127.0.0.1:8000/api/ecg?format=json&sampto=${calcSampto()}&start=${start}&length=${frame_size}&patient=${patient}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
        credentials: 'include'
    });
    if (!response.ok) {
        alert("Error on parsing the dataset");
        return;
    }
    return await response.json();
}

function processECGData(ecg) {
    const start = frame * frame_size;
    const ecg_data = ecg.ecg_data;
    const peaks = ['ECG_P_Peaks', 'ECG_Q_Peaks', 'ECG_R_Peaks', 'ECG_S_Peaks', 'ECG_T_Peaks'].reduce((acc, peak) => {
        acc[peak] = ecg[peak].filter(x => x < start + ecg_data.length).map(x => [x, ecg_data[x]]);
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

function renderCreatePatientMessage() {

}

async function renderECG(patient, frame = 0, frame_size = 200) {
    const ecg = await fetchECGData(patient, frame, frame_size);
    const {ecg_data, peaks} = processECGData(ecg);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: ecg_data.length}, (_, i) => i),
            datasets: [
                {type: 'bubble', label: 'P Peak', data: peaks.ECG_P_Peaks, borderColor: '#1f77b4', pointRadius: 8},
                {type: 'bubble', label: 'Q Peak', data: peaks.ECG_Q_Peaks, borderColor: '#ff7f0e', pointRadius: 8},
                {type: 'bubble', label: 'R Peak', data: peaks.ECG_R_Peaks, borderColor: '#d62728', pointRadius: 8},
                {type: 'bubble', label: 'S Peak', data: peaks.ECG_S_Peaks, borderColor: '#2ca02c', pointRadius: 8},
                {type: 'bubble', label: 'T Peak', data: peaks.ECG_T_Peaks, borderColor: '#9467bd', pointRadius: 8},
                {
                    type: 'line',
                    label: 'ECG',
                    data: ecg_data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(100,100,100,0.27)',
                    tension: 0.2,
                    pointStyle: 'circle',
                    pointRadius: 0.2,
                    fill: false
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                // x: {title: {display: true, text: 'Time (ms)'}},
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

    window.addEventListener('resize', () => chart.resize());
    console.log("chart rendered!")
    return chart;
}

async function changeData(patient_id) {
    const last_data = document.getElementById(`patient-${patient}`);
    last_data.classList.remove("dataset-active");

    patient = patient_id;
    frame_size = base_frame_size;
    document.getElementById('length').value = frame_size;
    const ecg = await fetchECGData(`${patient_id}`, 0, frame_size);
    await updateChartData(ecg);

    const new_data = document.getElementById(`patient-${patient_id}`);
    new_data.classList.add("dataset-active");
}

async function prevFrame() {
    if (frame <= 0) return;
    document.querySelector("#page-loader").style.display = "block";
    frame--;
    console.log(frame);
    const ecg = await fetchECGData(patient, frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

async function nextFrame() {
    document.querySelector("#page-loader").style.display = "block";
    frame++;
    console.log(frame);
    const ecg = await fetchECGData(patient, frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}