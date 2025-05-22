import { Taxi } from "./taxi";

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

    // Cria o cabeçalho da tabela
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    tableHTML += '</tr>';

    // Cria o corpo da tabela
    data.forEach(item => {
        tableHTML += '<tr>';
        Object.entries(item).forEach(([key, value]) => {
            if (
                (key === 'lpep_pickup_datetime' || key === 'lpep_dropoff_datetime') &&
                typeof value === 'number'
            ) {
                const date = new Date(value);
                const formatted = date.toISOString(); // <-- CORRETO
                tableHTML += `<td>${formatted}</td>`;
            } else {
                tableHTML += `<td>${value}</td>`;
            }
        });
        tableHTML += '</tr>';
    });

    tableHTML += '</table>';

    const div = document.querySelector("#table");
    if(div) {
        div.innerHTML += tableHTML;
    }
}

window.onload = async () => {
    const months = 6;
    const limit = 50;

    const taxi = new Taxi();

    await taxi.init();
    await taxi.loadTaxi(months);
    const data = await taxi.test(limit);

    createTableWithInnerHTML(data);

    console.log('teste');
};