
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
    return Number.isInteger(value) && Math.sign(value) === 1;
}

export function parseArrayOfNumbers(str) {
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

