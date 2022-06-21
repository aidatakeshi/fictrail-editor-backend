/**
 * Return delta = beta - alpha (undefined if equal)
 */
const getDelta = function(alpha, beta){

    const typeof_alpha = typeof2(alpha);
    const typeof_beta = typeof2(beta);
    const is_arr_obj_alpha = (typeof_alpha == 'object' || typeof_alpha == 'array');
    const is_arr_obj_beta = (typeof_beta == 'object' || typeof_beta == 'array');

    //Both Array -> Compare
    if (typeof_alpha == 'array' && typeof_beta == 'array'){
        return getDeltaForTwoArrays(alpha, beta);
    }
    //Both Object -> Compare
    if (typeof_alpha == 'object' && typeof_beta == 'object'){
        return getDeltaForTwoObjects(alpha, beta);
    }
    //If Both Not Array / Object -> Compare, return undefined if same
    if (!is_arr_obj_alpha && !is_arr_obj_beta){
        if (alpha === beta) return undefined;
    }
    //Otherwise, return beta
    if (typeof_beta == 'array') return [beta]; //Array shall be wrapped
    return beta;
};

exports.getDelta = getDelta;

//Get detailed type of variable: undefined / null / array / etc
const typeof2 = function(item){
    if (item === undefined) return "undefined";
    if (item === null) return "null";
    if (Array.isArray(item)) return "array";
    return typeof item;
};

//Get delta between two objects. (undefined if equal)
const getDeltaForTwoObjects = function(alpha = {}, beta = {}){
    let delta = {};
    //Check each field in beta, compare it with alpha
    for (let f in beta){
        const delta_f = getDelta(alpha[f], beta[f]);
        if (delta_f !== undefined) delta[f] = delta_f;
    }
    //Check fields present only in alpha -> return [] as attribute deletion indicator
    for (let f in alpha){
        if (beta[f] === undefined) delta[f] = [];
    }
    //If delta obj is not empty, return it.
    if (Object.keys(delta).length) return delta;
};

//Get delta between two arrays. (undefined if equal)
const getDeltaForTwoArrays = function(alpha = [], beta = []){

    /**
     * [Mode 1] All elements in both arrays are objects containing "id"
     * Delta Format: [indices, items]
     * indices: Array corresponding to positions in beta, each item with old index in alpha,
     *     or null for new item
     * items: Arrays of new items and Object of new items, and delta+id of existing items.
     *     The first N items (according to number of nulls in indices) are considered as new items.
     */
    if (areObjectsWithID(alpha) && areObjectsWithID(beta)){

        let indices = [];
        let indicesUnchanged = (alpha.length == beta.length);
        let items = [];

        //Get indices in alpha
        let alpha_indices = {};
        for (let i = 0; i < alpha.length; i++){
            alpha_indices[alpha[i].id] = i;
        }

        //Compare indices in beta & alpha
        for (let i = 0; i < beta.length; i++){
            const beta_item = beta[i];
            const id = beta_item.id;
            let alpha_index = alpha_indices[id];
            //New Item...
            if (alpha_index === undefined){
                indices.push(null); //ID of new item
                items.push(beta_item);
                indicesUnchanged = false;
            }
            //Existing Item...
            else{
                indices.push(alpha_index); //alpha index of existing item
                const alpha_item = alpha[alpha_index];
                const delta = getDelta(beta_item, alpha_item);
                if (delta !== undefined){
                    items.push({id, ...delta});
                }
                if (i !== alpha_index) indicesUnchanged = false;
            }
        }

        //Return result if changes
        if (!indicesUnchanged || Object.keys(items).length){
            return [indices, items];
        }
    }

    //Mode 2: Other cases
    //Delta Format: [entire_beta_array]
    else{
        if (!areArraysEqual(alpha, beta)) return [beta];
    }
};

//Check if all items in array are objects with ID
const areObjectsWithID = function(array){
    for (let item of array){
        if (typeof item !== 'object') return false;
        if (item.id === undefined || item.id === null) return false;
    }
    return true;
}

//Check if arrays equal
const areArraysEqual = function (array1, array2){
    if (array1.length != array2.length) return false;
    for (let i in array1){
        const delta = getDelta(array2[i], array1[i]);
        if (delta !== undefined) return false;
    }
    return true;
}

/**
 * Return beta = alpha + delta
 */
const applyDelta = function(alpha, delta){

    const typeof_alpha = typeof2(alpha);
    const typeof_delta = typeof2(delta);
    const is_arr_obj_alpha = (typeof_alpha == 'object' || typeof_alpha == 'array');
    const is_arr_obj_delta = (typeof_delta == 'object' || typeof_delta == 'array');

    //If delta undefined -> directly return alpha
    if (delta === undefined){
        return alpha;
    }
    //Both Array...
    if (typeof_alpha == 'array' && typeof_delta == 'array'){

        //Delta Format: [indices, items]
        //All elements in both alpha/beta are objects containing "id"
        if (delta.length > 1){
            const indices = delta[0];
            const items = delta[1];
            let items_obj = {};
            for (let item of items) items_obj[item.id] = item;
            //Make beta array
            let beta = [];
            let nullCount = 0;
            for (let index of indices){
                if (index === null){
                    beta.push(items[nullCount]);
                    nullCount++;
                }else{
                    const alpha_item = alpha[index];
                    const delta_item = items_obj[alpha_item.id];
                    const beta_item = applyDelta(alpha_item, delta_item);
                    beta.push(beta_item);
                }
            }
            return beta;
        }

        //Delta Format: [entire_beta_array] -> simply return wrapped array
         if (delta.length == 1){
            return delta[0];
        }

        //Delta Format: [] -> undefined
        return undefined;
    }
    //Both Object...
    else if (typeof_alpha == 'object' && typeof_delta == 'object'){
        let beta = { ...alpha };
        for (let f in delta){
            beta[f] = applyDelta(alpha[f], delta[f]);
        }
        return beta;
    }
    //Other Cases -> directly return delta
    else{
        if (typeof_delta == 'array'){
            if (delta.length) return delta[0]; //Array with element: wrapped array
            return undefined; //Array without element: undefined indicator
        }
        return delta;
    }
};

exports.applyDelta = applyDelta;