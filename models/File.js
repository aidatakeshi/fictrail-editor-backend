'use strict';
const { Model, DataTypes:dt } = require('sequelize');
const { validations } = require("./common");

module.exports = (sequelize) => {

    class File extends Model {
        static associate(models) {
            // define association here
        }
    }

    const model_attributes = {
        id: { type: dt.STRING, primaryKey: true, unique: true, validate: validations.id },
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
     * Model Specific Methods
     */
    File.getNewFileToken = function(){
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++){ //token.length = 16
            token += chars.charAt(Math.floor(Math.random() * 62)); //chars.length = 62
        }
        return token;
    };

    File.getNewFileID = async function(){
        while(true){
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let id = '';
            for (let i = 0; i < 16; i++){ //token.length = 16
                id += chars.charAt(Math.floor(Math.random() * 62)); //chars.length = 62
            }
            //Check collision
            let existingFile = await File.findOne({where: {id}});
            if (!existingFile) return id;
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
        for(let f of ['directory', 'filename']) delete obj[f];
        return obj;
    };
    
    //Return Model Class
    return File;

};