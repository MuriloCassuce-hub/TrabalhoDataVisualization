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