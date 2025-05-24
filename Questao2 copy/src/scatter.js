import * as d3 from 'd3';

async function loadData() {
    const response = await fetch('taxi.json');
    return await response.json();
}

function getAvgTipByHour(data) {
    // Agrupa as gorjetas por hora e calcula a média
    const tipByHour = d3.rollup(
        data.filter(d => d.tip_amount && d.lpep_pickup_datetime),
        v => d3.mean(v, d => +d.tip_amount),
        d => {
            const date = new Date(+d.lpep_pickup_datetime * 1000);
            return date.getHours();
        }
    );

    // Converte o Map para array [{hour: ..., avgTip: ...}, ...]
    return Array.from(tipByHour, ([hour, avgTip]) => ({ hour, avgTip }));
}

export async function loadChart(margens = { left: 50, right: 25, top: 25, bottom: 50 }) {
    const svg = d3.select('svg');
    const width = +svg.style("width").replace("px", "") - margens.left - margens.right;
    const height = +svg.style("height").replace("px", "") - margens.top - margens.bottom;

    const data = getAvgTipByHour(await loadData());

    const x = d3.scaleBand()
        .domain(data.map(d => d.hour))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avgTip)])
        .nice()
        .range([height, 0]);

    const group = svg.select('#group')
        .attr("transform", `translate(${margens.left}, ${margens.top})`);

    // Bind data para barras
    const bars = group.selectAll('rect').data(data);

    bars.enter()
        .append('rect')
        .merge(bars)
        .attr('x', d => x(d.hour))
        .attr('y', d => y(d.avgTip))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.avgTip))
        .attr('fill', 'steelblue');

    bars.exit().remove();

    // Eixos
    const xAxis = d3.axisBottom(x).tickFormat(d => `${d}:00`);
    const yAxis = d3.axisLeft(y);

    svg.select('#axisX')
        .attr("transform", `translate(${margens.left}, ${height + margens.top})`)
        .call(xAxis);

    svg.select('#axisY')
        .attr("transform", `translate(${margens.left}, ${margens.top})`)
        .call(yAxis);
}

export function clearChart() {
    d3.select('#group').selectAll('rect').remove();
    d3.select('#axisX').selectAll('*').remove();
    d3.select('#axisY').selectAll('*').remove();
}