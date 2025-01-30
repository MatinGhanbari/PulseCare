async function fetchECGData(data_path, frame = 0, frame_size = 200) {
    const start = frame * frame_size;
    const token = localStorage.getItem('token');

    const response = await fetch(`http://127.0.0.1:8000/api/ecg?format=json&sampto=${sampto}&start=${start}&length=${frame_size}&data_path=${data_path}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
        credentials: 'include'
    });
    if (!response.ok) {
        // window.location.assign("../pages/login.html");
        return;
    }
    return await response.json();
}

function processECGData(ecg) {
    const start = frame * frame_size;
    const ecg_data = ecg.ecg_data;
    const peaks = ['ECG_R_Peaks', 'ECG_T_Peaks', 'ECG_P_Peaks', 'ECG_Q_Peaks', 'ECG_S_Peaks'].reduce((acc, peak) => {
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

async function renderECG(data_path, frame = 0, frame_size = 200) {
    const ecg = await fetchECGData(data_path, frame, frame_size);
    const {ecg_data, peaks} = processECGData(ecg);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: ecg_data.length}, (_, i) => i),
            datasets: [
                {type: 'bubble', label: 'R Peak', data: peaks.ECG_R_Peaks, borderColor: 'rgb(220,8,8)', pointRadius: 8},
                {type: 'bubble', label: 'T Peak', data: peaks.ECG_T_Peaks, borderColor: 'rgb(0,124,9)', pointRadius: 8},
                {
                    type: 'bubble',
                    label: 'P Peak',
                    data: peaks.ECG_P_Peaks,
                    borderColor: 'rgb(255,99,132)',
                    pointRadius: 8
                },
                {
                    type: 'bubble',
                    label: 'Q Peak',
                    data: peaks.ECG_Q_Peaks,
                    borderColor: 'rgb(173,185,0)',
                    pointRadius: 8
                },
                {
                    type: 'bubble',
                    label: 'S Peak',
                    data: peaks.ECG_S_Peaks,
                    borderColor: 'rgb(185,56,0)',
                    pointRadius: 8
                },
                {
                    type: 'line',
                    label: 'ECG Signal',
                    data: ecg_data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(100,100,100,0.27)',
                    tension: 0.2,
                    pointStyle: 'circle',
                    pointRadius: 0.2,
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

    window.addEventListener('resize', () => chart.resize());
    console.log("chart rendered!")
    return chart;
}

async function changeData(dataset) {
    const last_data = document.getElementById(data_path.replace("datasets/", ""));
    last_data.classList.remove("dataset-active");

    data_path = `datasets/${dataset}`;
    frame = 0;

    const ecg = await fetchECGData(data_path, frame, frame_size);
    await updateChartData(ecg);

    const new_data = document.getElementById(dataset);
    new_data.classList.add("dataset-active");
}

async function prevFrame() {
    if (frame <= 0) return;
    document.querySelector("#page-loader").style.display = "block";
    frame--;
    console.log(frame);
    const ecg = await fetchECGData(data_path, frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

async function nextFrame() {
    document.querySelector("#page-loader").style.display = "block";
    frame++;
    console.log(frame);
    const ecg = await fetchECGData(data_path, frame, frame_size);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}