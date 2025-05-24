import * as d3 from 'd3';

async function loadData() {
    const response = await fetch('taxi.json');
    return await response.json();
}

function getTipVsHourScatterData(data) {
    return data
        .filter(d => d.tip_amount && d.lpep_pickup_datetime)
        .map(d => {
            const date = new Date(+d.lpep_pickup_datetime * 1000);
            const hour = date.getHours();
            const minutes = date.getMinutes();
            return {
                hour: hour + minutes / 60, // Ex: 19 + 30/60 = 19.5
                tip_amount: +d.tip_amount
            };
        });
}

export async function loadChart(margens = { left: 50, right: 25, top: 25, bottom: 50 }) {
    const svg = d3.select('svg');
    const width = +svg.style("width").replace("px", "") - margens.left - margens.right;
    const height = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

    const data = getTipVsHourScatterData(await loadData());

    const x = d3.scaleLinear()
        .domain([0, 23]) // horas do dia
        .range([0, width]);

    const maxTip = d3.max(data, d => d.tip_amount);
    const y = d3.scaleLinear()
        .domain([0, Math.min(20, maxTip)])
        .nice()
        .range([height, 0]);

    const group = svg.select('#group')
        .attr("transform", `translate(${margens.left}, ${margens.top})`);

    const circles = group.selectAll('circle').data(data);

    circles.enter()
        .append('circle')
        .merge(circles)
        .attr('cx', d => x(d.hour))
        .attr('cy', d => y(d.tip_amount))
        .attr('r', 1)
        .attr('fill', 'steelblue');

    circles.exit().remove();

    // Eixos
    const xAxis = d3.axisBottom(x).ticks(24);
    const yAxis = d3.axisLeft(y);

    svg.select('#axisX')
        .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
        .call(xAxis);

    svg.select('#axisY')
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);
}

export function clearChart() {
    d3.select('#group').selectAll('circle').remove();
    d3.select('#axisX').selectAll('*').remove();
    d3.select('#axisY').selectAll('*').remove();
}