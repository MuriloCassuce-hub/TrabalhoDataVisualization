import { Taxi } from "./taxi";

function createBarChartTips(data, selector = "#chart-tips") {
    const width = 900;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 60, left: 70 };

    const hourOrder = [...Array(24).keys()].slice(6).concat([...Array(6).keys()]);
    const orderedData = hourOrder.map(h => data.find(d => Number(d.hour) === h) || { hour: h, avgTip: 0 });

    console.log(orderedData);

    const svg = d3.select(selector)
        .html("") 
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x = d3.scaleBand()
        .domain(orderedData.map(d => d.hour))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(orderedData, d => d.avgTip)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d => `${d}h`));

    svg.append("text")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Horário do dia (Horas)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Média das Gorjetas (U$D)");

    svg.selectAll(".bar")
        .data(orderedData)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.hour))
        .attr("y", d => y(d.avgTip))
        .attr("height", d => y(0) - y(d.avgTip))
        .attr("width", x.bandwidth())
        .attr("fill", d => {
            const hour = Number(d.hour);
            return hour >= 6 && hour <= 17 ? "steelblue" : "crimson";
        });

    svg.selectAll(".label")
        .data(orderedData)
        .join("text")
        .attr("class", "label")
        .attr("x", d => x(d.hour) + x.bandwidth() / 2)
        .attr("y", d => y(d.avgTip) - 5) 
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "black")
        .text(d => d.avgTip.toFixed(2));

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 250}, 20)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "steelblue");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Dia (6h - 17h)")
        .style("font-size", "12px");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "crimson");

    legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text("Noite (18h - 5h)")
        .style("font-size", "12px");
}


function createScatterPlotTips(data, selector = "#chart-scatter") {
    const width = 900;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 60, left: 70 };

    const shiftHour = h => (h < 6 ? h + 24 : h);  

    const x = d3.scaleLinear()
        .domain([6, 30]) 
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.tip_amount)])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const svg = d3.select(selector)
        .html("")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x)
            .ticks(25)
            .tickFormat(d => `${d >= 24 ? d - 24 : d}h`)); 

    svg.append("text")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Horário do dia (Horas)");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Valor da Gorjeta (U$D)");

    svg.selectAll(".dot")
        .data(data)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x(shiftHour(d.hour)))
        .attr("cy", d => y(d.tip_amount))
        .attr("r", 0.5)
        .attr("fill", d => {
            const h = d.hour;
            return (h >= 6 && h < 18) ? "steelblue" : "crimson";
        })
        .attr("opacity", 0.6);

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 250}, ${margin.top})`);

    legend.append("circle")
        .attr("cx", 7)
        .attr("cy", 7)
        .attr("r", 7)
        .attr("fill", "steelblue")
        .attr("opacity", 0.6);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text("Dia (6h - 18h)")
        .style("font-size", "12px");

    legend.append("circle")
        .attr("cx", 7)
        .attr("cy", 27)
        .attr("r", 7)
        .attr("fill", "crimson")
        .attr("opacity", 0.6);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 32)
        .text("Noite (18h - 6h)")
        .style("font-size", "12px");
}



window.onload = async () => {
    const taxi = new Taxi();
    await taxi.init();
    await taxi.loadTaxi(6);
    const tipsData = await taxi.getAvgTipByHour();
    createBarChartTips(tipsData);
    const allTrips = await taxi.getAllTrips();
    createScatterPlotTips(allTrips);
};
