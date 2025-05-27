import { loadChart, clearChart } from './scatter.js';

function main() {
  const loadBtn  = document.querySelector('#loadBtn');
  const clearBtn = document.querySelector('#clearBtn');
  const nextBtn  = document.querySelector('#nextBtn');

  let currentChart = 0;
  const totalCharts = 5;

  async function doLoad() {
    clearChart();
    await loadChart(currentChart);
  }

  loadBtn.addEventListener('click', doLoad);
  clearBtn.addEventListener('click', () => clearChart());
  nextBtn.addEventListener('click', async () => {
    currentChart = (currentChart + 1) % totalCharts;
    await doLoad();
  });
}

window.onload = main;
