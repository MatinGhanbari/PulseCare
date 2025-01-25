async function fetchECGData() {
    const response = await fetch('http://127.0.0.1:8000/api/ecg/?format=json');
    return await response.json();
}

function maxValue(ctx) {
    let max = 0;
    const dataset = ctx.chart.data.datasets[0];
    dataset.data.forEach(function(el) {
        max = Math.max(max, el);
    });
    return max;
}

function maxIndex(ctx) {
    const max = maxValue(ctx);
    const dataset = ctx.chart.data.datasets[0];
    return dataset.data.indexOf(max);
}

function maxLabel(ctx) {
    return ctx.chart.data.labels[maxIndex(ctx)];
}

async function renderECG() {
    const ecg = await fetchECGData();
    const ecg_data = ecg.ecg_data;
    const r_peaks_data = ecg.r_peaks.filter(x => x < ecg_data.length).map(x => [x, ecg_data[x][1]]);
    const t_peaks_data = ecg.t_peaks.filter(x => x < ecg_data.length).map(x => [x, ecg_data[x][1]]);
    const p_peaks_data = ecg.p_peaks.filter(x => x < ecg_data.length).map(x => [x, ecg_data[x][1]]);
    const q_peaks_data = ecg.q_peaks.filter(x => x < ecg_data.length).map(x => [x, ecg_data[x][1]]);
    const s_peaks_data = ecg.s_peaks.filter(x => x < ecg_data.length).map(x => [x, ecg_data[x][1]]);

    const ctx = document.getElementById('ecgChart').getContext('2d');

    console.log(ecg_data[126]);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: ecg_data.length }, (_, i) => i),
            datasets: [
                {
                    type: 'bubble',
                    label: 'R Peaks',
                    data: r_peaks_data,
                    borderColor: 'rgb(220,8,8)',
                    pointRadius: 5,
                },
                {
                    type: 'bubble',
                    label: 'T Peaks',
                    data: t_peaks_data,
                    borderColor: 'rgb(0,124,9)',
                    pointRadius: 5,
                },
                {
                    type: 'bubble',
                    label: 'P Peaks',
                    data: p_peaks_data,
                    borderColor: 'rgb(255,99,132)',
                    pointRadius: 5,
                },
                {
                    type: 'bubble',
                    label: 'Q Peaks',
                    data: q_peaks_data,
                    borderColor: 'rgb(173,185,0)',
                    pointRadius: 5,
                },
                {
                    type: 'bubble',
                    label: 'S Peaks',
                    data: s_peaks_data,
                    borderColor: 'rgb(185,56,0)',
                    pointRadius: 5,
                },
                {
                    type: 'line',
                    label: 'ECG Signal',
                    data: ecg_data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(100,100,100,0.15)',
                    tension: 0.2,
                    pointStyle: 'circle',
                    pointRadius: 0.5,
                    fill: true,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Time (ms)' } },
                y: { title: { display: true, text: 'Amplitude (mV)' } }
            },
            plugins: {
                annotation: {
                    clip: false,
                    annotations: {
                        annotation1 : {
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
}

renderECG();