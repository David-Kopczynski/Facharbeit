/* ---------- Prototypes ----------*/

// Add or remove classes
Element.prototype.addClass = function(classname) {
    this.classList.add(classname);
}
Element.prototype.removeClass = function(classname) {
    this.classList.remove(classname);
}

Array.prototype.addClass = function(classname) {
    this.forEach((item) => item.addClass(classname));
}
Array.prototype.removeClass = function(classname) {
    this.forEach((item) => item.removeClass(classname));
}

// Create element by tagname
Element.prototype.createElement = function(elementName) {
    return this.appendChild(document.createElement(elementName));
}

/* ---------- https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript ---------- */
Array.prototype.equals = function(array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
