import express from 'express';
import { poolPromiseAFDR } from '../db.js';
import {isPositiveInteger,
        parseArrayOfNumbers,
        // parseArrayofDateStrings,
        isQuotedString,
        parseDateString,
        translateAddressToLatLon
        } from '../utilities.js'

const router = express.Router();

async function afdrGet(req, res) {
    // parse URL arguments and build where clause
    try {
        console.log("req.params = " + JSON.stringify(req.params, null, 4))
        console.log("req.query = " + JSON.stringify(req.query, null, 4))

        // check for invalid parameters
        const validParams =
            [/*'drnum',*/ /*'query',*/ 'count', /*'upsert',*/ 'format',
             'location', 'centroiddistance',
             'starttime', 'endtime',
             'rownum', 'numrows']
        // verify that every parameter in req.query is in validParams
        const invalidParams = Object.keys(req.query).filter(key => !validParams.includes(key))
        if (invalidParams.length > 0) {
            console.log('ERROR: invalid parameters: ' + invalidParams)
            throw ('ERROR: invalid parameters: ' + invalidParams)
        }

        // intern count
        var count = false // default to false
        if ('count' in req.query) {
            if (req.query['count'] !== '') {
                throw ('ERROR: count must be just a flag parameter without a value (' +
                       req.query['count'] + ')' )
            }
            count = true
        } 

        // rownum and numrows
        var rownum = req.query.rownum || 1;       // optional starting row number, default to 1
        var numrows = req.query.numrows || null;  // optional number of rows to return

        var whereClause = '1=1'  // below we add optional where clauses each starting with ' AND'

        if (!isPositiveInteger(parseInt(rownum))) {
            throw ('ERROR: rownum must be a positive integer');
        }

        if (numrows) {
            // return numrows number of rows [ordered by DR_NO for now] starting at rownum
            if (!isPositiveInteger(parseInt(numrows))) {
                throw ('ERROR: numrows must be a positive integer');
            }
            console.log('return ' + numrows + ' rows')
            console.log('starting at row: ' + rownum)
        } else {
            // if numrows is not specified, then return all rows
            console.log('return all rows starting at row: ' + rownum)
        }

        if (req.query.drnum) {
            //// this then block will never be reached, currently
            // if drnum is specified, ignore all other parameters
            console.log('req.query.drnum = ' + req.query.drnum)
            if (!isPositiveInteger(parseInt(req.query.drnum))) {
                throw ('ERROR: drnum must be a positive integer');
            }
            whereClause += ' AND DRNum = ' + req.query.drnum
        } else {

            // starttime and endtime
            if (req.query.starttime) {
                const starttimeparm = req.query.starttime
                console.log('req.query.starttime = ' + starttimeparm)
                var starttime = parseDateString(starttimeparm)
                if (!starttime) {
                    console.log('ERROR: starttime not an ISO 8601 date string')
                    throw ('ERROR: starttime not an ISO 8601 date string')
                }
                whereClause += ' AND CONVERT(datetime, CONCAT(StopDate, \' \', StopTime)) >= ' +
                                    'CONVERT(datetime, \'' + starttime + '\')'
            }
            if (req.query.endtime) {
                const endtimeparm = req.query.endtime
                console.log('req.query.endtime = ' + endtimeparm)
                var endtime = parseDateString(endtimeparm)
                if (!endtime) {
                    console.log('ERROR: endtime not an ISO 8601 date string')
                    throw ('ERROR: endtime not an ISO 8601 date string')
                }
                whereClause += ' AND CONVERT(datetime, CONCAT(StopDate, \' \', StopTime)) <= ' +
                                    'CONVERT(datetime, \'' + endtime + '\')'
            }

            // location and centroiddistance
            if (req.query.location) {
                console.log('req.query.location = ' + req.query.location)

                /*
                whereClause += ' AND (replace(LOCATION,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\'' +
                    ' OR replace(AREA_NAME,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\'' +
                    ' OR replace(CROSS_STREET,\' \',\'\') LIKE \'%' + req.query.location.replace(/\s+/g, '') + '%\' )'
                */

                // location is either a quoted address string or a (lat,lon) string (or in the future a what_three_words string)
                if (isQuotedString(req.query.location)) {
                    //location is a quoted address string so convert to LAT,LON
                    const address = req.query.location.slice(1, -1)  // remove quotes
                    var {lat, lon} = await translateAddressToLatLon(address)

                } else {
                    //location is a (lat,lon) string
                    const geo = parseArrayOfNumbers(req.query.location)
                    if (!geo || geo.length !== 2) {
                        console.log('ERROR: location is not an address string nor of form (lat,lon)')
                        throw ('location is not an address string nor of form (lat,lon)')
                    }
                    console.log('DEBUG13: THIS SHOULD NOT HAPPEN')
                    lat = geo[0]
                    lon = geo[1]
                    if (lon >= 0) {
                        console.log('ERROR: longitude must be a negative number')
                        throw ('ERROR: longitude must be a negative number')
                    }
                }

                // centroiddistance
                var distance
                if (req.query.centroiddistance) {
                    distance = parseFloat(req.query.centroiddistance)
                    if (isNaN(distance) || typeof(distance) !== 'number' || distance < 0) {
                        throw ('ERROR: centroiddistance must be a number >= 0')
                    }
                } else {
                    distance = 0.1 //KM
                }

                console.log('DEBUG: lat = ' + lat + ', lon = ' + lon + ', centroid_distance = ' + distance)
                whereClause += ' AND ACOS(SIN(Latitude)*SIN(' + lat + ')+COS(Latitude)*COS(' + lat + ')*COS(' + lon + '-Longitude))*6371 < ' + distance
           
            }
        }
        console.log('DEBUG: whereClause = ' + whereClause)
        ////throw('ERROR: test error')
    }
    catch (err) {
        console.error(err)
        res.write('{ "error" : "' + err + '" }')
        res.end();
        return;
    }

    // build SQL statement
    try {
        var sqlstmt =
            'SELECT ROW_NUMBER() OVER (ORDER BY stop.idx) row_num, stop.* ' +
            'FROM vwAFDRT2Stop stop INNER JOIN vwAFDRT2Ppl ppl ON ppl.idx = stop.idx ' +
            'WHERE ' + whereClause
        sqlstmt = 'SELECT' + (numrows ? ' TOP ' + numrows : '') + ' * FROM (' + sqlstmt + ') AS anon1 WHERE row_num >= ' + rownum
        if (count) {
            // return count of rows in resultset rather than resultset itself
            sqlstmt = 'SELECT COUNT(*) count FROM (' + sqlstmt + ') as anon2'
        } else {
            // return resultset ordered by row_num
            sqlstmt = sqlstmt + ' ORDER BY row_num'
        }
        ///// http://localhost:3002/api/afdr/?location=210 SpringStreet,Los Angeles,CA&centroiddistance=5
        console.log('DEBUG: sqlstmt = ' + sqlstmt)
    } catch (err) {
        console.log(err)
        res.write('{ "error" : "' + err + '" }')
        res.end();
        return;
    }

    // execute SQL statement and stream results back to client
    try {
        const pool = await poolPromiseAFDR;
        const request = pool.request();
        //dga- is the following no longer needed?
        request.stream = true; // You can set streaming differently for each request (we always stream)

        var rowCounter = 0;
        request.query(sqlstmt)

        request.on('recordset', function (columns) {
            // Emitted once for each recordset in a query - for us that means once since we only have one SELECT in our query
            // console.log('DEBUG: recordset columns = ' + JSON.stringify(columns,null,4));
            console.log('DEBUG: number of columns in result set = ' + Object.keys(columns).length);
            res.setHeader('Content-Type', 'application/json');
            if (count) {
                res.write('{ "afdr": ')
            } else {
                if (!numrows) {
                    res.write('{ "afdr": [')
                } else {
                    res.write('{ "rownum": ' + rownum + ', "numrows": ' + numrows + ', "afdr": [')
                }
            }
        });

        request.on('row', function (row) {
            // Emitted for each row in a recordset
            if (rowCounter % 100000 == 0) {
                //For debugging purposes, output the first row and every 100000th row after that
                console.log('DEBUG: a row = ' + JSON.stringify(row));
            }
            if (rowCounter > 0) {
                res.write(',');
            }
            if (count) {
                res.write(JSON.stringify(row.count));
            } else {
                res.write(JSON.stringify(row));
            }
            ++rowCounter;
        });

        request.on('error', function (err) {
            // May be multiple errors but we will bail after the first one
            console.log('DEBUG: error = ' + JSON.stringify(err, null, 4));
            res.write('{ "error" : "' + err.toString() + '" }')
            res.end();
            return;
        });

        request.on('done', function (returnValue) {
            // Always emitted as the last one
            console.log('DEBUG: done returnValue = ' + JSON.stringify(returnValue, null, 4));
            if (!count) {
                res.write('], "count": ' + rowCounter + '} ');
            } else {
                res.write('} ');
            }
            res.end();
        });
    } catch (err) {
        console.error('Error executing SQL query:', err)
        res.write('{ "error" : "' + err + '" }')
        res.status(500).json({ error: 'Internal server error' }); // dga-??? is this needed?
        res.end(); // dga-??? is this needed?  Which of these is needed?
        return;
    }
}

router.get('/', afdrGet);

export default router