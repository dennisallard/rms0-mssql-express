import sql from 'mssql';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

const dbConfigCrimes = {
  user: process.env.DB_CRIMES_USER,
  password: process.env.DB_CRIMES_PASSWORD,
  server: process.env.DB_CRIMES_SERVER,
  database: process.env.DB_CRIMES_NAME,
  options: {
    /////encrypt: true, // For Azure SQL Server
    encrypt: false, // for my local SQL Server containerized database
    trustServerCertificate: true, // For self-signed certificates
  },
};
console.log('DEBUG: dbConfigCrimes = ' + JSON.stringify(dbConfigCrimes))

const dbConfigCCAD = {
  user: process.env.DB_CCAD_USER,
  password: process.env.DB_CCAD_PASSWORD,
  server: process.env.DB_CCAD_SERVER,
  database: process.env.DB_CCAD_NAME,
  options: {
    encrypt: true, // For Azure SQL Server
    trustServerCertificate: true, // For self-signed certificates
  },
};

console.log('DEBUG: dbConfigCCAD = ' + JSON.stringify(dbConfigCCAD))

const poolPromiseCrimes = new sql.ConnectionPool(dbConfigCrimes)
  .connect()
  .then((pool) => {
    console.log('Connected to DBcrimes');
    return pool;
  })
  .catch((error) => {
    console.error('Error connecting to DBcrimes:', error);
    process.exit(1);
  });

const poolPromiseCCAD = new sql.ConnectionPool(dbConfigCCAD)
  .connect()
  .then((pool) => {
    console.log('Connected to DBccad');
    return pool;
  })
  .catch((error) => {
    console.error('Error connecting to DBccad:', error);
    process.exit(1);
  });

export { sql, poolPromiseCrimes, poolPromiseCCAD };

