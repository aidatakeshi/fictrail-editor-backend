'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

let sequelize;
sequelize = new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
.filter(file => {
    if (file === basename) return false;            //Current file
    if (file.split('.').length > 2) return false;   //Containing two or more "."
    if (file.slice(-3) !== '.js') return false;     //Non .js file
    return true;
})
.forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
