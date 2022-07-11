'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {

        const id = { type: Sequelize.UUID, primaryKey: true, unique: true };
        const project_id = { type: Sequelize.STRING, allowNull: true };
        const type = { type: Sequelize.STRING };
        const type_id = { type: Sequelize.STRING };
        const changes = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const updated_at = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const updated_by = { type: Sequelize.STRING, allowNull: true };

        await queryInterface.createTable('edit_history', {
            id, project_id, type, type_id,
            changes, updated_at, updated_by,
        });

    },
    
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('edit_history');
    }
};