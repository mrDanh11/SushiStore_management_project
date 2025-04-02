const mssql = require('mssql');
const config = {
    server: "localhost",
    user: "sa",
    password: "123",
    database: "database_sushi_final",
    // database: "SushiStore_management",
    driver: "mssql",
    options:{
        encrypt: false,
        enableArithAbort: false,
    }
};

const poolPromise = new mssql.ConnectionPool(config).connect()

module.exports = {
    config,
    poolPromise,
};