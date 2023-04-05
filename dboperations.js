var config = require('./config')
const sql = require('mssql')
const LIMIT = 10

console.log('DEBUG: config = ' + JSON.stringify(config))

async function getCrimesStream(req, res){
    sql.connect(config, function (err) {
        // ... error checks
        // parse URL arguments
        console.log("req.params = " + JSON.stringify(req.params,null,4));
        console.log("req.query = " + JSON.stringify(req.query,null,4));

        var request = new sql.Request();
        request.stream = true; // You can set streaming differently for each request

        var whereClause = '';
        if (req.query.dr) {
            console.log('req.query.dr = ' + req.query.dr)
            whereClause = 'DR_NO = PARSE(\'' + req.query.dr + '\' AS TIME)'
        } else {
            if (req.query.daterange) {
                console.log('req.query.daterange = ' + req.query.daterange)
                whereClause ? whereClause += ' AND ' : whereClause += ' '
                whereClause += ' Date_Rptd >= \'' + req.query.daterange[0] + '\' AND Date_Rptd <= \'' + req.query.daterange[1] + '\''
            }
            if (req.query.location)  {
                console.log('req.query.location = ' + req.query.location)
                whereClause ? whereClause += ' AND ' : whereClause += ' '
                whereClause += ' LOCATION LIKE \'%' + req.query.location + '%\''
            }
            if (req.query.geo)  {
                console.log('req.query.geo = ' + req.query.geo)
                whereClause ? whereClause += ' AND ' : whereClause += ' '
                var lat = req.query.geo[0]
                var lon = req.query.geo[1]
                var distance = req.query.geo[2]
                console.log('DEBUG: lat = ' + lat + ', lon = ' + lon + ', distance = ' + distance)
                //whereClause += 'AND SQRT(POWER(LAT - '+lat+', 2) + POWER(LON - '+lon+', 2)) < ' + distance
                whereClause += 'ACOS(SIN(LAT)*SIN('+lat+')+COS(LAT)*COS('+lat+')*COS('+lon+'-LON))*6371 < ' + distance
            }
        }
        console.log('DEBUG: whereClause = ' + whereClause)

        var sqlstmt = 'SELECT DR_NO, Date_Rptd, LOCATION, LAT, LON FROM Crime_Data_from_2020_to_Present Crimes ';
        if (whereClause) {
            sqlstmt += 'WHERE ' + whereClause
        }

        console.log('DEBUG: sqlstmt = ' + sqlstmt)
        request.query(sqlstmt)

        var rowCounter = 0;
        const BATCH_SIZE = 100;

        request.on('recordset', function(columns) {
            // Emitted once for each recordset in a query
            // console.log('DEBUG: recordset columns = ' + JSON.stringify(columns,null,4));
            res.setHeader('Content-Type', 'application/json');
            res.write('{ "crimes": [');
            ////res.write('[');
        });

        request.on('row', function(row) {
            // Emitted for each row in a recordset
            if (rowCounter % 250 == 0) {
                //console.log('DEBUG: a row = ' + JSON.stringify(row,null,4));
                console.log('DEBUG: a row = ' + JSON.stringify(row));
            }
            if (rowCounter > 0) {
                res.write(',');
            }
            //// if (rowCounter % BATCH_SIZE == 0) {
            ////     console.log('flushing at rowCounter = ' + rowCounter);
            ////     ////res.flush();
            //// }
            res.write(JSON.stringify(row));
            ++rowCounter;
        });

        request.on('error', function(err) {
            // May be emitted multiple times
            console.log('DEBUG: error = ' + JSON.stringify(err,null,4));
            res.write(JSON.stringify(err));
        });

        request.on('done', function(returnValue) {
            // Always emitted as the last one
            console.log('DEBUG: done returnValue = ' + JSON.stringify(returnValue,null,4));
            res.write('], "count": ' + rowCounter + '} ');
            sql.close();
            res.end();
        });
    })
}

module.exports = {
     getCrimesStream : getCrimesStream,
}
