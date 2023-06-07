
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

/*****
module.exports = {
    isPositiveInteger,
    parseArrayOfNumbers,
    parseArrayofDateStrings
}
*****/
