import { Taxi } from "./taxi";

// Variável global para armazenar as colunas
let allColumns = {};

// Funções de cálculo estatístico
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
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return mean ? (calculateStdDev(values) / mean) * 100 : 0;
}

function calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
        ? (sorted[middle - 1] + sorted[middle]) / 2 
        : sorted[middle];
}

function calculateStats(values) {
    if (values.length === 0) return { 
        mean: 0, 
        median: 0, 
        variance: 0, 
        stdDev: 0, 
        range: 0, 
        cv: 0 
    };
    
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    
    return {
        mean,
        median,
        variance: calculateVariance(values),
        stdDev: calculateStdDev(values),
        range: calculateRange(values),
        cv: calculateCV(values)
    };
}

function showStatsSection(title, statKey, units = {}) {
    console.log(`\n${title.toUpperCase()} DAS COLUNAS:`);
    for (const [col, data] of Object.entries(allColumns)) {
        const unit = units[col] || '';
        console.log(`${col}: ${data[statKey].toFixed(2)}${unit}`);
    }
}

function createTableWithInnerHTML(data) {
    // Inicializa as colunas
    allColumns = {
        passenger_count: { values: [], sum: 0 },
        trip_distance: { values: [], sum: 0 },
        fare_amount: { values: [], sum: 0 },
        extra: { values: [], sum: 0 },
        mta_tax: { values: [], sum: 0 },
        tip_amount: { values: [], sum: 0 },
        tolls_amount: { values: [], sum: 0 },
        improvement_surcharge: { values: [], sum: 0 },
        total_amount: { values: [], sum: 0 },
        congestion_surcharge: { values: [], sum: 0 },
        tempo_viagem: { values: [] }
    };

    let stats = {
        totalRows: 0,
        weekdayTrips: 0,
        weekendTrips: 0,
        rateCodeCount: {},
        paymentTypeCount: {},
        tripTypeCount: {}
    };

    // Cria cabeçalhos da tabela
    let tableHTML = '<table border="1"><tr>';
    Object.keys(data[0]).forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });
    tableHTML += `<th>weekday_number</th><th>fim_de_semana</th><th>tempo_viagem (min)</th></tr>`;

    // Processa cada registro
    data.forEach(item => {
        stats.totalRows++;
        
        let pickup = null;
        let dropoff = null;
        let weekdayNumber = 0;
        let isWeekend = false;

        // Processa datas
        if (item.lpep_pickup_datetime && typeof item.lpep_pickup_datetime === 'number') {
            pickup = new Date(item.lpep_pickup_datetime);
            const utcDay = pickup.getUTCDay();
            weekdayNumber = utcDay === 0 ? 1 : utcDay + 1;
            isWeekend = weekdayNumber === 1 || weekdayNumber === 7;
            
            if (isWeekend) stats.weekendTrips++;
            else stats.weekdayTrips++;
        }

        if (item.lpep_dropoff_datetime && typeof item.lpep_dropoff_datetime === 'number') {
            dropoff = new Date(item.lpep_dropoff_datetime);
        }

        // Coleta dados numéricos
        Object.keys(allColumns).forEach(col => {
            if (col !== 'tempo_viagem' && item[col] !== undefined) {
                const val = Number(item[col]) || 0;
                allColumns[col].values.push(val);
                allColumns[col].sum += val;
            }
        });

        // Calcula tempo de viagem
        if (pickup && dropoff) {
            const tempoViagemMin = Math.round((dropoff - pickup) / 60000);
            allColumns.tempo_viagem.values.push(tempoViagemMin);
        }

        // Contagem categórica
        if (item.RatecodeID !== undefined) {
            stats.rateCodeCount[item.RatecodeID] = (stats.rateCodeCount[item.RatecodeID] || 0) + 1;
        }
        if (item.payment_type !== undefined) {
            stats.paymentTypeCount[item.payment_type] = (stats.paymentTypeCount[item.payment_type] || 0) + 1;
        }
        if (item.trip_type !== undefined) {
            stats.tripTypeCount[item.trip_type] = (stats.tripTypeCount[item.trip_type] || 0) + 1;
        }

        // Adiciona linha na tabela
        tableHTML += '<tr>';
        Object.entries(item).forEach(([key, value]) => {
            tableHTML += `<td>${value}</td>`;
        });
        tableHTML += `<td>${weekdayNumber}</td><td>${isWeekend ? 'Sim' : 'Não'}</td><td>${pickup && dropoff ? Math.round((dropoff - pickup) / 60000) : ''}</td></tr>`;
    });

    // Finaliza tabela
    tableHTML += '</table>';

    // Calcula estatísticas
    Object.keys(allColumns).forEach(col => {
        Object.assign(allColumns[col], calculateStats(allColumns[col].values));
    });

    // Exibe estatísticas
    const units = {
        trip_distance: ' milhas',
        fare_amount: ' USD',
        tip_amount: ' USD',
        tolls_amount: ' USD',
        total_amount: ' USD',
        tempo_viagem: ' min'
    };

    console.log('=== ESTATÍSTICAS ===');
    console.log(`Total de corridas: ${stats.totalRows}`);
    console.log(`Dias úteis: ${stats.weekdayTrips} | Fins de semana: ${stats.weekendTrips}`);
    showStatsSection('Médias', 'mean', units);
    showStatsSection('Mediana', 'median', units);
    showStatsSection('Variância', 'variance', units);
    showStatsSection('Desvio Padrão', 'stdDev', units);
    showStatsSection('Amplitude', 'range', units);
    showStatsSection('Coeficiente de Variação', 'cv', { ...units, tempo_viagem: '%' });

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
    await taxi.loadTaxi(6);
    const data = await taxi.test(50);
    createTableWithInnerHTML(data);
};