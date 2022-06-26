'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class File extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: { type: dt.UUID, unique: true, primaryKey: true },
        key: { type: dt.STRING, validate: validations.id },
        project_id: { type: dt.STRING, allowNull: false },
        directory: { type: dt.STRING, allowNull: false },
        filename_original: { type: dt.STRING, allowNull: false },
        filename: { type: dt.STRING, allowNull: false },
        mimetype: { type: dt.STRING, allowNull: false },
        size: { type: dt.BIGINT },
        encoding: { type: dt.BIGINT },
        //
        created_at: { type: dt.BIGINT },
        created_by: { type: dt.STRING },
        deleted_at: { type: dt.BIGINT },
        deleted_by: { type: dt.STRING },
    };

    const defaultScope = {
        where: { deleted_by: null },
    };

    const scopes = {
    };

    const model_options = {
        modelName: 'File',
        tableName: 'files',
        timestamps: false,
        defaultScope,
        scopes,
        sequelize,
    };

    File.init(model_attributes, model_options);

    /**
     * CRUD-Related
     */
    File.sorts = { //e.g. "id:asc", "id:desc"
        key: ($DIR) => [['key', $DIR]],
        name: ($DIR) => [
            [sequelize.fn('LOWER', sequelize.col('filename_original')), $DIR],
        ],
        mimetype: ($DIR) => [['mimetype', $DIR]],
        size: ($DIR) => [['size', $DIR]],
        created_at: ($DIR) => [["created_at", $DIR]],
        created_by: ($DIR) => [["created_by", $DIR]],
    };
    File.sort_default = [["created_at", "ASC"]];

    File.filters = {
        name: (val) => ({
            filename_original: { [Op.iLike]: `${val}%` }
        }),
        name_contains: (val) => ({
            filename_original: { [Op.iLike]: `%${val}%` }
        }),
        mimetype: (val) => ({mimetype: val}),
        size_smaller: (val) => ({size: {[Op.lte]: val}}),
        size_larger: (val) => ({size: {[Op.gte]: val}}),
        created_before: (val) => ({created_at: {[Op.lte]: val}}),
        created_after: (val) => ({created_at: {[Op.gte]: val}}),
        created_by: (val) => ({created_by: val}),
    };

    File.limit_default = 25;
    File.limit_max = 100;

    /**
     * Model Specific Methods
     */
    File.getNewFileToken = function(){
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        const length = process.env.FILE_TOKEN_LENGTH || 16;
        for (let i = 0; i < length; i++){ //token.length = 16
            token += chars.charAt(Math.floor(Math.random() * 62)); //chars.length = 62
        }
        return token;
    };

    File.getNewFileKey = async function(){
        while(true){
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let key = '';
            const length = process.env.FILE_KEY_LENGTH || 16;
            for (let i = 0; i < length; i++){ //token.length = 16
                key += chars.charAt(Math.floor(Math.random() * 62)); //chars.length = 62
            }
            //Check collision
            let existingFile = await File.findOne({where: {key}});
            if (!existingFile) return key;
        }
    };

    File.getNewFileDirectory = function(){
        const YMD = new Date().getUTCFullYear() * 10000
        + new Date().getUTCMonth() * 100 + 100 + new Date().getUTCDate();
        return `${YMD}`;
    };

    /**
     * Model Specific Methods
     */
    File.prototype.display = function(){
        let obj = { ...this.toJSON() }
        for(let f of ['deleted_at', 'deleted_by']) delete obj[f];
        for(let f of ['id', 'directory', 'filename']) delete obj[f];
        return obj;
    };
    
    //Return Model Class
    return File;

};