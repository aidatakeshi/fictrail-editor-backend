'use strict';
const models = require("../models");

const User = models['User'];

module.exports = {
    async up (queryInterface, Sequelize) {

        const current_timestamp = Math.floor(new Date().getTime() / 1000);

        //Create root user
        const root_user = await User.create({
            id: 'root',
            is_root_user: true,
            password: 'root',
            created_at: current_timestamp,
        });
        console.log("[Created user 'root' with password 'root']");

    },

    async down (queryInterface, Sequelize) {

        return queryInterface.bulkDelete('users', [{
            username: 'root',
        }]);
        
    }
};
