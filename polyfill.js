//
// Proposal: String.cooked
// Repository: https://github.com/tc39/proposal-string-cooked
// Spec: https://tc39.es/proposal-string-cooked/
// 
// ```
// String.cooked`mmm ... \u0064elicious cooked string` // 'mmm ... delicious cooked string'
// ```
//
if (!String.cooked) {
    function ToObject(value) {
        if (value == null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }
        return Object(value);
    }
    
    function ToString(value) {
        if (typeof value === "symbol") {
            throw new TypeError("Cannot convert a Symbol value to a string");
        }
        return String(value);
    }
    
    Object.defineProperty(String, "cooked", {
        value: (template = {}, ...substitutions) => {
            // 1.1 Let numberOfSubstitutions be the number of elements in substitutions.
            let numberOfSubstitutions = substitutions.length;
            // 1.2 Let cooked be ? ToObject(template).
            let cooked = ToObject(template);
            // 1.3. Let literalSegments be ? LengthOfArrayLike(cooked).
            let literalSegments = cooked.length;
            // 1.4 If literalSegments ≤ 0, return the empty String.
            if (literalSegments <= 0) return "";
            // 1.5 Let stringElements be a new empty List.
            let stringElements = [];
            // 1.6 Let nextIndex be 0.
            let nextIndex = 0;
            // 1.7 Repeat:
            while (true) {
                // 1.7a Let nextKey be ! ToString(𝔽(nextIndex)).
                let nextKey = ToString(nextIndex);
                // 1.7b Let nextVal be ? Get(cooked, nextKey).
                let nextVal = cooked[nextKey];
                // 1.7c If Type(nextVal) is Undefined, throw a TypeError exception.
                if (typeof nextVal === "undefined") {
                    throw new TypeError("Template elements cannot be undefined");
                }
                // 1.7d Let nextSeg be ? ToString(nextVal).
                let nextSeg = ToString(nextVal);
                // 1.7e Append the code unit elements of nextSeg to the end of stringElements.
                stringElements.push(nextSeg);
                // 1.7f If nextIndex + 1 = literalSegments, then
                if (nextIndex + 1 === literalSegments) {
                    // 1.7i Return the String value whose code units are the elements in the List stringElements. If stringElements has no elements, the empty String is returned.
                    return stringElements.join("");
                }
                // 1.7g If nextIndex < numberOfSubstitutions, let next be substitutions[nextIndex].
                let next;
                if (nextIndex < numberOfSubstitutions) {
                    next = substitutions[nextIndex];
                } else {
                    // 1.7h Else, let next be the empty String.
                    next = "";
                }
                // 1.7i Let nextSub be ? ToString(next).
                let nextSub = ToString(next);
                // 1.7j Append the code unit elements of nextSub to the end of stringElements.
                stringElements.push(nextSub);
                // 1.7k Set nextIndex to nextIndex + 1.
                nextIndex += 1;
            }
        },
        configurable: true,
        enumerable: false,
        writable: true
    })
}
