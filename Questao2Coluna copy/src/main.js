import * as duckdb from '@duckdb/duckdb-wasm';
import * as d3 from 'd3';
import { loadDb } from './config.js';

const files = [
  'green/green_tripdata_2023-01.parquet',
  'green/green_tripdata_2023-02.parquet',
  'green/green_tripdata_2023-03.parquet',
  'green/green_tripdata_2023-04.parquet',
  'green/green_tripdata_2023-05.parquet',
  'green/green_tripdata_2023-06.parquet'
];

async function registerParquetFiles(db) {
  for (const file of files) {
    const response = await fetch(`/${file}`); // "/" = raíz do servidor Vite, que serve a pasta public/
    const buffer = new Uint8Array(await response.arrayBuffer());
    await db.registerFileBuffer(file, buffer);

    // Testar leitura do arquivo
    const conn = await db.connect();
    const result = await conn.query(`SELECT COUNT(*) AS count FROM read_parquet('${file}')`);
    console.log(`Arquivo ${file}: ${result.toArray()[0].toJSON().count} linhas`);
    conn.close();
  }
}

function generateUnionQuery() {
  return files.map(f => `SELECT * FROM read_parquet('${f}')`).join(' UNION ALL ');
}

async function createTaxiTable(conn) {
  await conn.query(`DROP TABLE IF EXISTS taxi_data`);
  const unionQuery = generateUnionQuery();
  await conn.query(`CREATE TABLE taxi_data AS ${unionQuery}`);
}

async function queryAverageTipsByHour(conn) {
  const result = await conn.query(`
    SELECT
      EXTRACT(HOUR FROM lpep_pickup_datetime) AS hour,
      AVG(tip_amount) AS avgTip
    FROM taxi_data
    WHERE tip_amount IS NOT NULL
    GROUP BY hour
    ORDER BY hour
  `);

  return result.toArray().map(row => {
    const obj = row.toJSON();
    return {
      hour: +obj.hour,
      avgTip: +obj.avgTip
    };
  });
}

function drawChart(data) {
  const svg = d3.select("svg");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  svg.selectAll("*").remove();

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(d3.range(24)) // Garante 0 a 23
    .range([0, innerWidth])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.avgTip) || 1])
    .nice()
    .range([innerHeight, 0]);

  // Eixos
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));

  g.append("g").call(d3.axisLeft(y));

  // Barras
  g.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.hour))
    .attr("y", d => y(d.avgTip))
    .attr("width", x.bandwidth())
    .attr("height", d => innerHeight - y(d.avgTip))
    .attr("fill", "steelblue")
    .append("title")
    .text(d => `Hora: ${d.hour}:00\nMédia: $${d.avgTip.toFixed(2)}`);

  // Labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .text("Horário da Corrida (Horas)");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Valor Médio das Gorjetas (USD)");
}

async function main() {
  try {
    const db = await loadDb();
    const conn = await db.connect();

    await registerParquetFiles(db);
    await createTaxiTable(conn);

    const data = await queryAverageTipsByHour(conn);
    drawChart(data);
  } catch (err) {
    console.error("Erro ao processar dados:", err);
  }
}

main();

