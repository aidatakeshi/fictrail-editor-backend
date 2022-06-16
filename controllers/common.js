//Return Error
function error(status, res, error, message){
    return res.status(status).send({error, message});
}
exports.error = error;
exports.e = error;

//Wrapper to handling controller errors (including database errors)
async function wrapperForController(res, func){
    try{
        const result = await $models.sequelize.transaction(async function(transaction){
            const t = {transaction};
            const subresult = await func(t);
            return subresult;
        });
        return result;
    } catch (e){
        return res.status(500).send({error: "error", message: e.toString()});
    }
}
exports.wrapperForController = wrapperForController;
exports.w = wrapperForController;