import { loadChart, clearChart } from './scatter.js';

function main() {
  const loadBtn  = document.querySelector('#loadBtn');
  const clearBtn = document.querySelector('#clearBtn');

  let currentChart = 0;
  const totalCharts = 9;

  async function doLoad() {
    clearChart();
    await loadChart(currentChart);
  }

  loadBtn.addEventListener('click', doLoad);
  clearBtn.addEventListener('click', () => clearChart());


}

window.onload = main;
