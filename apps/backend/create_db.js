const { Client } = require('pg');

async function createDb() {
    const client = new Client({
        connectionString: 'postgresql://deepaksharma@localhost:5432/postgres'
    });
    try {
        await client.connect();
        await client.query('CREATE DATABASE hulhas_auto;');
        console.log('Database created');
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}

createDb();
