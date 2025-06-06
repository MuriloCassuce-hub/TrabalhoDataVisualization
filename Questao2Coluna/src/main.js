import { loadChart, clearChart } from './scatter.js';

function main() {
    const loadBtn = document.querySelector('#loadBtn');
    const clearBtn = document.querySelector('#clearBtn');

    loadBtn.addEventListener('click', async () => {
        clearChart();
        await loadChart();
    });

    clearBtn.addEventListener('click', () => {
        clearChart();
    });
}

window.onload = main;

import * as d3 from 'd3';

async function loadData() {
    const response = await fetch('taxi.json');
    return await response.json();
}

function getAvgTipByHour(data) {
    const tipByHour = d3.rollup(
        data.filter(d => d.tip_amount && d.lpep_pickup_datetime),
        v => d3.mean(v, d => +d.tip_amount),
        d => {
            const date = new Date(+d.lpep_pickup_datetime * 1000);
            return date.getHours();
        }
    );
    return Array.from(tipByHour, ([hour, avgTip]) => ({ hour, avgTip }));
}

function getAvgRidesByHour(data) {
    const ridesByHour = d3.rollup(
        data.filter(d => d.lpep_pickup_datetime),
        v => v.length,
        d => {
            const date = new Date(+d.lpep_pickup_datetime * 1000);
            return date.getHours();
        }
    );
    const counts = Array.from(ridesByHour, ([hour, total]) => ({ hour, avgRides: total }));
    return counts;
}

function drawChart(svgId, groupId, axisXId, axisYId, data, yValueKey, yLabelText) {
    const svg = d3.select(`#${svgId}`);
    const group = svg.select(`#${groupId}`);
    const width = +svg.attr("width") - 85;
    const height = +svg.attr("height") - 85;
    const margens = { left: 60, right: 25, top: 25, bottom: 60 };

    const hourOrder = [...Array(24).keys()].slice(6).concat([...Array(6).keys()]);
    data.sort((a, b) => hourOrder.indexOf(a.hour) - hourOrder.indexOf(b.hour));

    const x = d3.scaleBand()
        .domain(data.map(d => d.hour))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[yValueKey])])
        .nice()
        .range([height, 0]);

    group.attr("transform", `translate(${margens.left}, ${margens.top})`);

    group.selectAll('rect').data(data)
        .enter().append('rect')
        .attr('x', d => x(d.hour))
        .attr('y', d => y(d[yValueKey]))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d[yValueKey]))
        .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

    svg.select(`#${axisXId}`)
        .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
        .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));

    svg.select(`#${axisYId}`)
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(d3.axisLeft(y));

    // Labels
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", margens.left + width / 2)
        .attr("y", height + margens.top + 40)
        .text("Horário da Corrida (Horas)");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", - (margens.top + height / 2))
        .attr("y", 15)
        .text(yLabelText);
}

(async () => {
    const data = await loadData();

    drawChart(
        "tipChart", "group-tip", "axisX-tip", "axisY-tip",
        getAvgTipByHour(data),
        "avgTip",
        "Valor Médio das Gorjetas (USD)"
    );

    drawChart(
        "rideChart", "group-ride", "axisX-ride", "axisY-ride",
        getAvgRidesByHour(data),
        "avgRides",
        "Média de Corridas por Hora"
    );
})();

// import { Taxi } from './taxi.js';
// import * as d3 from 'd3';

// async function drawChart(svgId, groupId, axisXId, axisYId, data, yValueKey, yLabelText) {
//   const svg = d3.select(`#${svgId}`);
//   const group = svg.select(`#${groupId}`);
//   const width = +svg.attr("width") - 85;
//   const height = +svg.attr("height") - 85;
//   const margens = { left: 60, right: 25, top: 25, bottom: 60 };

//   // Ordena dados por hora para plotagem (opcional)
//   data.sort((a, b) => a.hour - b.hour);

//   const x = d3.scaleBand()
//       .domain(data.map(d => d.hour))
//       .range([0, width])
//       .padding(0.1);

//   const y = d3.scaleLinear()
//       .domain([0, d3.max(data, d => d[yValueKey])])
//       .nice()
//       .range([height, 0]);

//   group.attr("transform", `translate(${margens.left}, ${margens.top})`);

//   group.selectAll('rect').data(data)
//       .enter().append('rect')
//       .attr('x', d => x(d.hour))
//       .attr('y', d => y(d[yValueKey]))
//       .attr('width', x.bandwidth())
//       .attr('height', d => height - y(d[yValueKey]))
//       .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

//   svg.select(`#${axisXId}`)
//       .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
//       .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));

//   svg.select(`#${axisYId}`)
//       .attr("transform", `translate(${margens.left}, ${margens.top})`)
//       .call(d3.axisLeft(y));

//   // Labels
//   svg.append("text")
//       .attr("class", "x label")
//       .attr("text-anchor", "middle")
//       .attr("x", margens.left + width / 2)
//       .attr("y", height + margens.top + 40)
//       .text("Horário da Corrida (Horas)");

//   svg.append("text")
//       .attr("class", "y label")
//       .attr("text-anchor", "middle")
//       .attr("transform", `rotate(-90)`)
//       .attr("x", - (margens.top + height / 2))
//       .attr("y", 15)
//       .text(yLabelText);
// }

// (async () => {
//   const taxi = new Taxi();
//   await taxi.init();
//   await taxi.loadTaxi(6);

//   const avgTipByHour = await taxi.getAvgTipByHour();
//   drawChart(
//     "tipChart", "group-tip", "axisX-tip", "axisY-tip",
//     avgTipByHour,
//     "avgTip",
//     "Valor Médio das Gorjetas (USD)"
//   );

//   const avgRidesByHour = await taxi.getAvgRidesByHour();
//   drawChart(
//     "rideChart", "group-ride", "axisX-ride", "axisY-ride",
//     avgRidesByHour,
//     "avgRides",
//     "Média de Corridas por Hora"
//   );
// })();

// import * as d3 from 'd3';

// function drawChart(svgId, groupId, axisXId, axisYId, data, yValueKey, yLabelText) {
//   const svg = d3.select(`#${svgId}`);
//   const group = svg.select(`#${groupId}`);
//   const width = +svg.attr("width") - 85;
//   const height = +svg.attr("height") - 85;
//   const margens = { left: 60, right: 25, top: 25, bottom: 60 };

//   // Ordena dados por hora para plotagem
//   data.sort((a, b) => a.hour - b.hour);

//   const x = d3.scaleBand()
//     .domain(data.map(d => d.hour))
//     .range([0, width])
//     .padding(0.1);

//   const y = d3.scaleLinear()
//     .domain([0, d3.max(data, d => d[yValueKey])])
//     .nice()
//     .range([height, 0]);

//   group.attr("transform", `translate(${margens.left}, ${margens.top})`);

//   // Remove retângulos antigos antes de desenhar (se rodar mais de uma vez)
//   group.selectAll('rect').remove();

//   group.selectAll('rect').data(data)
//     .enter().append('rect')
//     .attr('x', d => x(d.hour))
//     .attr('y', d => y(d[yValueKey]))
//     .attr('width', x.bandwidth())
//     .attr('height', d => height - y(d[yValueKey]))
//     .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

//   svg.select(`#${axisXId}`)
//     .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
//     .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));

//   svg.select(`#${axisYId}`)
//     .attr("transform", `translate(${margens.left}, ${margens.top})`)
//     .call(d3.axisLeft(y));

//   // Remove textos antigos (se houver)
//   svg.selectAll(".x.label").remove();
//   svg.selectAll(".y.label").remove();

//   // Labels
//   svg.append("text")
//     .attr("class", "x label")
//     .attr("text-anchor", "middle")
//     .attr("x", margens.left + width / 2)
//     .attr("y", height + margens.top + 40)
//     .text("Horário da Corrida (Horas)");

//   svg.append("text")
//     .attr("class", "y label")
//     .attr("text-anchor", "middle")
//     .attr("transform", `rotate(-90)`)
//     .attr("x", -(margens.top + height / 2))
//     .attr("y", 15)
//     .text(yLabelText);
// }

// const testData = [
//   { hour: 0, avgTip: 2, avgRides: 5 },
//   { hour: 1, avgTip: 3, avgRides: 7 },
//   { hour: 2, avgTip: 1.5, avgRides: 6 },
//   { hour: 3, avgTip: 4, avgRides: 8 },
//   { hour: 4, avgTip: 2.8, avgRides: 7 },
// ];

// drawChart("tipChart", "group-tip", "axisX-tip", "axisY-tip", testData, "avgTip", "Valor Médio das Gorjetas (USD)");
// drawChart("rideChart", "group-ride", "axisX-ride", "axisY-ride", testData, "avgRides", "Média de Corridas por Hora");

// import { Taxi } from './taxi.js';
// import * as d3 from 'd3';

// async function drawChart(svgId, groupId, axisXId, axisYId, data, yValueKey, yLabelText) {
//   const svg = d3.select(`#${svgId}`);
//   const group = svg.select(`#${groupId}`);
//   const width = +svg.attr("width") - 85;
//   const height = +svg.attr("height") - 85;
//   const margens = { left: 60, right: 25, top: 25, bottom: 60 };

//   // Ordena dados por hora para plotagem (opcional)
//   data.sort((a, b) => a.hour - b.hour);

//   const x = d3.scaleBand()
//     .domain(data.map(d => d.hour))
//     .range([0, width])
//     .padding(0.1);

//   const y = d3.scaleLinear()
//     .domain([0, d3.max(data, d => d[yValueKey])])
//     .nice()
//     .range([height, 0]);

//   group.attr("transform", `translate(${margens.left}, ${margens.top})`);

//   // Remove retângulos antigos antes de desenhar (para evitar sobreposição)
//   group.selectAll('rect').remove();

//   group.selectAll('rect').data(data)
//     .enter().append('rect')
//     .attr('x', d => x(d.hour))
//     .attr('y', d => y(d[yValueKey]))
//     .attr('width', x.bandwidth())
//     .attr('height', d => height - y(d[yValueKey]))
//     .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

//   svg.select(`#${axisXId}`)
//     .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
//     .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));

//   svg.select(`#${axisYId}`)
//     .attr("transform", `translate(${margens.left}, ${margens.top})`)
//     .call(d3.axisLeft(y));

//   // Remove textos antigos para não duplicar labels
//   svg.selectAll(".x.label").remove();
//   svg.selectAll(".y.label").remove();

//   // Labels
//   svg.append("text")
//     .attr("class", "x label")
//     .attr("text-anchor", "middle")
//     .attr("x", margens.left + width / 2)
//     .attr("y", height + margens.top + 40)
//     .text("Horário da Corrida (Horas)");

//   svg.append("text")
//     .attr("class", "y label")
//     .attr("text-anchor", "middle")
//     .attr("transform", `rotate(-90)`)
//     .attr("x", -(margens.top + height / 2))
//     .attr("y", 15)
//     .text(yLabelText);
// }

// window.onload = async () => {
//   const taxi = new Taxi();
//   await taxi.init();
//   await taxi.loadTaxi(6); // Carrega 6 meses
//   const data1 = await taxi.getAvgTipByHour(); 
//   const data2 = await taxi.getAvgRidesByHour(); 

//   drawChart(
//   "tipChart", "group-tip", "axisX-tip", "axisY-tip",
//   data1,
//   "avgTip",
//   "Valor Médio das Gorjetas (USD)"
//   );

//   drawChart(
//     "rideChart", "group-ride", "axisX-ride", "axisY-ride",
//     data2,
//     "avgRides",
//     "Média de Corridas por Hora"
//   );
// };

import { Taxi } from "./taxi";

function calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    
    // Ordena os valores
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    // Se for par, faz a média dos dois do meio
    return sorted.length % 2 === 0 
        ? (sorted[middle - 1] + sorted[middle]) / 2 
        : sorted[middle];
}

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

    // Cabeçalhos
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    // Adiciona colunas extras
    tableHTML += `<th>weekday_number</th>`;
    tableHTML += `<th>fim_de_semana</th>`;
    tableHTML += `<th>tempo_viagem (min)</th>`;
    tableHTML += '</tr>';

    // Variáveis para cálculos 
    let stats = {
        totalRows: 0,
        sumPassengerCount: 0,
        sumTripDistance: 0,
        sumFareAmount: 0,
        sumTipAmount: 0,
        weekdayTrips: 0,
        weekendTrips: 0,
        rateCodeCount: {},
        paymentTypeCount: {},
        tripTypeCount: {},
        // Novos arrays para cálculo da mediana
        passengerValues: [],
        distanceValues: [],
        fareValues: [],
        tipValues: []
    };

    data.forEach(item => {
        stats.totalRows++;
        
        let pickup = null;
        let dropoff = null;
        let weekdayNumber = 0;
        let isWeekend = false;

        // Processa datas e calcula dia da semana
        Object.entries(item).forEach(([key, value]) => {
            if (key === 'lpep_pickup_datetime' && typeof value === 'number') {
                pickup = new Date(value);
                const utcDay = pickup.getUTCDay(); // 0-6 (Domingo=0)
                weekdayNumber = utcDay === 0 ? 1 : utcDay + 1; // Domingo=1, Sábado=7
                isWeekend = weekdayNumber === 1 || weekdayNumber === 7;
                
                if (isWeekend) stats.weekendTrips++;
                else stats.weekdayTrips++;
            }
            if (key === 'lpep_dropoff_datetime' && typeof value === 'number') {
                dropoff = new Date(value);
            }
        });

        // Contagem dos itens categóricos
        if (item.passenger_count !== undefined) {
            stats.passengerValues.push(Number(item.passenger_count));
        }
        if (item.trip_distance !== undefined) {
            stats.distanceValues.push(Number(item.trip_distance));
        }
        if (item.fare_amount !== undefined) {
            stats.fareValues.push(Number(item.fare_amount));
        }
        if (item.tip_amount !== undefined) {
            stats.tipValues.push(Number(item.tip_amount));
        }

        // Calcula tempo de viagem
        let tempoViagemMin = pickup && dropoff ? Math.round((dropoff - pickup) / 60000) : null;

        // Atualiza estatísticas
        stats.sumPassengerCount += Number(item.passenger_count) || 0;
        stats.sumTripDistance += Number(item.trip_distance) || 0;
        stats.sumFareAmount += Number(item.fare_amount) || 0;
        stats.sumTipAmount += Number(item.tip_amount) || 0;

        // Linha da tabela
        tableHTML += '<tr>';
        Object.entries(item).forEach(([key, value]) => {
            tableHTML += `<td>${value}</td>`;
        });
        
        // Colunas extras
        tableHTML += `<td>${weekdayNumber}</td>`;
        tableHTML += `<td>${isWeekend ? 'Sim' : 'Não'}</td>`;
        tableHTML += `<td>${tempoViagemMin || ''}</td>`;
        tableHTML += '</tr>';
    });

    // Finaliza tabela
    tableHTML += '</table>';

    // Exibe estatísticas
    const mean = (sum, count) => (count ? (sum / count).toFixed(2) : '0');
    console.log('=== ESTATÍSTICAS ===');
    console.log(`Total de corridas: ${stats.totalRows}`);
    console.log(`Dias úteis: ${stats.weekdayTrips} | Fins de semana: ${stats.weekendTrips}`);
    console.log(`Média passageiros: ${mean(stats.sumPassengerCount, stats.totalRows)} | Mediana: ${calculateMedian(stats.passengerValues).toFixed(2)}`);
    console.log(`Média distância: ${mean(stats.sumTripDistance, stats.totalRows)} milhas | Mediana: ${calculateMedian(stats.distanceValues).toFixed(2)} milhas`);
    console.log(`Média valor corrida: $${mean(stats.sumFareAmount, stats.totalRows)} | Mediana: $${calculateMedian(stats.fareValues).toFixed(2)}`);
    console.log(`Média gorjetas: $${mean(stats.sumTipAmount, stats.totalRows)} | Mediana: $${calculateMedian(stats.tipValues).toFixed(2)}`);
    
    // Novas estatísticas categóricas
    console.log('\n=== CONTAGEM CATEGÓRICA ===');
    console.log('RateCodeID:', stats.rateCodeCount);
    console.log('Payment_type:', stats.paymentTypeCount);
    console.log('Trip_type:', stats.tripTypeCount);

    // Insere tabela no DOM
    const div = document.querySelector("#table");
    if (div) div.innerHTML = tableHTML;
}

window.onload = async () => {
    const taxi = new Taxi();
    await taxi.init();
    await taxi.loadTaxi(6); // Carrega 6 meses
    const data = await taxi.test(50); // Limita a 50 registros
    createTableWithInnerHTML(data);
};