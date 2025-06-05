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
      chartSurchargesMedias(container, diasUteis, fimDeSemana);
      break;
    case 3:
      chartRatecodeTriptype(container, dadosBrutos);
      break;
    case 4:  
      chartPizzaPagamento(container, diasUteis, fimDeSemana);
      break;
    case 5:
      chartDesvioPadrao(container, diasUteis, fimDeSemana);
      break;
    case 6:
      chartAmplitude(container, diasUteis, fimDeSemana);
      break;
    case 7:
      chartCoeficienteVariacao(container, diasUteis, fimDeSemana);
      break;


    default:
      container.append("p").text("Fim. Clique em 'Próximo Gráfico' para voltar para o início.");
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
      extra: +d.extra || 0,
      mta_tax: +d.mta_tax || 0,
      improvement_surcharge: +d.improvement_surcharge || 0,
      congestion_surcharge: +d.congestion_surcharge || 0,
      payment_type: d.payment_type || "null",
      trip_type: d.trip_type || "null",
      fim_de_semana: [0, 6].includes(pickup.getDay()),
      tempo_viagem: tempo > 0 ? tempo : 0
    };
  }).filter(d => d.tempo_viagem > 0);
}

function chartTotalCorridas(container, diasUteis, fimDeSemana) {
  const data = [
    { label: "Dias Úteis", value: diasUteis.length },
    { label: "Fim de Semana", value: fimDeSemana.length }
  ];
  desenharBarraSimples(container, data, "Total de Corridas");

}

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

function chartSurchargesMedias(container, diasUteis, fimDeSemana) {
  const campos = ["extra", "mta_tax", "improvement_surcharge", "congestion_surcharge"];
  const nomes = {
    extra: "Taxas Extra (Pico/Noturno) ($)",
    mta_tax: "MTA Tax ($0.50)",
    improvement_surcharge: "improvement_surcharge ($)",
    congestion_surcharge: "congestion_surcharge ($)"
  };

  const data = campos.map(campo => ({
    variavel: nomes[campo],
    "Dias Úteis": d3.mean(diasUteis, d => d[campo]),
    "Fim de Semana": d3.mean(fimDeSemana, d => d[campo])
  }));

  desenharBarrasAgrupadas(container, data, "variavel", "Média das Taxas por Grupo");
}



function chartPizzaPagamento(container, diasUteis, fimDeSemana) {
  const processarDadosPagamento = (dados, titulo) => {
    if (!dados || dados.length === 0) return null;
    
    const contagem = d3.rollup(
      dados,
      v => v.length,
      d => d.payment_type.toString()
    );
    
    const total = dados.length;
    
    return Array.from(contagem, ([tipo, quantidade]) => ({
      tipo,
      quantidade,
      porcentagem: (quantidade / total) * 100,
      grupo: titulo
    })).sort((a, b) => b.quantidade - a.quantidade);
  };

  const dadosUteis = processarDadosPagamento(diasUteis.filter(d => d.payment_type !== "null"), "Dias Úteis");
  const dadosFds = processarDadosPagamento(fimDeSemana.filter(d => d.payment_type !== "null"), "Fim de Semana");


  const width = 900, height = 500;
  const margin = {top: 40, right: 20, bottom: 20, left: 20};
  const raio = Math.min(150, (height - margin.top - margin.bottom) / 2 - 20);
  
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Distribuição de Tipos de Pagamento");

  const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);


  const desenharPizza = (dados, centroX, centroY, titulo, exibirLegenda = true) => {
    if (!dados || dados.length === 0) {
      svg.append("text")
        .attr("x", centroX)
        .attr("y", centroY)
        .attr("text-anchor", "middle")
        .text(`Sem dados para ${titulo}`);
      return;
    }

    const cor = d3.scaleOrdinal(d3.schemeCategory10);
    const pie = d3.pie()
      .value(d => d.quantidade)
      .sort(null);

    const arco = d3.arc()
      .innerRadius(0)
      .outerRadius(raio)
      .padAngle(0.02);

    const grupo = svg.append("g")
      .attr("transform", `translate(${centroX},${centroY})`);

    const fatias = grupo.selectAll("path")
      .data(pie(dados))
      .enter()
      .append("path")
      .attr("d", arco)
      .attr("fill", (d, i) => cor(i))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
        tooltip.style("opacity", 1)
          .html(`<strong>${d.data.tipo}</strong><br>
                 Quantidade: ${d.data.quantidade}<br>
                 Porcentagem: ${d.data.porcentagem.toFixed(1)}%`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
        tooltip.style("opacity", 0);
      });

    grupo.append("text")
      .attr("y", -raio - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(titulo);

    if (exibirLegenda) {
    const legenda = grupo.append("g")
      .attr("transform", `translate(${raio + 20}, -${raio / 2})`);

    dados.forEach((d, i) => {
      const item = legenda.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
      
      item.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", cor(i));
      
      item.append("text")
        .attr("x", 24)
        .attr("y", 14)
        .style("font-size", "12px")
        .text(`${d.tipo} (${d.porcentagem.toFixed(1)}%)`);
    });
}
  };

  desenharPizza(dadosUteis, width * 0.22, height / 2, "Dias Úteis", true);
  desenharPizza(dadosFds, width * 0.68, height / 2, "Fim de Semana", true);

}



function chartRatecodeTriptype(container, dados) {
  const categorias = ["trip_type"];

  const mapaTexto = {
    1: "1 (Pegou diretamente na rua)",
    2: "2 (Chamou por aplicativo)"
  };

  categorias.forEach(cat => {
    const grupos = d3.rollup(
      dados,
      v => v.length,
      d => d[cat],
      d => d.fim_de_semana ? "Fim de Semana" : "Dias Úteis"
    );

    const data = Array.from(grupos, ([chave, valores]) => ({
      categoria: mapaTexto[chave] || String(chave),
      "Dias Úteis": valores.get("Dias Úteis") || 0,
      "Fim de Semana": valores.get("Fim de Semana") || 0
    }));

    desenharBarrasAgrupadas(container, data, "categoria", `Quantidade de viagens por ${cat}`);
  });
}



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
    .attr("fill", d => {
        return d.label === "Dias Úteis" ? "#1f77b4" : "#ff7f0e";
        })
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
    .attr("fill", d => {
        if (d.key.includes("Dias Úteis")) return "#1f77b4";
        if (d.key.includes("Fim de Semana")) return "#ff7f0e";
        return "#999";
    })


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

  adicionarLegenda(svg, width, height);
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
    .attr("fill", d => {
        return d.key === "Dias Úteis" ? "#1f77b4" : "#ff7f0e";
        })
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
  
  adicionarLegenda(svg, width, height);
}

function adicionarLegenda(svg, width, height) {
  const legenda = svg.append("g")
    .attr("class", "legenda")
    .attr("transform", `translate(${width - 180}, ${height - 40})`);

  const itens = [
    { cor: "#1f77b4", texto: "Dias Úteis" },
    { cor: "#ff7f0e", texto: "Fim de Semana" }
  ];

  legenda.selectAll("g")
    .data(itens)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .each(function(d) {
      const g = d3.select(this);
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d.cor);

      g.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .text(d.texto);
    });
}

function chartDesvioPadrao(container, diasUteis, fimDeSemana) {
  const campos = ["trip_distance", "fare_amount", "tip_amount", "total_amount", "tempo_viagem"];
  const nomes = {
    trip_distance: "Distância (mi)",
    fare_amount: "Valor Corrida (USD)",
    tip_amount: "Gorjeta (USD)",
    total_amount: "Total (USD)",
    tempo_viagem: "Tempo (min)"
  };

  const dadosUteis = campos.map(campo => {
    const valores = diasUteis.map(d => d[campo]);
    return {
      variavel: nomes[campo],
      valor: d3.deviation(valores)
    };
  });

  const dadosFds = campos.map(campo => {
    const valores = fimDeSemana.map(d => d[campo]);
    return {
      variavel: nomes[campo],
      valor: d3.deviation(valores)
    };
  });

  const width = 800, height = 500;
  const margin = {top: 60, right: 80, bottom: 70, left: 80};
  
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scalePoint()
    .domain(campos.map(c => nomes[c]))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max([...dadosUteis, ...dadosFds], d => d.valor) * 1.1])
    .range([height - margin.bottom, margin.top])
    .nice();

  const linha = d3.line()
    .x(d => x(d.variavel))
    .y(d => y(d.valor));

  svg.append("path")
    .datum(dadosUteis)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", linha);

  svg.append("path")
    .datum(dadosFds)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2")
    .attr("d", linha);

  svg.selectAll(".ponto-uteis")
    .data(dadosUteis)
    .enter().append("circle")
    .attr("class", "ponto-uteis")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#1f77b4")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Dias Úteis</strong><br>${d.variavel}: ${d.valor.toFixed(2)}`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });


  svg.selectAll(".ponto-fds")
    .data(dadosFds)
    .enter().append("circle")
    .attr("class", "ponto-fds")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#ff7f0e")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Fim de Semana</strong><br>${d.variavel}: ${d.valor.toFixed(2)}`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Desvio Padrão por Variável");

  const legenda = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "#1f77b4");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 5)
    .text("Dias Úteis");

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 25)
    .attr("y2", 25)
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2");

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 25)
    .attr("r", 5)
    .attr("fill", "#ff7f0e");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 30)
    .text("Fim de Semana");
}

function chartAmplitude(container, diasUteis, fimDeSemana) {
  const campos = ["trip_distance", "fare_amount", "tip_amount", "total_amount", "tempo_viagem"];
  const nomes = {
    trip_distance: "Distância (mi)",
    fare_amount: "Valor Corrida (USD)",
    tip_amount: "Gorjeta (USD)",
    total_amount: "Total (USD)",
    tempo_viagem: "Tempo (min)"
  };

  const dadosUteis = campos.map(campo => {
    const valores = diasUteis.map(d => d[campo]);
    return {
      variavel: nomes[campo],
      valor: d3.max(valores) - d3.min(valores)
    };
  });

  const dadosFds = campos.map(campo => {
    const valores = fimDeSemana.map(d => d[campo]);
    return {
      variavel: nomes[campo],
      valor: d3.max(valores) - d3.min(valores)
    };
  });

  const width = 800, height = 500;
  const margin = {top: 60, right: 80, bottom: 70, left: 80};
  
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scalePoint()
    .domain(campos.map(c => nomes[c]))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max([...dadosUteis, ...dadosFds], d => d.valor) * 1.1])
    .range([height - margin.bottom, margin.top])
    .nice();

  const linha = d3.line()
    .x(d => x(d.variavel))
    .y(d => y(d.valor));

  svg.append("path")
    .datum(dadosUteis)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", linha);

  svg.append("path")
    .datum(dadosFds)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2")
    .attr("d", linha);

  svg.selectAll(".ponto-uteis")
    .data(dadosUteis)
    .enter().append("circle")
    .attr("class", "ponto-uteis")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#1f77b4")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Dias Úteis</strong><br>${d.variavel}: ${d.valor.toFixed(2)}`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });


  svg.selectAll(".ponto-fds")
    .data(dadosFds)
    .enter().append("circle")
    .attr("class", "ponto-fds")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#ff7f0e")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Fim de Semana</strong><br>${d.variavel}: ${d.valor.toFixed(2)}`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Amplitude por Variável");

  const legenda = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "#1f77b4");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 5)
    .text("Dias Úteis");

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 25)
    .attr("y2", 25)
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2");

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 25)
    .attr("r", 5)
    .attr("fill", "#ff7f0e");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 30)
    .text("Fim de Semana");
}

function chartCoeficienteVariacao(container, diasUteis, fimDeSemana) {
  const campos = ["trip_distance", "fare_amount", "tip_amount", "total_amount", "tempo_viagem"];
  const nomes = {
    trip_distance: "Distância (mi)",
    fare_amount: "Valor Corrida (USD)",
    tip_amount: "Gorjeta (USD)",
    total_amount: "Total (USD)",
    tempo_viagem: "Tempo (min)"
  };

  const dadosUteis = campos.map(campo => {
    const valores = diasUteis.map(d => d[campo]);
    const media = d3.mean(valores);
    const desvio = d3.deviation(valores);
    return {
      variavel: nomes[campo],
      valor: media !== 0 ? (desvio / media) * 100 : 0
    };
  });

  const dadosFds = campos.map(campo => {
    const valores = fimDeSemana.map(d => d[campo]);
    const media = d3.mean(valores);
    const desvio = d3.deviation(valores);
    return {
      variavel: nomes[campo],
      valor: media !== 0 ? (desvio / media) * 100 : 0
    };
  });

  const width = 800, height = 500;
  const margin = {top: 60, right: 80, bottom: 70, left: 80};
  
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scalePoint()
    .domain(campos.map(c => nomes[c]))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max([...dadosUteis, ...dadosFds], d => d.valor) * 1.1])
    .range([height - margin.bottom, margin.top])
    .nice();

  const linha = d3.line()
    .x(d => x(d.variavel))
    .y(d => y(d.valor));

  svg.append("path")
    .datum(dadosUteis)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", linha);

  svg.append("path")
    .datum(dadosFds)
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2")
    .attr("d", linha);

  svg.selectAll(".ponto-uteis")
    .data(dadosUteis)
    .enter().append("circle")
    .attr("class", "ponto-uteis")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#1f77b4")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Dias Úteis</strong><br>${d.variavel}: ${d.valor.toFixed(2)}%`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });

  svg.selectAll(".ponto-fds")
    .data(dadosFds)
    .enter().append("circle")
    .attr("class", "ponto-fds")
    .attr("cx", d => x(d.variavel))
    .attr("cy", d => y(d.valor))
    .attr("r", 5)
    .attr("fill", "#ff7f0e")
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", 1)
        .html(`<strong>Fim de Semana</strong><br>${d.variavel}: ${d.valor.toFixed(2)}%`);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    });;

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .append("text")
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Coeficiente de Variação (%)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Coeficiente de Variação por Variável");

  const legenda = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2);

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", "#1f77b4");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 5)
    .text("Dias Úteis");

  legenda.append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 25)
    .attr("y2", 25)
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,2");

  legenda.append("circle")
    .attr("cx", 10)
    .attr("cy", 25)
    .attr("r", 5)
    .attr("fill", "#ff7f0e");

  legenda.append("text")
    .attr("x", 30)
    .attr("y", 30)
    .text("Fim de Semana");
}