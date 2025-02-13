var chart = null;
let patient = null;
let frame = 0;
let ann_detail = null;
let ann_detail_pointer = 0;
let record_fs = 1;

const sideMenu = document.querySelector("aside");
const profile_btn = document.getElementById("profile-btn");
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

profile_btn.addEventListener('click', () => {
    if (!sideMenu.classList.contains("active")) {
        sideMenu.classList.add("active");
    } else {
        sideMenu.classList.remove("active");
    }
});

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

const colors = ['#C91F37', '#3A2F7B', '#8E44AD', '#1ABC9C', '#F1C40F', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22', '#16A085', '#D35400', '#2980B9', '#27AE60', '#8E44AD', '#F39C12', '#C0392B', '#7F8C8D', '#2C3E50', '#BDC3C7'];

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
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
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
        method: 'DELETE', headers: {
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

async function fetchPatientDetailsData(patient) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/patients/${patient}/?format=json`, {
        method: 'GET', headers: {
            'Content-Type': 'application/json', 'Authorization': `${token}`
        }, credentials: 'include'
    });
    if (!response.ok) {
        alert("Error on fetching patient details");
        return;
    }
    return await response.json();
}

async function fetchECGData(patient, frame = 0) {
    var frame_size = document.getElementById('length').value;
    const start = Math.floor(frame * frame_size);
    const token = localStorage.getItem('token');

    const response = await fetch(`/api/ecg?format=json&patient=${patient}&start=${start}&length=${frame_size}`, {
        method: 'GET', headers: {
            'Content-Type': 'application/json', 'Authorization': `${token}`
        }, credentials: 'include'
    });
    if (!response.ok) {
        // console.log(frame);
        // console.log(frame_size);
        console.log("An error has occurred during processing.");
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
        ecg_data, // peaks
    };
}

async function updateChartData(ecg) {
    const {
        ecg_data, // peaks
    } = processECGData(ecg);
    // let length = document.getElementById('length').value;

    if (chart == null) return;

    // Update labels and datasets
    // chart.data.labels = Array.from({length: ecg_data.length}, (_, i) => i);
    // chart.data.datasets.forEach((dataset, index) => {
    //     // if (index < 5) { // For peak datasets
    //     // if (length <= 11) {
    //     //     dataset.data = peaks[Object.keys(peaks)[index]];
    //     // } else {
    //     //     dataset.data = [];
    //     // }
    //     // } else { // For ECG signal dataset
    //     dataset.data = ecg_data;
    //     // }
    // });

    chart.data.labels = ecg_data.map(x => x[0]);
    chart.data.datasets[0].data = ecg_data.map(x => x[1]);
    chart.options.plugins.annotation.annotations.annline =
        {
            type: 'line',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 0,
        };

    chart.update();
}

async function renderECG(patient, frame = 0) {
    let showScales = window.innerWidth >= 768;

    const ecg = await fetchECGData(patient, frame);
    const {
        ecg_data, // peaks
    } = processECGData(ecg);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line', data: {
            // labels: Array.from({length: ecg_data.length}, (_, i) => i),
            labels: ecg_data.map(x => x[0]), datasets: [{
                type: 'line',
                label: 'ECG',
                data: ecg_data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(100,100,100,0.27)',
                tension: 0.2,
                pointStyle: 'circle',
                pointRadius: 0.2,
                fill: false
            }, // {type: 'bubble', label: 'P Peak', data: peaks.ECG_P_Peaks, borderColor: '#1f77b4', pointRadius: 8},
                // {type: 'bubble', label: 'Q Peak', data: peaks.ECG_Q_Peaks, borderColor: '#ff7f0e', pointRadius: 8},
                // {type: 'bubble', label: 'R Peak', data: peaks.ECG_R_Peaks, borderColor: '#d62728', pointRadius: 8},
                // {type: 'bubble', label: 'S Peak', data: peaks.ECG_S_Peaks, borderColor: '#2ca02c', pointRadius: 8},
                // {type: 'bubble', label: 'T Peak', data: peaks.ECG_T_Peaks, borderColor: '#9467bd', pointRadius: 8},
            ],
        }, options: {
            responsive: true, scales: {
                x: {
                    type: 'linear',

                    title: {
                        display: showScales, text: 'Time (ms)',
                    }, ticks: {
                        maxTicksLimit: 6, bounds: 'ticks', // Include bounds for the ticks
                        includeBounds: true, // Ensure the first and last ticks are included
                        callback: function (value) {
                            return secondsToHMS(value / 1000);
                            // if (value > 1000) {
                            //     return Math.floor(value / 1000) + "s";
                            // } else {
                            //     return value + "ms";
                            // }
                        }
                    }
                }, y: {
                    title: {
                        display: showScales, text: 'Amplitude (mV)'
                    }
                }
            }, plugins: {
                legend: {
                    display: false, position: 'right', align: 'center', fullSize: true

                },
            }
        },

    });

    // var l = chart.axis.getLabels();
    // chart.axis.ticks.push({value: chart.axis.max, label: l[chart.axis.max]});

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
    try {
        const ecg = await fetchECGData(patient, frame);
        await updateChartData(ecg);
    } catch (e) {
        frame--;
    }
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
    var annotaion_box = document.getElementById(`annselect`);
    var total_length = document.getElementById(`total_length`);
    pt.classList.remove('selected-patient');

    frame = 0;
    patient = id;

    const patient_details = await fetchPatientDetailsData(patient);
    ann_detail = patient_details.pulse_details.annotations_details;
    record_length.innerHTML = secondsToHMS(patient_details.pulse_details.record_length);
    total_length.innerHTML = `Total: ${record_length.innerHTML}`;
    record_fs = patient_details.pulse_details.clock_frequency;
    clock_frequency.innerHTML = `${patient_details.pulse_details.clock_frequency} ticks per second`;
    all_annotations.innerHTML = `${patient_details.pulse_details.all_annotations} annotations`;
    cur_patient_gender.innerHTML = patient_details.gender;
    cur_patient_age.innerHTML = patient_details.age;
    cur_patient_firstname.innerHTML = patient_details.first_name;
    cur_patient_lastname.innerHTML = patient_details.last_name;
    if (patient_details.gender === 'male') {
        cur_patient_img.innerHTML = 'person_4';
    } else {
        cur_patient_img.innerHTML = 'person_3';
    }
    annotators.innerHTML = '';
    annotaion_box.innerHTML = '';
    for (const key in patient_details.pulse_details.annotations) {
        let annotation = patient_details.pulse_details.annotations[key];
        var ann_name = annotation[0].padEnd(10, ' ');
        annotators.innerHTML += `<h4>${ann_name}:<p style="display: inline;">${annotation[1]}</p></h4>`;

        var option = document.createElement("option");
        option.text = ann_name;
        option.value = ann_name;
        annotaion_box.add(option);
    }
    signals.innerHTML = ``;
    for (const patient_detailsKey in patient_details.pulse_details.signals) {
        let key = patient_detailsKey;
        let value = patient_details.pulse_details.signals[key];
        signals.innerHTML += `
        <h4>${key}</h4>
        <p style="display: inline;width: 100%; right: 0;">
            ${value}
        </p>
        `;
    }
    notes.innerHTML = ``;
    for (const note in patient_details.pulse_details.notes) {
        notes.innerHTML += `
            - ${patient_details.pulse_details.notes[note]}<br>
        `;
    }

    var pt = document.getElementById(`teacher-${patient}`);
    pt.classList.add('selected-patient');

    const ecg = await fetchECGData(patient, frame);
    await updateChartData(ecg);
}

function secondsToHMS(seconds) {
    // Calculate hours, minutes, and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Number((seconds % 60).toFixed(2));

    // Format the output to always have two digits
    return [String(hours).padStart(2, '0'), String(minutes).padStart(2, '0'), String(secs).padStart(2, '0')].join(':');
}

setInterval(updateDateTime, 1000);
updateDateTime();


const time_h = document.getElementById("time-h");
const time_m = document.getElementById("time-m");
const time_s = document.getElementById("time-s");
const time_h_inc = document.getElementById("time-h-inc");
const time_h_dec = document.getElementById("time-h-dec");
const time_m_inc = document.getElementById("time-m-inc");
const time_m_dec = document.getElementById("time-m-dec");
const time_s_inc = document.getElementById("time-s-inc");
const time_s_dec = document.getElementById("time-s-dec");

async function UpdateSeekTime(h, m, s) {
    time_h.style.color = '';
    time_m.style.color = '';
    time_s.style.color = '';

    h = Number(h);
    m = Number(m);
    s = Number(s);
    if (h < 0) {
        h = h + 24;
    }
    if (m < 0) {
        m = m + 60;
    }
    if (s < 0) {
        s = s + 60;
    }
    time_h.innerHTML = String(h % 24).padStart(2, '0');
    time_m.innerHTML = String(m % 60).padStart(2, '0');
    time_s.innerHTML = String(s % 60).padStart(2, '0');

    try {
        var frame_size = document.getElementById('length').value;
        frame = (s + (m * 60) + (h * 3600)) / Number(frame_size);
        const ecg = await fetchECGData(patient, Math.floor(frame));
        await updateChartData(ecg);
    } catch (e) {
        time_h.style.color = 'var(--color-danger)';
        time_m.style.color = 'var(--color-danger)';
        time_s.style.color = 'var(--color-danger)';
    }
}

time_h_inc.addEventListener('click', () => UpdateSeekTime(Number(time_h.innerHTML) + 1, time_m.innerHTML, time_s.innerHTML));
time_h_dec.addEventListener('click', () => UpdateSeekTime(Number(time_h.innerHTML) - 1, time_m.innerHTML, time_s.innerHTML));
time_m_inc.addEventListener('click', () => UpdateSeekTime(time_h.innerHTML, Number(time_m.innerHTML) + 1, time_s.innerHTML));
time_m_dec.addEventListener('click', () => UpdateSeekTime(time_h.innerHTML, Number(time_m.innerHTML) - 1, time_s.innerHTML));
time_s_inc.addEventListener('click', () => UpdateSeekTime(time_h.innerHTML, time_m.innerHTML, Number(time_s.innerHTML) + 1));
time_s_dec.addEventListener('click', () => UpdateSeekTime(time_h.innerHTML, time_m.innerHTML, Number(time_s.innerHTML) - 1));


const ann_back = document.getElementById("ann_back");
const ann_forward = document.getElementById("ann_forward");
const annselect = document.getElementById("annselect");

async function findNextAnn(value) {
    var frame_size = document.getElementById('length').value;
    const frm = frame;
    for (let i = 0; i < Object.keys(ann_detail).length; i++) {
        if (String(value.trim().toLowerCase()) === String(Object.keys(ann_detail)[i].trim().toLowerCase())) {
            try {
                const patient_details = await fetchPatientDetailsData(patient);
                ann_detail = patient_details.pulse_details.annotations_details;

                var x = ann_detail[Object.keys(ann_detail)[i]];
                var array = x.filter(a => a > ann_detail_pointer);
                if (array.length <= 0) return;

                var y = array[0] / record_fs;
                if (y == null || value !== value) return;
                ann_detail_pointer = array[0];

                frame = y / Number(frame_size);

                const ecg = await fetchECGData(patient, Math.floor(frame));
                await updateChartData(ecg);

                chart.options.plugins.annotation.annotations.annline =
                    {
                        type: 'line',
                        xMin: y * 1000,
                        xMax: y * 1000,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                    };
                chart.update();
            } catch (e) {
                frame = frm;
            }
        }
    }
}

async function findPrevAnn(value) {
    var frame_size = document.getElementById('length').value;
    const frm = frame;
    for (let i = 0; i < Object.keys(ann_detail).length; i++) {
        if (String(value.trim().toLowerCase()) === String(Object.keys(ann_detail)[i].trim().toLowerCase())) {
            try {
                const patient_details = await fetchPatientDetailsData(patient);
                ann_detail = patient_details.pulse_details.annotations_details;

                var x = ann_detail[Object.keys(ann_detail)[i]];
                var array = x.filter(a => a < ann_detail_pointer);
                if (array.length <= 0) return;

                var y = array[array.length - 1] / record_fs;
                if (y == null || value !== value) return;
                ann_detail_pointer = array[array.length - 1];

                frame = y / Number(frame_size);

                const ecg = await fetchECGData(patient, Math.floor(frame));
                await updateChartData(ecg);

                chart.options.plugins.annotation.annotations.annline =
                    {
                        type: 'line',
                        xMin: y * 1000,
                        xMax: y * 1000,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                    };
                chart.update();
            } catch (e) {
                frame = frm;
            }
        }
    }
}

ann_forward.addEventListener('click', () => findNextAnn(annselect.value));
ann_back.addEventListener('click', () => findPrevAnn(annselect.value));