String.prototype.turkishToUpper = function(){
    let string = this;
    const letters = { "i": "İ", "ş": "Ş", "ğ": "Ğ", "ü": "Ü", "ö": "Ö", "ç": "Ç", "ı": "I" };
    string = string.replace(/(([iışğüçö]))/g, function(letter){ return letters[letter]; })
    return string.toUpperCase();
}

String.prototype.turkishToLower = function(){
    let string = this;
    const letters = { "İ": "i", "I": "ı", "Ş": "ş", "Ğ": "ğ", "Ü": "ü", "Ö": "ö", "Ç": "ç" };
    string = string.replace(/(([İIŞĞÜÇÖ]))/g, function(letter){ return letters[letter]; })
    return string.toLowerCase();
}


String.prototype.toUpperOnlyFirstChar = function(){
    let string = this;
    string = string.replaceAll(/\s+/g, ' ');
    let strings = string.split(" ");

    for (let i = 0; i < strings.length; i++) {
        strings[i] = strings[i][0].turkishToUpper() + strings[i].substring(1).turkishToLower();
    }

    return strings.join(" ");
}

module.exports = {
    turkishToUpper: String.prototype.turkishToUpper,
    turkishToLower: String.prototype.turkishToLower,
    toUpperOnlyFirstChar: String.prototype.toUpperOnlyFirstChar
};