// import * as d3 from 'd3'; 

// async function loadData() {
//     const response = await fetch('taxi.json');
//     return await response.json();
// }

// function getAvgTipByHour(data) {
//     const tipByHour = d3.rollup(
//         data.filter(d => d.tip_amount && d.lpep_pickup_datetime),
//         v => d3.mean(v, d => +d.tip_amount),
//         d => {
//             const date = new Date(+d.lpep_pickup_datetime * 1000);
//             return date.getHours();
//         }
//     );

//     return Array.from(tipByHour, ([hour, avgTip]) => ({ hour, avgTip }));
// }

// function getAvgRidesByHour(data) {
//     // Primeiro, extrai a data completa (ano-mês-dia) para contar dias únicos
//     const days = new Set(
//         data
//             .filter(d => d.lpep_pickup_datetime)
//             .map(d => {
//                 const date = new Date(+d.lpep_pickup_datetime * 1000);
//                 return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
//             })
//     );

//     const totalDays = days.size;

//     // Conta quantas corridas ocorreram em cada hora
//     const ridesByHour = d3.rollup(
//         data.filter(d => d.lpep_pickup_datetime),
//         v => v.length,
//         d => {
//             const date = new Date(+d.lpep_pickup_datetime * 1000);
//             return date.getHours();
//         }
//     );

//     // Calcula a média por hora por dia
//     return Array.from(ridesByHour, ([hour, count]) => ({
//         hour,
//         avgRides: count / totalDays
//     }));
// }

// export async function loadChart(margens = { left: 60, right: 25, top: 25, bottom: 60 }) {
//     const svg = d3.select('svg');
//     const width = +svg.style("width").replace("px", "") - margens.left - margens.right;
//     const height = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

//     const data = getAvgTipByHour(await loadData());

//     const hourOrder = [...Array(24).keys()].slice(6).concat([...Array(6).keys()]);
//     data.sort((a, b) => hourOrder.indexOf(a.hour) - hourOrder.indexOf(b.hour));

//     const x = d3.scaleBand()
//         .domain(data.map(d => d.hour))
//         .range([0, width])
//         .padding(0.1);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(data, d => d.avgTip)])
//         .nice()
//         .range([height, 0]);

//     const group = svg.select('#group')
//         .attr("transform", `translate(${margens.left}, ${margens.top})`);

//     const bars = group.selectAll('rect').data(data);

//     bars.enter()
//         .append('rect')
//         .merge(bars)
//         .attr('x', d => x(d.hour))
//         .attr('y', d => y(d.avgTip))
//         .attr('width', x.bandwidth())
//         .attr('height', d => height - y(d.avgTip))
//         .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

//     bars.exit().remove();

//     const xAxis = d3.axisBottom(x).tickFormat(d => `${d}:00`);
//     const yAxis = d3.axisLeft(y);

//     svg.select('#axisX')
//         .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
//         .call(xAxis);

//     svg.select('#axisY')
//         .attr("transform", `translate(${margens.left}, ${margens.top})`)
//         .call(yAxis);

//     // Eixo X - Label
//     svg.append("text")
//         .attr("class", "x label")
//         .attr("text-anchor", "middle")
//         .attr("x", margens.left + width / 2)
//         .attr("y", height + margens.top + 40)
//         .text("Horário da Corrida (Horas)");

//     // Eixo Y - Label
//     svg.append("text")
//         .attr("class", "y label")
//         .attr("text-anchor", "middle")
//         .attr("transform", `rotate(-90)`)
//         .attr("x", - (margens.top + height / 2))
//         .attr("y", 15)
//         .text("Valor Médio das Gorjetas (USD)");

//     // Legenda
//     const legend = svg.append("g")
//         .attr("transform", `translate(${width - 25}, ${margens.top})`);

//     legend.append("rect")
//         .attr("x", 0)
//         .attr("y", 0)
//         .attr("width", 15)
//         .attr("height", 15)
//         .attr("fill", "steelblue");

//     legend.append("text")
//         .attr("x", 20)
//         .attr("y", 12)
//         .text("Tarde (6h - 17h)");

//     legend.append("rect")
//         .attr("x", 0)
//         .attr("y", 25)
//         .attr("width", 15)
//         .attr("height", 15)
//         .attr("fill", "crimson");

//     legend.append("text")
//         .attr("x", 20)
//         .attr("y", 38)
//         .text("Noite (18h - 5h)");
// }

// export function clearChart() {
//     d3.select('#group').selectAll('rect').remove();
//     d3.select('#axisX').selectAll('*').remove();
//     d3.select('#axisY').selectAll('*').remove();
//     d3.selectAll('.x.label, .y.label').remove();
//     d3.select('svg').selectAll('g').filter(function () {
//         return d3.select(this).text().includes("Tarde") || d3.select(this).text().includes("Noite");
//     }).remove();
// }

// export async function loadChart1(margens = { left: 60, right: 25, top: 25, bottom: 60 }) {
//     const svg = d3.select('svg');
//     const width = +svg.style("width").replace("px", "") - margens.left - margens.right;
//     const height = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

//     const data = getAvgRidesByHour(await loadData());

//     // Ordena do mesmo jeito: 6h até 23h, depois 0h até 5h
//     const hourOrder = [...Array(24).keys()].slice(6).concat([...Array(6).keys()]);
//     data.sort((a, b) => hourOrder.indexOf(a.hour) - hourOrder.indexOf(b.hour));

//     const x = d3.scaleBand()
//         .domain(data.map(d => d.hour))
//         .range([0, width])
//         .padding(0.1);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(data, d => d.avgRides)])
//         .nice()
//         .range([height, 0]);

//     const group = svg.select('#group')
//         .attr("transform", `translate(${margens.left}, ${margens.top})`);

//     const bars = group.selectAll('rect').data(data);

//     bars.enter()
//         .append('rect')
//         .merge(bars)
//         .attr('x', d => x(d.hour))
//         .attr('y', d => y(d.avgRides))
//         .attr('width', x.bandwidth())
//         .attr('height', d => height - y(d.avgRides))
//         .attr('fill', d => (d.hour >= 6 && d.hour <= 17) ? 'steelblue' : 'crimson');

//     bars.exit().remove();

//     const xAxis = d3.axisBottom(x).tickFormat(d => `${d}:00`);
//     const yAxis = d3.axisLeft(y);

//     svg.select('#axisX')
//         .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
//         .call(xAxis);

//     svg.select('#axisY')
//         .attr("transform", `translate(${margens.left}, ${margens.top})`)
//         .call(yAxis);

//     // Eixo X - Label
//     svg.append("text")
//         .attr("class", "x label")
//         .attr("text-anchor", "middle")
//         .attr("x", margens.left + width / 2)
//         .attr("y", height + margens.top + 40)
//         .text("Horário da Corrida (Horas)");

//     // Eixo Y - Label
//     svg.append("text")
//         .attr("class", "y label")
//         .attr("text-anchor", "middle")
//         .attr("transform", `rotate(-90)`)
//         .attr("x", - (margens.top + height / 2))
//         .attr("y", 15)
//         .text("Média de Corridas por Hora");

//     // Legenda
//     const legend = svg.append("g")
//         .attr("transform", `translate(${width - 25}, ${margens.top})`);

//     legend.append("rect")
//         .attr("x", 0)
//         .attr("y", 0)
//         .attr("width", 15)
//         .attr("height", 15)
//         .attr("fill", "steelblue");

//     legend.append("text")
//         .attr("x", 20)
//         .attr("y", 12)
//         .text("Tarde (6h - 17h)");

//     legend.append("rect")
//         .attr("x", 0)
//         .attr("y", 25)
//         .attr("width", 15)
//         .attr("height", 15)
//         .attr("fill", "crimson");

//     legend.append("text")
//         .attr("x", 20)
//         .attr("y", 38)
//         .text("Noite (18h - 5h)");
// }



