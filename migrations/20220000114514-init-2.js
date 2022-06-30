'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {

        const double = { type: Sequelize.DOUBLE, allowNull: true };

        const id = { type: Sequelize.UUID, primaryKey: true, unique: true };
        const project_id = { type: Sequelize.STRING };

        const region_broader_id = { type: Sequelize.UUID, allowNull: true };
        const region_id = { type: Sequelize.UUID, allowNull: true };
        const rail_operator_type_id = { type: Sequelize.UUID, allowNull: true };
        const rail_operator_id = { type: Sequelize.UUID, allowNull: true };
        const major_rail_operator_id = rail_operator_id;
        const rail_line_type_id = { type: Sequelize.UUID, allowNull: true };
        const rail_line_id = { type: Sequelize.UUID, allowNull: true };
        const train_service_type_id = { type: Sequelize.UUID, allowNull: true };
        const train_vehicle_type_id = { type: Sequelize.UUID, allowNull: true };

        const file_key = { type: Sequelize.STRING, allowNull: true };
        const logo_file_key = file_key;

        const [latitude, longitude, altitude_m] = [double, double, double];
        const [x_min, x_max, y_min, y_max] = [double, double, double, double];
        const [_x_min, _x_max, _y_min, _y_max] = [double, double, double, double];
        const hide_below_logzoom = { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 };
        const polygons = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };
        const _land_polygons = polygons;
        const _area = { type: Sequelize.DOUBLE, allowNull: true };

        const name = { type: Sequelize.TEXT, allowNull: true };
        const name_l = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const [name_short, name_suffix] = [name, name];
        const [name_short_l, name_suffix_l] = [name_l, name_l];
        const _names = { type: Sequelize.TEXT, allowNull: true };
        const remarks = { type: Sequelize.TEXT, allowNull: true };

        const color = { type: Sequelize.STRING, allowNull: true };
        const [map_color, color_text] = [color, color];
        const map_thickness = { type: Sequelize.BIGINT, allowNull: true };

        const [_length_km, max_speed_kph] = [double, double];
        const sections = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };
        const is_premium = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const tracks = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };
        const track_info = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };

        const is_major = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const is_signal_only = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const is_in_use = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true };

        const specs = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const _results = { type: Sequelize.JSON, allowNull: false, defaultValue: {} };
        const _results_by_kph = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };

        const sort = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const is_locked = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };
        const is_hidden = { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false };

        const _history = { type: Sequelize.JSON, allowNull: false, defaultValue: [] };
        const created_at = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const created_by = { type: Sequelize.STRING, allowNull: true };
        const deleted_at = { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 };
        const deleted_by = { type: Sequelize.STRING, allowNull: true };

        await queryInterface.createTable('_map_ref_images', {
            id, project_id,
            x_min, x_max, y_min, y_max,
            file_key,
            hide_below_logzoom,
            sort, is_locked, is_hidden,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_map_lands', {
            id, project_id,
            polygons, name, name_l,
            hide_below_logzoom,
            sort, is_locked,
            _x_min, _x_max, _y_min, _y_max,
            _area, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_map_waters', {
            id, project_id,
            polygons, name, name_l,
            hide_below_logzoom,
            sort, is_locked,
            _x_min, _x_max, _y_min, _y_max,
            _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_regions_broader', {
            id, project_id,
            polygons, name, name_l, name_short, name_short_l,
            sort, remarks,
            _area, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_regions', {
            id, project_id,
            region_broader_id,
            name, name_l, name_suffix, name_suffix_l, name_short, name_short_l, remarks,
            sort, is_locked,
            polygons, _land_polygons,
            _area, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_regions_sub', {
            id, project_id,
            region_id,
            name, name_l, name_suffix, name_suffix_l, name_short, name_short_l, remarks,
            sort, is_locked,
            polygons, _land_polygons,
            _area, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_rail_operator_types', {
            id, project_id,
            name, name_l, remarks,
            sort, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_rail_operators', {
            id, project_id,
            rail_operator_type_id,
            name, name_l, name_short, name_short_l,
            color, color_text, logo_file_key,
            remarks, sort,
            _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_rail_line_types', {
            id, project_id,
            name, name_l, remarks,
            map_color, map_thickness,
            sort, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_rail_lines', {
            id, project_id,
            rail_line_type_id,
            name, name_l, name_short, name_short_l, remarks,
            _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_rail_lines_sub', {
            id, project_id,
            rail_line_id, rail_operator_id,
            name, name_l, name_short, name_short_l,
            color, color_text, remarks,
            max_speed_kph, sections,
            _length_km, _x_min, _x_max, _y_min, _y_max, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_train_service_types', {
            id, project_id,
            rail_operator_id,
            name, name_l, name_short, name_short_l,
            color, color_text, is_premium, remarks,
            sort, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_train_service_names', {
            id, project_id,
            train_service_type_id, major_rail_operator_id,
            name, name_l, name_short, name_short_l,
            color, color_text, remarks,
            sort, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_stations', {
            id, project_id,
            major_rail_operator_id, region_id,
            name, name_l, name_short, name_short_l,
            longitude, latitude, altitude_m,
            tracks, track_info,
            is_major, is_signal_only, is_in_use,
            remarks, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_train_vehicle_types', {
            id, project_id,
            name, name_l,
            remarks, sort, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

        await queryInterface.createTable('_train_vehicle_specs', {
            id, project_id,
            train_vehicle_type_id,
            name, name_l, remarks,
            specs, sort,
            _results, _results_by_kph, _names,
            created_at, created_by, deleted_at, deleted_by, _history,
        });

    },
    
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('_map_ref_images');
        await queryInterface.dropTable('_map_lands');
        await queryInterface.dropTable('_map_waters');
        await queryInterface.dropTable('_regions_broader');
        await queryInterface.dropTable('_regions');
        await queryInterface.dropTable('_regions_special');
        await queryInterface.dropTable('_rail_operator_types');
        await queryInterface.dropTable('_rail_operators');
        await queryInterface.dropTable('_rail_line_types');
        await queryInterface.dropTable('_rail_lines');
        await queryInterface.dropTable('_rail_lines_sub');
        await queryInterface.dropTable('_train_types');
        await queryInterface.dropTable('_train_names');
        await queryInterface.dropTable('_stations');
        await queryInterface.dropTable('_train_vehicle_types');
        await queryInterface.dropTable('_train_vehicle_specs');
    }
};