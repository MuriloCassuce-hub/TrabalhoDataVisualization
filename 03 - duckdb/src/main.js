import { Taxi } from "./taxi";

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

    // Cria o cabeçalho da tabela
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    // Adiciona nova coluna no cabeçalho
    tableHTML += `<th>trip_duration_minutes</th>`;

    tableHTML += '</tr>';

    // Cria o corpo da tabela
    data.forEach(item => {
        tableHTML += '<tr>';

        let pickupTime = null;
        let dropoffTime = null;

        Object.entries(item).forEach(([key, value]) => {
            if ((key === 'lpep_pickup_datetime' || key === 'lpep_dropoff_datetime') && typeof value === 'number') {
                const date = new Date(value);
                const formatted = date.toLocaleString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                if (key === 'lpep_pickup_datetime') pickupTime = date;
                if (key === 'lpep_dropoff_datetime') dropoffTime = date;

                tableHTML += `<td>${formatted}</td>`;
            } else {
                tableHTML += `<td>${value}</td>`;
            }
        });

        // Calcula a duração da corrida
        let duration = '';
        if (pickupTime && dropoffTime) {
            const diffMs = dropoffTime - pickupTime;
            const diffMin = Math.round(diffMs / 60000); // ms -> minutos
            duration = `${diffMin} min`;
        }

        tableHTML += `<td>${duration}</td>`;
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