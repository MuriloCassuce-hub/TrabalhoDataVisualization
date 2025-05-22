import { Taxi } from "./taxi";

function calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    
    // Ordena os valores
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    // Se for par, faz a média dos dois do meio
    return sorted.length % 2 === 0 
        ? (sorted[middle - 1] + sorted[middle]) / 2 
        : sorted[middle];
}

function createTableWithInnerHTML(data) {
    let tableHTML = '<table border="1"><tr>';

    // Cabeçalhos
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });

    // Adiciona colunas extras
    tableHTML += `<th>weekday_number</th>`;
    tableHTML += `<th>fim_de_semana</th>`;
    tableHTML += `<th>tempo_viagem (min)</th>`;
    tableHTML += '</tr>';

    // Variáveis para cálculos 
    let stats = {
        totalRows: 0,
        sumPassengerCount: 0,
        sumTripDistance: 0,
        sumFareAmount: 0,
        sumTipAmount: 0,
        weekdayTrips: 0,
        weekendTrips: 0,
        rateCodeCount: {},
        paymentTypeCount: {},
        tripTypeCount: {},
        // Novos arrays para cálculo da mediana
        passengerValues: [],
        distanceValues: [],
        fareValues: [],
        tipValues: []
    };

    data.forEach(item => {
        stats.totalRows++;
        
        let pickup = null;
        let dropoff = null;
        let weekdayNumber = 0;
        let isWeekend = false;

        // Processa datas e calcula dia da semana
        Object.entries(item).forEach(([key, value]) => {
            if (key === 'lpep_pickup_datetime' && typeof value === 'number') {
                pickup = new Date(value);
                const utcDay = pickup.getUTCDay(); // 0-6 (Domingo=0)
                weekdayNumber = utcDay === 0 ? 1 : utcDay + 1; // Domingo=1, Sábado=7
                isWeekend = weekdayNumber === 1 || weekdayNumber === 7;
                
                if (isWeekend) stats.weekendTrips++;
                else stats.weekdayTrips++;
            }
            if (key === 'lpep_dropoff_datetime' && typeof value === 'number') {
                dropoff = new Date(value);
            }
        });

        // Contagem dos itens categóricos
        if (item.passenger_count !== undefined) {
            stats.passengerValues.push(Number(item.passenger_count));
        }
        if (item.trip_distance !== undefined) {
            stats.distanceValues.push(Number(item.trip_distance));
        }
        if (item.fare_amount !== undefined) {
            stats.fareValues.push(Number(item.fare_amount));
        }
        if (item.tip_amount !== undefined) {
            stats.tipValues.push(Number(item.tip_amount));
        }

        // Calcula tempo de viagem
        let tempoViagemMin = pickup && dropoff ? Math.round((dropoff - pickup) / 60000) : null;

        // Atualiza estatísticas
        stats.sumPassengerCount += Number(item.passenger_count) || 0;
        stats.sumTripDistance += Number(item.trip_distance) || 0;
        stats.sumFareAmount += Number(item.fare_amount) || 0;
        stats.sumTipAmount += Number(item.tip_amount) || 0;

        // Linha da tabela
        tableHTML += '<tr>';
        Object.entries(item).forEach(([key, value]) => {
            tableHTML += `<td>${value}</td>`;
        });
        
        // Colunas extras
        tableHTML += `<td>${weekdayNumber}</td>`;
        tableHTML += `<td>${isWeekend ? 'Sim' : 'Não'}</td>`;
        tableHTML += `<td>${tempoViagemMin || ''}</td>`;
        tableHTML += '</tr>';
    });

    // Finaliza tabela
    tableHTML += '</table>';

    // Exibe estatísticas
    const mean = (sum, count) => (count ? (sum / count).toFixed(2) : '0');
    console.log('=== ESTATÍSTICAS ===');
    console.log(`Total de corridas: ${stats.totalRows}`);
    console.log(`Dias úteis: ${stats.weekdayTrips} | Fins de semana: ${stats.weekendTrips}`);
    console.log(`Média passageiros: ${mean(stats.sumPassengerCount, stats.totalRows)} | Mediana: ${calculateMedian(stats.passengerValues).toFixed(2)}`);
    console.log(`Média distância: ${mean(stats.sumTripDistance, stats.totalRows)} milhas | Mediana: ${calculateMedian(stats.distanceValues).toFixed(2)} milhas`);
    console.log(`Média valor corrida: $${mean(stats.sumFareAmount, stats.totalRows)} | Mediana: $${calculateMedian(stats.fareValues).toFixed(2)}`);
    console.log(`Média gorjetas: $${mean(stats.sumTipAmount, stats.totalRows)} | Mediana: $${calculateMedian(stats.tipValues).toFixed(2)}`);
    
    // Novas estatísticas categóricas
    console.log('\n=== CONTAGEM CATEGÓRICA ===');
    console.log('RateCodeID:', stats.rateCodeCount);
    console.log('Payment_type:', stats.paymentTypeCount);
    console.log('Trip_type:', stats.tripTypeCount);

    // Insere tabela no DOM
    const div = document.querySelector("#table");
    if (div) div.innerHTML = tableHTML;
}

window.onload = async () => {
    const taxi = new Taxi();
    await taxi.init();
    await taxi.loadTaxi(6); // Carrega 6 meses
    const data = await taxi.test(50); // Limita a 50 registros
    createTableWithInnerHTML(data);
};