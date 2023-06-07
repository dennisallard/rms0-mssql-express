import express from 'express';
import { poolPromiseCrimes } from '../db.js';
import { isPositiveInteger, parseArrayOfNumbers, parseArrayofDateStrings } from '../utilities.js'

const router = express.Router();

async function crimesGet(req, res) {

    // parse URL arguments and build where clause
    try {
        console.log("req.params = " + JSON.stringify(req.params, null, 4))
        console.log("req.query = " + JSON.stringify(req.query, null, 4))

        // check for invalid parameters
        const params = ['dr', 'daterange', 'location', 'geo', 'rownum', 'size', 'count']
        const invalidParams = Object.keys(req.query).filter(key => !params.includes(key))
        if (invalidParams.length > 0) {
            console.log('ERROR: invalid parameters: ' + invalidParams)
            throw ('ERROR: invalid parameters: ' + invalidParams)
        }

        var rownum = req.query.rownum || 1;      // optional starting row number, default to 1
        var size = req.query.size || null;       // optional number of rows to return

        var whereClause = '1=1'  // below we add optional where clauses each starting with ' AND'

        if (!isPositiveInteger(parseInt(rownum))) {
            throw ('ERROR: rownum must be a positive integer');
        }

        if (size) {
            // return size number of rows [ordered by DR_NO for now] starting at rownum
            if (!isPositiveInteger(parseInt(size))) {
                throw ('ERROR: size must be a positive integer');
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
                const daterangeparm = req.query.daterange
                console.log('req.query.daterange = ' + daterangeparm)
                var daterange = parseArrayofDateStrings(daterangeparm)
                if (!daterange) {
                    console.log('ERROR: daterange not of form [ date ] or [ date, date ]')
                    throw ('ERROR: daterange not of form [ date, date ]')
                }
                if (daterange.length == 1) {
                    // if only one date is specified, then use it as both start and end date
                    daterange = [daterange[0], daterange[0]]
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
                const geoparm = req.query.geo
                console.log('req.query.geo = ' + geoparm)
                const geo = parseArrayOfNumbers(geoparm)
                if (!geo || geo.length !== 3) {
                    console.log('ERROR: there must be 3 geo args, each a number')
                    throw ('geo args not an array of 3 numbers')
                }
                const lat = geo[0]
                const lon = geo[1]
                const distance = geo[2]
                if (lon > 0) {
                    console.log('ERROR: second geo are (LONG) must be a negative number')
                    throw ('second geo are (LONG) must be a negative number')
                }
                if (distance < 0) {
                    console.log('ERROR: third geo arg (Distance)) must be a positive number')
                    throw ('third geo arg (Distance) must be a positive number')
                }
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
        res.end();
        return;
    }

    // build SQL statement
    try {
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
    } catch (err) {
        console.log(err)
        res.write('{ "error" : "' + err + '" }')
        res.end();
        return;
    }

    // execute SQL statement and stream results back to client
    try {
        const pool = await poolPromiseCrimes;
        const request = pool.request(); // or: new sql.Request(pool1) dga-??? why this copilot comment?
        //dga- is the following no longer needed?
        request.stream = true; // You can set streaming differently for each request (we always stream)

        var rowCounter = 0;
        request.query(sqlstmt)

        request.on('recordset', function (columns) {
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

        request.on('row', function (row) {
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
            res.write('], "count": ' + rowCounter + '} ');
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

router.get('/', crimesGet);

export default router