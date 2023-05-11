var config = require('./config')
const sql = require('mssql')

console.log('DEBUG: config = ' + JSON.stringify(config))

function isPositiveInteger(value) {
    return Number.isInteger(value) && Math.sign(value) === 1;
  }
  
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
        try {
            console.log("req.params = " + JSON.stringify(req.params,null,4))
            console.log("req.query = " + JSON.stringify(req.query,null,4))
        
            var rownum = req.query.rownum || 1;      // optional starting row number, default to 1
            var size = req.query.size || null;       // optional number of rows to return
          
            var whereClause = '1=1'  // below we add optional where clauses each starting with ' AND'

            if (! isPositiveInteger(parseInt(rownum))) {
                throw('ERROR: rownum must be a positive integer');
            } 

            if (size) {
                // return size number of rows [ordered by DR_NO for now] starting at rownum
                if (! isPositiveInteger(parseInt(size))) {
                    throw('ERROR: size must be a positive integer');
                }
                console.log('return ' + size + ' rows')
                console.log('starting at row: ' + rownum)              
            } else {
                // if size is not specified, then return all rows
                console.log('return all rows starting at row: ' + rownum)
            }

            if (req.query.dr) {
                console.log('req.query.dr = ' + req.query.dr)
                whereClause += ' AND DR_NO = PARSE(\'' + req.query.dr + '\' AS TIME)'
            } else {
                if (req.query.daterange) {
                    const daterange = req.query.daterange
                    console.log('req.query.daterange = ' + daterange)
                    if (daterange.length !== 2) {
                        console.log('ERROR: there must be 2 daterange args')
                        throw ('ERROR: there must be 2 daterange args')
                    }
                    whereClause += ' AND ( (Date_Rptd >= \'' + daterange[0] + '\' AND Date_Rptd <= \'' + daterange[1] + '\') OR ' +
                                          '(DATE_OCC >= \'' + daterange[0] + '\' AND DATE_OCC <= \'' + daterange[1] + '\') )'
                }
                if (req.query.location) {
                    console.log('req.query.location = ' + req.query.location)
                    whereClause += ' AND (replace(LOCATION,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\'' +
                        ' OR replace(AREA_NAME,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\'' +
                        ' OR replace(CROSS_STREET,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\' )'
                }
                if (req.query.geo) {
                    const geo = req.query.geo
                    console.log('req.query.geo = ' + geo)
                    if (geo.length !== 3) {
                        console.log('ERROR: there must be 3 geo args')
                        throw ('geo args')
                    }
                    var lat = geo[0]
                    var lon = geo[1]
                    var distance = geo[2]
                    console.log('DEBUG: lat = ' + lat + ', lon = ' + lon + ', distance = ' + distance)
                    whereClause += ' AND ACOS(SIN(LAT)*SIN(' + lat + ')+COS(LAT)*COS(' + lat + ')*COS(' + lon + '-LON))*6371 < ' + distance
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
        var sqlstmt = 'SELECT ROW_NUMBER() OVER (ORDER BY DR_NO) row_num,' +
                             'DR_NO, Date_Rptd, DATE_OCC, LOCATION, AREA_NAME, Cross_Street, LAT, LON FROM Crime_Data_from_2020_to_Present Crimes ' +
                      'WHERE ' + whereClause
        sqlstmt = 'SELECT' + (size ? ' TOP ' + size : '') + ' * FROM (' + sqlstmt + ') AS anon1 WHERE row_num >= ' + rownum 
        if (req.query.count !== undefined) {
            // return count of rows in resultset rather than resultset itself
            sqlstmt = 'SELECT COUNT(*) count FROM (' + sqlstmt + ') as anon2'
        } else {
            // return resultset ordered by row_num
            sqlstmt = sqlstmt + ' ORDER BY row_num'
        }

        console.log('DEBUG: sqlstmt = ' + sqlstmt)

        var request = new sql.Request();
        request.stream = true; // You can set streaming differently for each request (we always stream)

        request.query(sqlstmt)
        var rowCounter = 0;

        request.on('recordset', function(columns) {
            // Emitted once for each recordset in a query - for us that means once since we only have one SELECT in our query
            // console.log('DEBUG: recordset columns = ' + JSON.stringify(columns,null,4));
            console.log('DEBUG: number of columns in result set = ' + Object.keys(columns).length);
            res.setHeader('Content-Type', 'application/json');
            if (!size) {
                res.write('{ "crimes": [');
            } else {
                res.write('{ "rownum": ' + rownum + ', "size": ' + size + ', "crimes": [');
            }
        });

        request.on('row', function(row) {
            // Emitted for each row in a recordset
            if (rowCounter % 100000 == 0) {
                //For debugging purposes, output the first row and every 100000th row after that
                console.log('DEBUG: a row = ' + JSON.stringify(row));
            }
            if (rowCounter > 0) {
                res.write(',');
            }
            res.write(JSON.stringify(row));
            ++rowCounter;
        });

        request.on('error', function(err) {
            // May be multiple errors but we will bail after the first one
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
