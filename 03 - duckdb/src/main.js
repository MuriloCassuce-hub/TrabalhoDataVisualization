import { Taxi } from "./taxi";

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

    // Cria o cabeçalho da tabela
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    let totalRows = 0;
    let sumPassengerCount = 0;
    let sumTripDistance = 0;
    let sumFareAmount = 0;
    let sumExtra = 0;
    let sumMtaTax = 0;
    let sumTipAmount = 0;
    let sumTollsAmount = 0;
    let sumTotalAmount = 0;
    let sumCongestionSurcharge = 0;
    let sumTempoViagem = 0;

    // Colunas extras
    tableHTML += `<th>tempo_viagem (min)</th>`;
    tableHTML += `<th>fim_de_semana</th>`;
    tableHTML += '</tr>';

    data.forEach(item => {
        let pickup = null;
        let dropoff = null;
        let fimDeSemana = '';

        Object.entries(item).forEach(([key, value]) => {
            if (key === 'lpep_pickup_datetime' && typeof value === 'number') {
                pickup = new Date(value);
            }
            if (key === 'lpep_dropoff_datetime' && typeof value === 'number') {
                dropoff = new Date(value);
            }
        });

        // Calcular tempo_viagem se possível
        let tempoViagemMin = null;
        if (pickup && dropoff) {
            tempoViagemMin = Math.round((dropoff - pickup) / 60000);
        }

        // Soma os campos se todos forem válidos
        totalRows++;
        sumPassengerCount += Number(item.passenger_count) || 0;
        sumTripDistance += Number(item.trip_distance) || 0;
        sumFareAmount += Number(item.fare_amount) || 0;
        sumExtra += Number(item.extra) || 0;
        sumMtaTax += Number(item.mta_tax) || 0;
        sumTipAmount += Number(item.tip_amount) || 0;
        sumTollsAmount += Number(item.tolls_amount) || 0;
        sumTotalAmount += Number(item.total_amount) || 0;
        sumCongestionSurcharge += Number(item.congestion_surcharge) || 0;
        sumTempoViagem += tempoViagemMin || 0;

        // Adiciona os dados na tabela HTML
        tableHTML += '<tr>';

        // Adiciona as colunas da tabela com os valores de cada item
        Object.entries(item).forEach(([key, value]) => {
            tableHTML += `<td>${value}</td>`;
        });

        // Adiciona a coluna de tempo de viagem e fim de semana
        tableHTML += `<td>${tempoViagemMin || ''}</td>`;
        tableHTML += `<td>${fimDeSemana}</td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</table>';

    // Exibe as médias no console
    const mean = (sum, count) => (count ? (sum / count).toFixed(2) : '0');

    console.log('MÉDIAS DAS COLUNAS:');
    console.log(`passenger_count: ${mean(sumPassengerCount, totalRows)}`);
    console.log(`trip_distance: ${mean(sumTripDistance, totalRows)}`);
    console.log(`fare_amount: ${mean(sumFareAmount, totalRows)}`);
    console.log(`extra: ${mean(sumExtra, totalRows)}`);
    console.log(`mta_tax: ${mean(sumMtaTax, totalRows)}`);
    console.log(`tip_amount: ${mean(sumTipAmount, totalRows)}`);
    console.log(`tolls_amount: ${mean(sumTollsAmount, totalRows)}`);
    console.log(`total_amount: ${mean(sumTotalAmount, totalRows)}`);
    console.log(`congestion_surcharge: ${mean(sumCongestionSurcharge, totalRows)}`);
    console.log(`tempo_viagem (min): ${mean(sumTempoViagem, totalRows)}`);

    // Exibe a tabela no DOM
    const div = document.querySelector("#table");
    if (div) {
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

};
