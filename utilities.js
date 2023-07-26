
/*****

Utility functions for validating URL parameters, mapping addresses to lat/long, etc.

HOWTO import and call the functions here in a node repl:

$ node
Welcome to Node.js v18.15.0.
Type ".help" for more information.
>
> {translateAddressToLatLon, isQuotedString, isPositiveInteger, parseArrayOfNumbers, parseArrayofDateStrings, parseDateString} = await import('./utilities.js')
[Module: null prototype] {
  isPositiveInteger: [Function: isPositiveInteger],
  isQuotedString: [Function: isQuotedString],
  parseArrayOfNumbers: [Function: parseArrayOfNumbers],
  parseArrayofDateStrings: [Function: parseArrayofDateStrings],
  parseDateString: [Function: parseDateString],
  translateAddressToLatLon: [AsyncFunction: translateAddressToLatLon]
}
>
> await translateAddressToLatLon("100 West 1st St, Los Angeles, CA 90012")
DEBUG: translateAddressToLatLon(100 West 1st St, Los Angeles, CA 90012)
DEBUG: lat = 34.0520016, lon = -118.2445562
{ lat: 34.0520016, lon: -118.2445562 }
>
> isQuotedString('"this string starts and ends with double quotes"')
true
>
>
*****/


import fetch from 'node-fetch';

const dotenv= await import('dotenv')
dotenv.config()  // loads .env file into process.env
const apiKey = process.env.GOOGLE_MAPS_API_KEY

export async function translateAddressToLatLon(address) {

  const encodedAddress = encodeURIComponent(address);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  try {
    console.log('DEBUG: translateAddressToLatLon(' + address + ')')
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log('DEBUG: lat = ' + lat + ', lon = ' + lng)
      return { lat: lat, lon: lng };
    } else {
      throw new Error('translateAddressToLatLon: Error: Geocoding failed for address: ' + address +
                      ' with status: ' + data.status + ' and error_message: ' + data.error_message);
    }
  } catch (error) {
    throw new Error('translateAddressToLatLon: Error: ' + error);
  }
}


export function isQuotedString(value) {
    // Check if value is a string and starting and ending with double quotes
    // isQuotedString('"123 Rose Ave."') === true
    // isQuotedString('123 Rose Ave.') === false

    if (typeof value === 'string') {
        const firstCharacter = value[0];
        const lastCharacter = value[value.length - 1];
        if (firstCharacter === '"' && lastCharacter === '"') {
            return true;
        }
    }
    return false;
}

export function isPositiveInteger(value) {
    // Check if value is a positive integer
    // isPositiveInteger(5) === true
    // isPositiveInteger(-5) === false
    // isPositiveInteger(0) === false
    // isPositiveInteger(5.5) === false
    return Number.isInteger(value) && Math.sign(value) === 1;
}

export function parseArrayOfNumbers(str) {
    // Parse a string into an array of numbers
    // parseArrayOfNumbers('[1,2,3]') === [1,2,3]

    try {
      const parsedArray = JSON.parse(str);
      if (Array.isArray(parsedArray)) {
        if (parsedArray.every(element => typeof element === 'number')) {
            return parsedArray
        }
      }
    } catch (error) {
      // Parsing error or not a valid JSON
      return false;
    }
    return false;
}

export function parseArrayofDateStrings(x) {
    // parse a string into an array of date strings
    // parseArrayofDateStrings('[ 2023-07-01, 2023-07-04 ]') === [ '2023-07-01', '2023-07-04' ]
    // parseArrayofDateStrings('[ 2023-98-99, 2023-07-04 ]')
    // generates error:
    // parseArrayofDateStrings: Daterange is not of form [ date, date ]

    try {
        const xt = x.trim()
        if (xt[0] == '[' && xt[xt.length-1] == ']') {
            const arrayOfDateString = xt.slice(1,-1).split(',')  //// [ ' 1-1-21', ' 2-1-21 ' ]
            if (arrayOfDateString.length == 1 || arrayOfDateString.length == 2) {
                if (arrayOfDateString.every(x => !isNaN(Date.parse(x)))) {
                    return arrayOfDateString
                }
            }
        }
    }
    catch (error) {
        console.error("parseArrayofDateStrings: " + error)
        return false
    }
    console.log("parseArrayofDateStrings: Daterange is not of form [ date, date ]")
    return false
}

export function parseDateString(x) {
    // dga- For the moment this accepts any date string parsable by Date.parse
    // dga- GOAL (???) Restrict to data strings of form YYYY-MM-DD HH-MM via regex match
    // verify that x is an ISO 8601 date string and return x
    // parseDateString('2023-07-01') === '2023-07-01'
    // parseDateString('July 26, 2023 12:18') === 'July 26, 2023 12:18'

    try {
        if (!isNaN(Date.parse(x))) {
            return x
        }
    }
    catch (error) {
        console.error("parseDateString: " + error)
        return false
    }
    console.log("parseDateString: date is not an ISO 8601 date string")
    return false
}

