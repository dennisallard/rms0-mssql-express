var config = require('./config')
const sql = require('mssql')
const LIMIT = 10

console.log('DEBUG: config = ' + JSON.stringify(config))

async function getCrimesStream(req, res){
    console.log('DEBUG: getCrimesStream()')

    sql.connect(config, function(err) {
        if (err) {
            console.log(err)
            res.write('{ "error" : "' + err.toString() + '" }')
            sql.close()
            res.end()
            return
        }

        // parse URL arguments and build where clause
        console.log("req.params = " + JSON.stringify(req.params,null,4))
        console.log("req.query = " + JSON.stringify(req.query,null,4))

        try {
            var whereClause = '';
            if (req.query.dr) {
                console.log('req.query.dr = ' + req.query.dr)
                whereClause = 'DR_NO = PARSE(\'' + req.query.dr + '\' AS TIME)'
            } else {
                if (req.query.daterange) {
                    const daterange = req.query.daterange
                    console.log('req.query.daterange = ' + daterange)
                    if (daterange.length !== 2) {
                        console.log('ERROR: daterange must be an array of length 2')
                        throw ('ERROR: daterange must be an array of length 2')
                    }
                    whereClause ? whereClause += ' AND ' : whereClause += ' '
                    //whereClause += ' Date_Rptd >= \'' + req.query.daterange[0] + '\' AND Date_Rptd <= \'' + req.query.daterange[1] + '\''
                    whereClause += ' ( (Date_Rptd >= \'' + daterange[0] + '\' AND Date_Rptd <= \'' + daterange[1] + '\')' +
                        ' OR (Date_Rptd >= \'' + daterange[0] + '\' AND Date_Rptd <= \'' + daterange[1] + '\') )'
                }
                if (req.query.location) {
                    console.log('req.query.location = ' + req.query.location)
                    whereClause ? whereClause += ' AND ' : whereClause += ' '
                    whereClause += ' (LOCATION LIKE \'%' + req.query.location + '%\'' +
                        ' OR AREA_NAME LIKE \'%' + req.query.location + '%\'' +
                        ' OR CROSS_STREET LIKE \'%' + req.query.location + '%\' )'
                }
                if (req.query.geo) {
                    const geo = req.query.geo
                    console.log('req.query.geo = ' + geo)
                    if (geo.length !== 3) {
                        console.log('ERROR: geo must be an array of length 3')
                        throw ('ERROR: geo must be an array of length 3')
                    }
                    whereClause ? whereClause += ' AND ' : whereClause += ' '
                    var lat = geo[0]
                    var lon = geo[1]
                    var distance = geo[2]
                    console.log('DEBUG: lat = ' + lat + ', lon = ' + lon + ', distance = ' + distance)
                    //whereClause += 'AND SQRT(POWER(LAT - '+lat+', 2) + POWER(LON - '+lon+', 2)) < ' + distance
                    whereClause += 'ACOS(SIN(LAT)*SIN(' + lat + ')+COS(LAT)*COS(' + lat + ')*COS(' + lon + '-LON))*6371 < ' + distance
                }
            }
            console.log('DEBUG: whereClause = ' + whereClause)
            ////throw('ERROR: test error')
        }
        catch (err) {
            console.log(err)
            res.write('{ "error" : "' + err + '" }')
            sql.close();
            res.end();
            return;
        }

        // build SQL statement and evaluate it
        var sqlstmt = 'SELECT DR_NO, Date_Rptd, DATE_OCC, LOCATION, AREA_NAME, Cross_Street, LAT, LON FROM Crime_Data_from_2020_to_Present Crimes ';
        if (whereClause) {
            sqlstmt += 'WHERE ' + whereClause
        }
        console.log('DEBUG: sqlstmt = ' + sqlstmt)

        var request = new sql.Request();
        request.stream = true; // You can set streaming differently for each request

        request.query(sqlstmt)
        var rowCounter = 0;

        request.on('recordset', function(columns) {
            // Emitted once for each recordset in a query
            // console.log('DEBUG: recordset columns = ' + JSON.stringify(columns,null,4));
            res.setHeader('Content-Type', 'application/json');
            res.write('{ "crimes": [');
        });

        request.on('row', function(row) {
            // Emitted for each row in a recordset
            if (rowCounter % 100000 == 0) {
                //console.log('DEBUG: a row = ' + JSON.stringify(row,null,4));
                console.log('DEBUG: a row = ' + JSON.stringify(row));
            }
            if (rowCounter > 0) {
                res.write(',');
            }
            res.write(JSON.stringify(row));
            ++rowCounter;
        });

        request.on('error', function(err) {
            // May be emitted multiple times
            console.log('DEBUG: error = ' + JSON.stringify(err, null, 4));
            res.write('{ "error" : "' + err.toString() + '" }')
            sql.close();
            res.end();
            return;
        });

        request.on('done', function(returnValue) {
            // Always emitted as the last one
            console.log('DEBUG: done returnValue = ' + JSON.stringify(returnValue, null, 4));
            res.write('], "count": ' + rowCounter + '} ');
            sql.close();
            res.end();
        });
    })
}

module.exports = {
     getCrimesStream : getCrimesStream,
}
