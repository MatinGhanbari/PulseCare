var chart = null;
let patient = null;
let frame = 0;

const sideMenu = document.querySelector("aside");
const themeToggler = document.querySelector(".theme-toggler");
const datetime = document.getElementById("datetime");
const patientName = document.getElementById("patient-name");
const patient_tab_table = document.getElementById("patient-tab-table");
const patient_tab_pulse = document.getElementById("patient-tab-pulse");
const patient_table = document.getElementById("patient-table");
const patient_pulse = document.getElementById("patient-pulse");
const perv_frame_btn = document.getElementById("perv-frame");
const next_frame_btn = document.getElementById("next-frame");

const cur_patient_firstname = document.getElementById("cur-patient-firstname");
const cur_patient_lastname = document.getElementById("cur-patient-lastname");
const cur_patient_img = document.getElementById("cur-patient-img");
const cur_patient_gender = document.getElementById("cur-patient-gender");
const cur_patient_age = document.getElementById("cur-patient-age");
const record_length = document.getElementById("record_length");
const clock_frequency = document.getElementById("clock_frequency");
const all_annotations = document.getElementById("all_annotations");
const annotators = document.getElementById("annotators");
const signals = document.getElementById("signals");
const notes = document.getElementById("notes");

const patient_data_container = document.querySelectorAll(".patient-data-container");
patient_data_container.forEach((container, index) => {
    container.addEventListener('mouseover', () => {
        const actions_container = container.querySelector('.actions-container');
        actions_container.style.display = 'flex';
    });
    container.addEventListener('mouseout', () => {
        const actions_container = container.querySelector('.actions-container');
        actions_container.style.display = 'none';
    });
});

const colors = [
    '#C91F37', '#3A2F7B', '#8E44AD', '#1ABC9C', '#F1C40F',
    '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22',
    '#16A085', '#D35400', '#2980B9', '#27AE60', '#8E44AD',
    '#F39C12', '#C0392B', '#7F8C8D', '#2C3E50', '#BDC3C7'
];

perv_frame_btn.addEventListener('click', () => prevFrame());
next_frame_btn.addEventListener('click', () => nextFrame());

patient_tab_table.addEventListener('click', (e) => {
    e.preventDefault();
    patient_tab_table.classList.add("patient-tab-active");
    patient_tab_pulse.classList.remove("patient-tab-active");
    patient_table.style.display = 'block';
    patient_pulse.style.display = 'none';
});

patient_tab_pulse.addEventListener('click', (e) => {
    e.preventDefault();
    patient_tab_table.classList.remove("patient-tab-active");
    patient_tab_pulse.classList.add("patient-tab-active");
    patient_table.style.display = 'none';
    patient_pulse.style.display = 'block';
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

function deletePatient(patient_id) {
    fetch(`/api/patients/${patient_id}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `${localStorage.getItem('token')}`
        },
    })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert(response.json());
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
}

async function fetchECGData(patient, frame = 0) {
    var frame_size = document.getElementById('length').value;
    const start = frame * frame_size;
    const token = localStorage.getItem('token');

    const response = await fetch(`http://127.0.0.1:8000/api/ecg?format=json&patient=${patient}&start=${start}&length=${frame_size}`, {
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
    const ecg_data = ecg.ecg_data;
    // const peaks = ['ECG_P_Peaks', 'ECG_Q_Peaks', 'ECG_R_Peaks', 'ECG_S_Peaks', 'ECG_T_Peaks'].reduce((acc, peak) => {
    //     acc[peak] = ecg[peak].map(x => [x, ecg_data[x]]);
    //     return acc;
    // }, {});
    return {
        ecg_data,
        // peaks
    };
}

async function updateChartData(ecg) {
    const {
        ecg_data,
        // peaks
    } = processECGData(ecg);
    let length = document.getElementById('length').value;

    if (chart == null)
        return;

    // Update labels and datasets
    chart.data.labels = Array.from({length: ecg_data.length}, (_, i) => i);
    chart.data.datasets.forEach((dataset, index) => {
        // if (index < 5) { // For peak datasets
        // if (length <= 11) {
        //     dataset.data = peaks[Object.keys(peaks)[index]];
        // } else {
        //     dataset.data = [];
        // }
        // } else { // For ECG signal dataset
        dataset.data = ecg_data;
        // }
    });

    chart.update();
}

async function renderECG(patient, frame = 0) {
    const ecg = await fetchECGData(patient, frame);
    const {
        ecg_data,
        // peaks
    } = processECGData(ecg);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: ecg_data.length}, (_, i) => i),
            datasets: [
                // {type: 'bubble', label: 'P Peak', data: peaks.ECG_P_Peaks, borderColor: '#1f77b4', pointRadius: 8},
                // {type: 'bubble', label: 'Q Peak', data: peaks.ECG_Q_Peaks, borderColor: '#ff7f0e', pointRadius: 8},
                // {type: 'bubble', label: 'R Peak', data: peaks.ECG_R_Peaks, borderColor: '#d62728', pointRadius: 8},
                // {type: 'bubble', label: 'S Peak', data: peaks.ECG_S_Peaks, borderColor: '#2ca02c', pointRadius: 8},
                // {type: 'bubble', label: 'T Peak', data: peaks.ECG_T_Peaks, borderColor: '#9467bd', pointRadius: 8},
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
                // x: {title: {display: true, text: 'Samples (s)'}},
                y: {title: {display: true, text: 'Amplitude (mV)'}}
            },
            plugins: {
                legend: {
                    display: false
                },
                // annotation: {
                //     annotations: {
                //         annotations: {
                //             label1: {
                //                 type: 'line',
                //                 backgroundColor: 'rgba(0,0,0,0.2)',
                //                 borderRadius: 6,
                //                 borderWidth: 0,
                //                 callout: {
                //                     display: true
                //                 },
                //                 color: ['black,', 'black', 'green'],
                //                 content: ['March', 'is', 'annotated'],
                //                 font: [{size: 16, weight: 'bold'}, {family: 'courier'}],
                //                 position: {
                //                     x: 'center',
                //                     y: 'end'
                //                 },
                //                 xValue: 'March',
                //                 yAdjust: (ctx) => yOffset(ctx, 'March'),
                //                 yValue: (ctx) => yValue(ctx, 'March')
                //             }
                //         }
                //     }
                // }
            }
        },

    });

    window.addEventListener('resize', () => chart.resize());
    return chart;
}

function yValue(ctx, label) {
    const chart = ctx.chart;
    const dataset = chart.data.datasets[0];
    return dataset.data[chart.data.labels.indexOf(label)];
}

function yOffset(ctx, label) {
    const value = yValue(ctx, label);
    const chart = ctx.chart;
    const scale = chart.scales.y;
    const y = scale.getPixelForValue(value);
    const lblPos = scale.getPixelForValue(100);
    return lblPos - y - 5;
}

async function changeData(patient_id) {
    const last_data = document.getElementById(`patient-${patient}`);
    last_data.classList.remove("dataset-active");

    patient = patient_id;
    const ecg = await fetchECGData(`${patient_id}`, 0);
    await updateChartData(ecg);

    const new_data = document.getElementById(`patient-${patient_id}`);
    new_data.classList.add("dataset-active");
}

async function prevFrame() {
    if (frame <= 0) return;
    document.querySelector("#page-loader").style.display = "block";
    frame--;
    // console.log(frame);
    const ecg = await fetchECGData(patient, frame);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

async function nextFrame() {
    document.querySelector("#page-loader").style.display = "block";
    frame++;
    // console.log(frame);
    const ecg = await fetchECGData(patient, frame);
    await updateChartData(ecg);
    document.querySelector("#page-loader").style.display = "none";
}

function startRender() {
    renderECG(patient, frame).then(chartres => {
        chart = chartres;
        document.querySelector("#wave-loader").style.display = "none";
        document.querySelector("#ecgChart").style.display = "block";
    });
}

document.getElementById('length').addEventListener('change', () => {
    let ecg = fetchECGData(patient, frame).then(response => {
        updateChartData(response);
    });
});

async function changePatient(id) {
    var pt = document.getElementById(`teacher-${patient}`);
    pt.classList.remove('selected-patient');

    frame = 0;
    patient = id;
    const ecg = await fetchECGData(patient, frame);
    record_length.innerHTML = secondsToHMS(ecg.record_length);
    clock_frequency.innerHTML = `${ecg.clock_frequency} ticks per second`;
    all_annotations.innerHTML = `${ecg.all_annotations} annotations`;
    cur_patient_gender.innerHTML = ecg.patient.gender;
    cur_patient_age.innerHTML = ecg.patient.age;
    cur_patient_firstname.innerHTML = ecg.patient.first_name;
    cur_patient_lastname.innerHTML = ecg.patient.last_name;
    if (ecg.patient.gender === 'male') {
        cur_patient_img.innerHTML = 'person_4';
    } else {
        cur_patient_img.innerHTML = 'person_3';
    }
    annotators.innerHTML = ``;
    for (const key in ecg.annotations) {
        let annotation = ecg.annotations[key];
        var ann_name = annotation[0].padEnd(10, ' ');
        annotators.innerHTML += `
        <h4>${ann_name}:
        <p style="display: inline;">
            ${annotation[1]}
        </p>
        </h4>
        `;
    }
    signals.innerHTML = ``;
    for (const ecgKey in ecg.signals) {
        let key = ecgKey;
        let value = ecg.signals[key];
        signals.innerHTML += `
        <h4>${key}</h4>
        <p style="display: inline;width: 100%; right: 0;">
            ${value}
        </p>
        `;
    }
    notes.innerHTML = ``;
    for (const note in ecg.notes) {
        notes.innerHTML += `
            - ${ecg.notes[note]}<br>
        `;
    }

    var pt = document.getElementById(`teacher-${patient}`);
    pt.classList.add('selected-patient');

    await updateChartData(ecg);
}

function secondsToHMS(seconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format the output to always have two digits
    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');
}

setInterval(updateDateTime, 1000);
updateDateTime();