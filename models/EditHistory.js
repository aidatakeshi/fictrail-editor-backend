'use strict';
const { Model, DataTypes:dt, Op } = require('sequelize');
const { validations } = require("./common");

const { getDelta, applyDelta } = require('../includes/diffJSON');

const { v4: uuid } = require('uuid');

module.exports = (sequelize) => {

    class EditHistory extends Model {
        static associate(models) {
        }
    }

    const model_attributes = {
        id: { type: dt.STRING, allowNull: false, primaryKey: true, unique: true },
        project_id: { type: dt.STRING, allowNull: true },
        type: { type: dt.STRING, allowNull: false },
        type_id: { type: dt.STRING, allowNull: false },
        changes: { type: dt.JSON, allowNull: false, defaultValue: {} },
        //
        updated_at: { type: dt.BIGINT },
        updated_by: { type: dt.STRING },
    };

    const model_options = {
        modelName: 'EditHistory',
        tableName: 'edit_history',
        timestamps: false,
        sequelize,
    };

    EditHistory.init(model_attributes, model_options);

    /**
     * Methods
     */
    EditHistory.newHistory = async function(res, type, new_data, old_data, t){
        const id = uuid();
        const type_id = new_data.id;
        const project_id = res.locals.project_id || null;
        const updated_by = res.locals.user_id;
        const updated_at = Math.round(new Date().getTime() / 1000);
        const changes = getDelta(new_data, old_data);
        if (changes !== undefined && type_id){
            await EditHistory.create({
                id, project_id, type, type_id, changes, updated_by, updated_at,
            }, t);
        }
    };

    //Return Model Class
    return EditHistory;

};