import * as d3 from 'd3';

let dadosBrutos = null;

export async function loadChart(index) {
  const container = d3.select("#chart");
  container.selectAll("*").remove();

  if (!dadosBrutos) {
    const resposta = await fetch("taxi.json");
    const json = await resposta.json();
    dadosBrutos = tratarDados(json);
    console.log("Dados carregados e tratados:", dadosBrutos.length);
  }

  const diasUteis = dadosBrutos.filter(d => !d.fim_de_semana);
  const fimDeSemana = dadosBrutos.filter(d => d.fim_de_semana);

  switch (index) {
    case 0:
      chartTotalCorridas(container, diasUteis, fimDeSemana);
      break;
    case 1:
      chartMedias(container, diasUteis, fimDeSemana);
      break;
    case 2:
      chartPagamento(container, diasUteis, fimDeSemana);
      break;
    case 3:
      chartRatecodeTriptype(container, dadosBrutos);
      break;
    case 4:
      chartEstatisticas(container, diasUteis, fimDeSemana);
      break;
    default:
      container.append("p").text("Gráfico não encontrado.");
  }
}

export function clearChart() {
  d3.select("#chart").selectAll("*").remove();
}

function tratarDados(data) {
  return data.map(d => {
    const pickupRaw = +d.lpep_pickup_datetime;
    const dropoffRaw = +d.lpep_dropoff_datetime;

    const pickup = new Date(pickupRaw < 1e12 ? pickupRaw * 1000 : pickupRaw);
    const dropoff = new Date(dropoffRaw < 1e12 ? dropoffRaw * 1000 : dropoffRaw);

    const tempo = (dropoff - pickup) / 60000;

    return {
      passenger_count: +d.passenger_count || 0,
      trip_distance: +d.trip_distance || 0,
      fare_amount: +d.fare_amount || 0,
      tip_amount: +d.tip_amount || 0,
      total_amount: +d.total_amount || 0,
      payment_type: d.payment_type || "null",
      ratecode_id: d.ratecode_id || "null",
      trip_type: d.trip_type || "null",
      fim_de_semana: [0, 6].includes(pickup.getDay()),
      tempo_viagem: tempo > 0 ? tempo : 0
    };
  }).filter(d => d.tempo_viagem > 0);
}

// --- GRÁFICO 0 ---
function chartTotalCorridas(container, diasUteis, fimDeSemana) {
  const data = [
    { label: "Dias Úteis", value: diasUteis.length },
    { label: "Fim de Semana", value: fimDeSemana.length }
  ];
  desenharBarraSimples(container, data, "Total de Corridas");
}

// --- GRÁFICO 1 ---
function chartMedias(container, diasUteis, fimDeSemana) {
  const campos = ["trip_distance", "fare_amount", "tip_amount", "total_amount", "tempo_viagem"];
  const nomes = {
    trip_distance: "Distância (mi)",
    fare_amount: "Valor Corrida (USD)",
    tip_amount: "Gorjeta (USD)",
    total_amount: "Total (USD)",
    tempo_viagem: "Tempo (min)"
  };

  const data = campos.map(campo => ({
    variavel: nomes[campo],
    "Dias Úteis": d3.mean(diasUteis, d => d[campo]),
    "Fim de Semana": d3.mean(fimDeSemana, d => d[campo])
  }));

  desenharBarrasAgrupadas(container, data, "variavel", "Médias Comparativas");
}

// --- GRÁFICO 2 ---
function chartPagamento(container, diasUteis, fimDeSemana) {
  const tipos = new Set([...diasUteis, ...fimDeSemana].map(d => d.payment_type));
  const data = Array.from(tipos).map(tipo => ({
    tipo,
    "Dias Úteis": diasUteis.filter(d => d.payment_type === tipo).length,
    "Fim de Semana": fimDeSemana.filter(d => d.payment_type === tipo).length
  }));

  desenharBarrasEmpilhadas(container, data, "tipo", "Tipos de Pagamento");
}

// --- GRÁFICO 3 ---
function chartRatecodeTriptype(container, dados) {
  const categorias = ["ratecode_id", "trip_type"];

  categorias.forEach(cat => {
    const grupos = d3.rollup(
      dados,
      v => v.length,
      d => d[cat],
      d => d.fim_de_semana ? "Fim de Semana" : "Dias Úteis"
    );

    const data = Array.from(grupos, ([chave, valores]) => ({
      categoria: String(chave),
      "Dias Úteis": valores.get("Dias Úteis") || 0,
      "Fim de Semana": valores.get("Fim de Semana") || 0
    }));

    desenharBarrasAgrupadas(container, data, "categoria", `Categorias: ${cat}`);
  });
}

// --- GRÁFICO 4 ---
function chartEstatisticas(container, diasUteis, fimDeSemana) {
  const campos = ["trip_distance", "fare_amount", "tip_amount", "total_amount", "tempo_viagem"];

  const data = campos.map(campo => {
    const u = diasUteis.map(d => d[campo]);
    const w = fimDeSemana.map(d => d[campo]);

    const uMedia = d3.mean(u), uStd = d3.deviation(u), uAmp = d3.max(u) - d3.min(u);
    const wMedia = d3.mean(w), wStd = d3.deviation(w), wAmp = d3.max(w) - d3.min(w);

    return {
      variavel: campo,
      "Desvio Dias Úteis": uStd,
      "Desvio Fim de Semana": wStd,
      "Amplitude Dias Úteis": uAmp,
      "Amplitude Fim de Semana": wAmp,
      "CV Dias Úteis": (uStd / uMedia) * 100,
      "CV Fim de Semana": (wStd / wMedia) * 100
    };
  });

  desenharBarrasAgrupadas(container, data, "variavel", "Desvio Padrão", ["Desvio Dias Úteis", "Desvio Fim de Semana"]);
  desenharBarrasAgrupadas(container, data, "variavel", "Amplitude", ["Amplitude Dias Úteis", "Amplitude Fim de Semana"]);
  desenharBarrasAgrupadas(container, data, "variavel", "Coef. Variação (%)", ["CV Dias Úteis", "CV Fim de Semana"]);
}

//TOOLTIP
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("border", "1px solid #ccc")
  .style("padding", "6px 10px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("font-size", "12px");

// === GRÁFICOS ===
function desenharBarraSimples(container, data, titulo) {
  const width = 500, height = 400, margin = { top: 60, right: 30, bottom: 70, left: 80 };
  const svg = container.append("svg")
    .attr("width", width).attr("height", height);

  const inner = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand().domain(data.map(d => d.label)).range([0, width - margin.left - margin.right]).padding(0.4);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([height - margin.top - margin.bottom, 0]);

  inner.selectAll("rect")
    .data(data).enter()
    .append("rect")
    .attr("x", d => x(d.label))
    .attr("y", d => y(d.value))
    .attr("height", d => y(0) - y(d.value))
    .attr("width", x.bandwidth())
    .attr("fill", "#69b3a2")
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).text(`${d.label}: ${d.value}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 25) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  inner.append("g").attr("transform", `translate(0,${y(0)})`).call(d3.axisBottom(x));
  inner.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2).attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px").style("font-weight", "bold")
    .text(titulo);
}

function desenharBarrasAgrupadas(container, data, eixoX, titulo, chaves) {
  const width = 700, height = 450, margin = { top: 60, right: 30, bottom: 100, left: 80 };
  const grupos = chaves || ["Dias Úteis", "Fim de Semana"];

  const svg = container.append("svg")
    .attr("width", width).attr("height", height);

  const inner = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(data.map(d => d[eixoX])).range([0, width - margin.left - margin.right]).padding(0.2);
  const x1 = d3.scaleBand().domain(grupos).range([0, x0.bandwidth()]).padding(0.05);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d3.max(grupos, g => d[g] || 0))]).nice().range([height - margin.top - margin.bottom, 0]);

  const color = d3.scaleOrdinal().domain(grupos).range(d3.schemeSet2);

  inner.append("g")
    .selectAll("g")
    .data(data).enter()
    .append("g")
    .attr("transform", d => `translate(${x0(d[eixoX])},0)`)
    .selectAll("rect")
    .data(d => grupos.map(g => ({ key: g, value: d[g], label: d[eixoX] })))
    .enter()
    .append("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => y(0) - y(d.value))
    .attr("fill", d => color(d.key))
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).text(`${d.key} - ${d.label}: ${d.value.toFixed(2)}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 25) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  inner.append("g").attr("transform", `translate(0,${y(0)})`).call(d3.axisBottom(x0)).selectAll("text")
    .attr("transform", "rotate(-25)").style("text-anchor", "end");

  inner.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2).attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px").style("font-weight", "bold")
    .text(titulo);
}

function desenharBarrasEmpilhadas(container, data, chaveX, titulo) {
  const width = 700, height = 450, margin = { top: 60, right: 30, bottom: 100, left: 80 };
  const grupos = ["Dias Úteis", "Fim de Semana"];

  const svg = container.append("svg")
    .attr("width", width).attr("height", height);

  const inner = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(data.map(d => d[chaveX])).range([0, width - margin.left - margin.right]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => grupos.reduce((acc, g) => acc + (d[g] || 0), 0))]).nice().range([height - margin.top - margin.bottom, 0]);
  const color = d3.scaleOrdinal().domain(grupos).range(['#1f77b4', '#ff7f0e']);

  const stackedData = d3.stack().keys(grupos)(data);

  inner.append("g")
    .selectAll("g")
    .data(stackedData)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data[chaveX]))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", (event, d) => {
      const grupo = event.currentTarget.parentNode.__data__.key;
      const valor = d[1] - d[0];
      tooltip.style("opacity", 1).text(`${grupo} - ${d.data[chaveX]}: ${valor}`);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 25) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  inner.append("g").attr("transform", `translate(0,${y(0)})`).call(d3.axisBottom(x)).selectAll("text")
    .attr("transform", "rotate(-25)").style("text-anchor", "end");

  inner.append("g").call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2).attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px").style("font-weight", "bold")
    .text(titulo);
}
