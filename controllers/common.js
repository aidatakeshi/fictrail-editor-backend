const { QueryTypes } = require('sequelize');

/**
 * Show Error as JSON Response [showError / e]
 */
function showError(status, res, error, message, additionalInfo = {}){
    return res.status(status).send({error, message, ...additionalInfo});
}
exports.showError = showError;
exports.e = showError;

/**
 * Show Validation Errors as JSON Response [showValidationError / val_e]
 */
function showValidationError(res, error){
    if (Array.isArray(error.errors)){
        return showError(400, res, "validation_error", "Validation Error", {
            details: error.errors.map(item => ({
                field: item.path, type: item.validatorKey, message: item.message,
            })),
        });
    }else{
        return res.status(500).send({error: "error", message: error.toString()});
    }
}
exports.showValidationError = showValidationError;
exports.val_e = showValidationError;

/**
 * Wrapper to Handling Errors (Including Database Errors) [wrapperForController / w]
 */
async function wrapperForController(res, func){
    try{
        const result = await $models.sequelize.transaction(async function(transaction){
            const t = {transaction};
            const subresult = await func(t);
            return subresult;
        });
        return result;
    } catch (error){
        return res.status(500).send({error: "error", message: error.toString()});
    }
}
exports.wrapperForController = wrapperForController;
exports.w = wrapperForController;

/**
 * Get Object for Model Instance (filtered unwanted fields for display)
 * [Required Attributes in Class] hidden_fields
 */
function getDisplayObject(instance, className, altAttribute = "hidden_fields"){
    const MyClass = $models[className];
    let obj = instance.toJSON();
    for (let field of MyClass[altAttribute]) delete obj[field];
    return obj;
}
exports.getDisplayObject = getDisplayObject;

/**
 * Get Filtered Queries for POST/PUT Model Instance (filter non-editable fields)
 * [Required Attributes in Class] locked_fields
 */
function filterQueries(queries, className, isNew, altAttribute = "locked_fields"){
    const MyClass = $models[className];
    if (!isNew) delete queries.id;
    for (let f of ['id_auto', 'created_at', 'created_by', 'is_deleted']) delete queries[f];
    for (let f of MyClass[altAttribute]) delete queries[f];
    return queries;
}
exports.filterQueries = filterQueries;

/**
 * API - List for Model Instances
 * [Required Attributes in Class]
 * sorts, sort_default, filters, limit_default, limit_max, hidden_fields*
 * [Optional Methods in Class]
 * additional_data (function, params: instance, req)
 * [Options]
 * alt_hidden_fields (string)
 * append_where (string/array)
 * append_where_replacement (string/array)
 * custom_mapping (function, params: instance, req)
 * additional_data (class method takes priority)
 * custom_select (string)
 * custom_join_statement (string)
 */
async function listingAPI(req, res, className, options = {}){

    const MyClass = $models[className];
    const tableName = MyClass.tableName;
    let where = "is_deleted = FALSE";
    let replacements = [];

    //Make Filter (query: *varies)
    for (let key in req.query){
        let value = req.query[key];
        let $filters = MyClass.filters || {};
        if ($filters[key]){
            let {statement, replacement} = $filters[key](value);
            where += ` AND (${statement})`;
            replacements = replacements.concat(replacement);
        }
    }

    let append_where = Array.isArray(options.append_where) ? options.append_where
    : (options.append_where ? [options.append_where] : []);
    let append_where_replacement = Array.isArray(options.append_where_replacement) ? options.append_where_replacement
    : (options.append_where_replacement ? [options.append_where_replacement] : []);
    for (let item of append_where) where += ` AND (${item})`;
    for (let item of append_where_replacement) replacements.push(item);

    //Sort (query: _sort)
    let $sorts = MyClass.sorts || {};
    let order_by = MyClass.sort_default || "id ASC";
    let sort_query = req.query._sort;
    if (sort_query){
        sort_query = sort_query.split('_')
        let sort_direction = sort_query.pop();
        let sort_key = sort_query.join('_');
        if ($sorts[sort_key]){
            order_by = $sorts[sort_key];
            order_by += (sort_direction == 'desc' ? ' DESC' : ' ASC');
        }
    }

    //Make Count
    const join_statement = options.custom_join_statement || '';
    const query_count = `SELECT COUNT(id) FROM ${tableName} ${join_statement} WHERE ${where}`;
    const count_result = await $models.sequelize.query(query_count, {
        replacements,
        type: QueryTypes.SELECT,
    });
    const count = count_result[0].count;

    //If Have Results
    if (count){
        //Handle Pagination
        let limit = parseInt(req.query._limit) || MyClass.limit_default || 25;
        if (MyClass.limit_max){
            if (limit > MyClass.limit_max) limit = MyClass.limit_max;
        }
        const pages = Math.ceil(count / limit);
        let page = parseInt(req.query._page) || 1;
        page = Math.min(Math.max(page, 1), pages);
        const offset = limit * (page - 1);
        const limit_offset = `LIMIT ${limit} OFFSET ${offset}`;
        
        //Do Search
        const select = options.custom_select || '*';
        const query_select = `SELECT ${select} FROM ${tableName} ${join_statement}`
        + ` WHERE ${where} ORDER BY ${order_by} ${limit_offset}`;
        const instances = await $models.sequelize.query(query_select, {
            replacements,
            type: QueryTypes.SELECT,
            mapToModel: true,
            model: MyClass,
        });
        const from = offset + 1;
        const to = offset + instances.length;

        //Handle Mapping & Additional Data
        let data;
        if (!options.custom_mapping){
            data = instances.map(instance => getDisplayObject(instance, className, options.alt_hidden_fields));
        }else{
            data = instances.map(instance => options.custom_mapping(instance, req));
        }
        const additional_data_func = MyClass.additional_data || options.additional_data;
        if (additional_data_func){
            let a_data = instances.map(instance => additional_data_func(instance, req));
            for (let i in a_data){
                data[i] = {...data[i], ...a_data[i]};
            }
        }

        //Return Data
        return res.send({ pages, page, limit, from, to, count, data });
    }

    //If No Results
    else{
        return res.send({
            pages: null, page: null, limit: null, from: null, to: null, count: 0, data: [],
        });
    }

    
}
exports.listingAPI = listingAPI;