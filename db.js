import sql from 'mssql';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

/* Datasource configs

See: https://github.com/pmarx/PublicSafetyResources/tree/main/data_services

CCAD:      the legacy records system
RMS:       the new Motorola PremiereOne RMS system
CAD:       the Motorola PremiereOne CAD report data warehouse
UDT:       legacy CAD database
FI:        the field interviews database
ALPR:      the automatic license plate recognition service(s)
AFDR:      the AFDR database
CITATION:  the motor vehicle citations database
APIMS:     the Automated Property Information Management System

There are a wide variety of underlying databases and services,
including the ones listed below. This system relies upon leaving the
data in place. All of these are Microsoft SQL Server, though that may
change in the future.

Data Source Name   Server Address          Database(if any)  user/password   Table(s)
crimes container   localhost               RMS0              sa/RMS0foobar   Crime_Data_from_2020_to_Present
AFDR               pdw-db1.lapd.online     narcs             readonly        vwAFDRData, vwAFDRT2{Ppl,Stats,Stop}
FI                 pdw-db1.lapd.online     narcs             readonly        vwFIData
CITATIONS          10.200.40.43            TICS              
UDT                10.245.194.53           
CAD                10.240.40.20            ReportingDW                       many
CCAD               rms-sql-d1.lapd.online  ccad              ccad_reader/"   many
APIMS [dga ???]    rms-sql-d1.lapd.online  apims             apims_reader/"  many

*/

////////////////////////////////////////////////////////////////////////////////
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

const poolPromiseCrimes = new sql.ConnectionPool(dbConfigCrimes)
  .connect()
  .then((pool) => {
    console.log('Connected to DBcrimes');
    return pool;
  })
  .catch((error) => {
    console.error('Error connecting to DBcrimes:', error);
    console.error('Will ignore DBcrimes database and continue...');
    //// process.exit(1);
  });


////////////////////////////////////////////////////////////////////////////////
/****  CCAD Route NOT YET IMPLMENTED
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
****/

////////////////////////////////////////////////////////////////////////////////
const dbConfigAFDR = {
  user: process.env.DB_AFDR_USER,
  password: process.env.DB_AFDR_PASSWORD,
  server: process.env.DB_AFDR_SERVER,
  database: process.env.DB_AFDR_NAME,
  options: {
    encrypt: false, ////true, // For Azure SQL Server
    trustServerCertificate: true, // For self-signed certificates
  },
};
console.log('DEBUG: dbConfigAFDR = ' + JSON.stringify(dbConfigAFDR))

const poolPromiseAFDR = new sql.ConnectionPool(dbConfigAFDR)
  .connect()
  .then((pool) => {
    console.log('Connected to DBafdr');
    return pool;
  })
  .catch((error) => {
    console.error('Error connecting to DBafdr:', error);
    process.exit(1);
  });


////////////////////////////////////////////////////////////////////////////////
export { sql, poolPromiseCrimes, /* poolPromiseCCAD,*/ poolPromiseAFDR };

