import { loadDb } from './config';

export class Taxi {
    async init() {
        this.db = await loadDb();
        this.conn = await this.db.connect();
        this.color = "green";
        this.table = 'taxi_2023';
    }

    async loadTaxi(months = 6) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        const files = [];
        for (let id = 1; id <= months; id++) {
            const sId = String(id).padStart(2, '0');
            files.push({ 
                key: `Y2023M${sId}`, 
                url: `${this.color}/${this.color}_tripdata_2023-${sId}.parquet` 
            });

            const res = await fetch(files[files.length - 1].url);
            await this.db.registerFileBuffer(
                files[files.length - 1].key, 
                new Uint8Array(await res.arrayBuffer())
            );
        }

        await this.conn.query(`
            CREATE TABLE ${this.table} AS
            SELECT * FROM read_parquet([${files.map(d => d.key).join(",")}]);
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        let result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }

    // Query básica para teste (amostra)
    async test(limit = 10) {
        const sql = `SELECT 
            VendorID,
            lpep_pickup_datetime,
            lpep_dropoff_datetime,
            store_and_fwd_flag,
            RatecodeID,
            PULocationID,
            DOLocationID,
            passenger_count,
            trip_distance,
            fare_amount,
            extra,
            mta_tax,
            tip_amount,
            tolls_amount,
            ehail_fee,
            improvement_surcharge,
            total_amount,
            payment_type,
            trip_type,
            congestion_surcharge
            FROM ${this.table} LIMIT ${limit}`;
        return await this.query(sql);
    }

    // Nova função: Análise completa por dia da semana
    async getWeekdayAnalysis() {
        const sql = `
            SELECT 
                DAYOFWEEK(lpep_pickup_datetime) AS weekday_num,
                COUNT(*) AS total_trips,
                AVG(trip_distance) AS avg_distance,
                AVG(fare_amount) AS avg_fare,
                AVG(passenger_count) AS avg_passengers,
                AVG(total_amount) AS avg_total,
                AVG(EXTRACT(EPOCH FROM (lpep_dropoff_datetime - lpep_pickup_datetime))/60) AS avg_duration_min
            FROM ${this.table}
            GROUP BY weekday_num
            ORDER BY weekday_num
        `;
        return await this.query(sql);
    }

    // Nova função: Comparativo dias úteis vs fins de semana
    async getWeekdayVsWeekend() {
        const sql = `
            SELECT 
                CASE 
                    WHEN DAYOFWEEK(lpep_pickup_datetime) IN (1, 7) THEN 'weekend'
                    ELSE 'weekday'
                END AS day_type,
                COUNT(*) AS total_trips,
                AVG(trip_distance) AS avg_distance,
                AVG(fare_amount) AS avg_fare,
                AVG(total_amount) AS avg_total
            FROM ${this.table}
            GROUP BY day_type
        `;
        return await this.query(sql);
    }

    // Nova função: Análise temporal (horários de pico)
    async getTimeAnalysis() {
        const sql = `
            SELECT 
                EXTRACT(HOUR FROM lpep_pickup_datetime) AS hour_of_day,
                COUNT(*) AS total_trips,
                AVG(fare_amount) AS avg_fare
            FROM ${this.table}
            GROUP BY hour_of_day
            ORDER BY hour_of_day
        `;
        return await this.query(sql);
    }

    async getTipVsHourScatterData() {
    const sql = `
        SELECT 
            EXTRACT(HOUR FROM lpep_pickup_datetime) AS hour,
            tip_amount
        FROM ${this.table}
        WHERE tip_amount IS NOT NULL
    `;
    return await this.query(sql);
    }
}