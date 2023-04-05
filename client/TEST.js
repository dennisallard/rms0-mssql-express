//dga- per https://learn.microsoft.com/en-us/sql/connect/node-js/step-3-proof-of-concept-connecting-to-sql-using-node-js?view=sql-server-ver16

const Connection = require('tedious').Connection;

const config =
{
  server: 'localhost',
  authentication: {
    type: 'default',
    options: { userName: 'SA', password: 'A7dgadga' }
  },
  options: { 
    encrypt: false,
    database: 'TutorialDB'
  }
}

const connection = new Connection(config);

connection.on('connect', function(err) {
    err ? console.log('ERROR ' + err) :  console.log("Connected");
});

connection.connect()

console.log('DONE')

//// jdbc:sqlserver://[serverName[\instanceName][:portNumber]][;property=value[;property=value]]
//// jdbc:sqlserver://localhost;encrypt=true;user=MyUserName;password=*****;
//// jdbc:sqlserver://localhost;encrypt=false;user=SA;password=A7dgadga

//// Driver=jdbc:sqlserver;Server=localhost;encrypt=false;user=SA;password=A7dgadga
