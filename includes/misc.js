exports.getObjectExceptField = function(obj, ...fields){
    let return_obj = {...obj};
    for (let field of fields) delete return_obj[field];
    return return_obj;
}

exports.sumObjects = function(items, attributes){
    let return_obj = {};
    for (let attribute of attributes){
        return_obj[attribute] = 0;
        for (let item of items){
            return_obj[attribute] += parseFloat(item[attribute]);
        }
        const decimals = Math.max(...items.map(item => countDecimals(item[attribute])));
        if (Number.isFinite(decimals)){
            return_obj[attribute] = parseFloat(return_obj[attribute].toFixed(decimals));
        }
    }
    return return_obj;
}

exports.sum = function(numbers){
    let sum = 0;
    for (let number of numbers) sum += parseFloat(number);
    const decimals = Math.max(...numbers.map(number => countDecimals(number)));
    if (Number.isFinite(decimals)){
        return parseFloat(sum.toFixed(decimals));
    }
    return sum;
}

function countDecimals(value) {
    if (isNaN(value)) return 0;
    if (value === null) return 0;
    if ((value % 1) != 0){
        return value.toString().split(".")[1].length;  
    }
    return 0;
};