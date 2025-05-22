
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
            const sId = String(id).padStart(2, '0')
            files.push({ key: `Y2023M${sId}`, url: `${this.color}/${this.color}_tripdata_2023-${sId}.parquet` });

            const res = await fetch(files[files.length - 1].url);
            await this.db.registerFileBuffer(files[files.length - 1].key, new Uint8Array(await res.arrayBuffer()));
        }

        await this.conn.query(`
            CREATE TABLE ${this.table} AS
                SELECT * 
                FROM read_parquet([${files.map(d => d.key).join(",")}]);
        `);
    }

    async query(sql) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        let result = await this.conn.query(sql);
        return result.toArray().map(row => row.toJSON());
    }

    async test(limit = 10) {
        if (!this.db || !this.conn)
            throw new Error('Database not initialized. Please call init() first.');

        // 1,2,3,4,5 = DIAS DE SEMANA
        // 0 e 6 = Fim de semana
        const sql = `
        SELECT *
        FROM ${this.table}
        WHERE STRFTIME(lpep_pickup_datetime, '%w') NOT IN ('1', '2', '3', '4', '5')
        LIMIT ${limit}
    `;

        return await this.query(sql);
    }
}