import { Taxi } from "./taxi";

function calculateVariance(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function calculateStdDev(values) {
    return Math.sqrt(calculateVariance(values));
}

function calculateRange(values) {
    return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function calculateCV(values) {
    return values.length ? (calculateStdDev(values) / (values.reduce((a, b) => a + b, 0) / values.length)) * 100 : 0;
}

function calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

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

        passengerValues: [],
        distanceValues: [],
        fareValues: [],
        tipValues: [],

        variancePassenger: 0,
        varianceDistance: 0,
        varianceFare: 0,
        varianceTip: 0,

        passengerStdDev: 0,
        passengerRange: 0,
        passengerCV: 0,
        
        distanceStdDev: 0,
        distanceRange: 0,
        distanceCV: 0,
        
        fareStdDev: 0,
        fareRange: 0,
        fareCV: 0,
        
        tipStdDev: 0,
        tipRange: 0,
        tipCV: 0
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
                const utcDay = pickup.getUTCDay();
                weekdayNumber = utcDay === 0 ? 1 : utcDay + 1;
                isWeekend = weekdayNumber === 1 || weekdayNumber === 7;
                
                if (isWeekend) stats.weekendTrips++;
                else stats.weekdayTrips++;
            }
            if (key === 'lpep_dropoff_datetime' && typeof value === 'number') {
                dropoff = new Date(value);
            }
        });

        // Contagem dos itens categóricos (CORRIGIDO)
        if (item.RatecodeID !== undefined) {
            stats.rateCodeCount[item.RatecodeID] = (stats.rateCodeCount[item.RatecodeID] || 0) + 1;
        }
        if (item.payment_type !== undefined) {
            stats.paymentTypeCount[item.payment_type] = (stats.paymentTypeCount[item.payment_type] || 0) + 1;
        }
        if (item.trip_type !== undefined) {
            stats.tripTypeCount[item.trip_type] = (stats.tripTypeCount[item.trip_type] || 0) + 1;
        }

        // Valores para medianas
        if (item.passenger_count !== undefined) {
            const val = Number(item.passenger_count) || 0;
            stats.passengerValues.push(val);
            stats.sumPassengerCount += val;
        }
        if (item.trip_distance !== undefined) {
            const val = Number(item.trip_distance) || 0;
            stats.distanceValues.push(val);
            stats.sumTripDistance += val;
        }
        if (item.fare_amount !== undefined) {
            const val = Number(item.fare_amount) || 0;
            stats.fareValues.push(val);
            stats.sumFareAmount += val;
        }
        if (item.tip_amount !== undefined) {
            const val = Number(item.tip_amount) || 0;
            stats.tipValues.push(val);
            stats.sumTipAmount += val;
        }

        // Calcula tempo de viagem
        let tempoViagemMin = pickup && dropoff ? Math.round((dropoff - pickup) / 60000) : null;

        // Linha da tabela
        tableHTML += '<tr>';
        Object.entries(item).forEach(([key, value]) => {
            tableHTML += `<td>${value}</td>`;
        });
        
        tableHTML += `<td>${weekdayNumber}</td>`;
        tableHTML += `<td>${isWeekend ? 'Sim' : 'Não'}</td>`;
        tableHTML += `<td>${tempoViagemMin || ''}</td>`;
        tableHTML += '</tr>';
    });

    // Finaliza tabela
    tableHTML += '</table>';

    // Cálculo das medidas de dispersão
    stats.passengerStdDev = calculateStdDev(stats.passengerValues);
    stats.passengerRange = calculateRange(stats.passengerValues);
    stats.passengerCV = calculateCV(stats.passengerValues);

    stats.distanceStdDev = calculateStdDev(stats.distanceValues);
    stats.distanceRange = calculateRange(stats.distanceValues);
    stats.distanceCV = calculateCV(stats.distanceValues);

    stats.fareStdDev = calculateStdDev(stats.fareValues);
    stats.fareRange = calculateRange(stats.fareValues);
    stats.fareCV = calculateCV(stats.fareValues);

    stats.tipStdDev = calculateStdDev(stats.tipValues);
    stats.tipRange = calculateRange(stats.tipValues);
    stats.tipCV = calculateCV(stats.tipValues);

    stats.variancePassenger = calculateVariance(stats.passengerValues);
    stats.varianceDistance = calculateVariance(stats.distanceValues);
    stats.varianceFare = calculateVariance(stats.fareValues);
    stats.varianceTip = calculateVariance(stats.tipValues);

    // Exibe estatísticas
    const mean = (sum, count) => count ? (sum / count) : 0;
    console.log('=== ESTATISTICA ===');

    // Função auxiliar para formatar números
    const fmt = num => typeof num === 'number' ? num.toFixed(2) : 'N/A';

    // Estatísticas para Passageiros
    console.log(`Total de corridas: ${stats.totalRows}`);
    console.log(`Dias úteis: ${stats.weekdayTrips} | Fins de semana: ${stats.weekendTrips}`);
    console.log('Passageiros:');
    console.log(`  Media: ${fmt(mean(stats.sumPassengerCount, stats.totalRows))}`);
    console.log(`  Mediana: ${fmt(calculateMedian(stats.passengerValues))}`);
    console.log(`  Variancia: ${fmt(stats.variancePassenger)}`);
    console.log(`  Desvio Padrão: ${fmt(stats.passengerStdDev)}`);
    console.log(`  Amplitude: ${fmt(stats.passengerRange)}`);
    console.log(`  Coef. Variação: ${fmt(stats.passengerCV)}%`);

    // Estatísticas para Distância
    console.log('\nDistância:');
    console.log(`  Media: ${fmt(mean(stats.sumTripDistance, stats.totalRows))} milhas`);
    console.log(`  Mediana: ${fmt(calculateMedian(stats.distanceValues))} milhas`);
    console.log(`  Variancia: ${fmt(stats.varianceDistance)}`);
    console.log(`  Desvio Padrão: ${fmt(stats.distanceStdDev)} milhas`);
    console.log(`  Amplitude: ${fmt(stats.distanceRange)} milhas`);
    console.log(`  Coef. Variação: ${fmt(stats.distanceCV)}%`);

    // Estatísticas para Valor da Corrida
    console.log('\nValor da Corrida:');
    console.log(`  Media: $${fmt(mean(stats.sumFareAmount, stats.totalRows))}`);
    console.log(`  Mediana: $${fmt(calculateMedian(stats.fareValues))}`);
    console.log(`  Variancia: $${fmt(stats.varianceFare)}`);
    console.log(`  Desvio Padrão: $${fmt(stats.fareStdDev)}`);
    console.log(`  Amplitude: $${fmt(stats.fareRange)}`);
    console.log(`  Coef. Variação: ${fmt(stats.fareCV)}%`);

    // Estatísticas para Gorjetas
    console.log('\nGorjetas:');
    console.log(`  Media: $${fmt(mean(stats.sumTipAmount, stats.totalRows))}`);
    console.log(`  Mediana: $${fmt(calculateMedian(stats.tipValues))}`);
    console.log(`  Variancia: $${fmt(stats.varianceTip)}`);
    console.log(`  Desvio Padrão: $${fmt(stats.tipStdDev)}`);
    console.log(`  Amplitude: $${fmt(stats.tipRange)}`);
    console.log(`  Coef. Variação: ${fmt(stats.tipCV)}%`);
    
    // Estatísticas categóricas
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