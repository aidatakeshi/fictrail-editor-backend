const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const ProjectSettings = $models.ProjectSettings;
const User = $models.User;

const { QueryTypes, Op } = require('sequelize');

const {e, val_e, w} = require("./common");
const {APIforListing} = require("./common");

const { v4: uuid } = require('uuid');

/**
 * Note: 404 "project_not_found" already handled in AuthMiddleware
 */

/**
 * POST /project
 */
exports.newProject = async (req, res) => { await w(res, async (t) => {

    //If the user cannot create new project
    if (!res.locals.is_root_user && !res.locals.can_create_new_project){
        return e(403, res, "create_new_project_not_allowed", "Creating New Project Not Allowed");
    }

    const params = Project.filterQueries(req.body, true);

    //Set created_at, created_by
    params.created_by = res.locals.user_id;
    params.created_at = Math.floor(new Date().getTime() / 1000);

    //Create project with validation
    let project;
    try{
        project = await Project.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Create project_settings with default value
    let params_settings = {
        ...ProjectSettings.default,
        id: params.id,
        project_id: params.id,
    };
    project_settings = await ProjectSettings.create(params_settings, t);

    //Return new project obj if success
    return res.send(project.display());

})};

/**
 * GET /project
 */
exports.getProjects = async (req, res) => { await w(res, async (t) => {

    //Not root user: Only list projects assigned to the user, and public projects
    if (!res.locals.is_root_user){
        //Get Project IDs of Projects Assigned to the User
        const project_ids_assigned = await ProjectAssignment.findAll({
            attributes: ['project_id'], where: {user_id: res.locals.user_id},
        })
        let project_ids = project_ids_assigned.map((instance) => instance.project_id);
        //Get Project IDs of Public Projects
        const project_ids_public = await Project.findAll({
            attributes: ['id'], where: {is_public: true},
        })
        project_ids = project_ids.concat(project_ids_public.map((instance) => instance.id));
        //Get Projects & ProjectAssignments
        let response = await APIforListing(req, res, 'Project', {
            where: { id: {[Op.in]: project_ids} },
            include: {
                model: ProjectAssignment,
                where: {user_id: res.locals.user_id},
                required: false,
            },
            mapping: (instance) => {
                let data = instance.display();
                data.my_rights = null;
                if (data.ProjectAssignments.length){
                    data.my_rights = data.ProjectAssignments[0].rights;
                }
                delete data.ProjectAssignments;
                return data;
            },
        });
        return response;
    }
    //Root user: List all projects
    else{
        let response = await APIforListing(req, res, 'Project', {
            mapping: (instance) => ({
                ...instance.display(),
                my_rights: 'root',
            }),
        });
        return response;
    }

})};

/**
 * GET /project/:project_id
 */
exports.getProject = async (req, res) => { await w(res, async (t) => {

    const project = res.locals.project;
    let data = {
        ...project.display(),
        my_rights: res.locals.rights,
    };
    
    if (req.query.get_settings){
        const project_id = res.locals.project_id;
        const project_settings = await ProjectSettings.findOne({where: {project_id}});
        data.settings = project_settings.toJSON();
        delete data.settings.id;
        delete data.settings.project_id;
    }

    //Return Data
    return res.send(data);

})};

/**
 * PUT /project/:project_id
 */
exports.setProject = async (req, res) => { await w(res, async (t) => {

    const params = Project.filterQueries(req.body, false);
    const project = res.locals.project;

    //Update with validation
    try{
        await project.update(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return data if success
    return res.send({
        ...project.display(),
        my_rights: res.locals.rights,
    });

})};

/**
 * DELETE /project/:project_id
 */
exports.removeProject = async (req, res) => { await w(res, async (t) => {

    const project = res.locals.project;
    
    //Copy project obj
    const old_project = {
        ...project.display(),
        my_rights: res.locals.rights,
    };

    //Soft delete project
    await project.update({
        deleted_by: res.locals.user_id,
        deleted_at: Math.floor(new Date().getTime() / 1000),
    }, t);

    //Return old project obj
    return res.send(old_project);

})};

/**
 * PUT /project/:project_id/assign
 */
exports.assignProject = async (req, res) => { await w(res, async (t) => {

    const project_id = req.params.project_id;

    //Missing params -> 400
    const user_id = req.query.user_id;
    if (!user_id){
        return e(400, res, "missing_params", "Missing Parameters");
    }

    //Invalid rights -> 400
    const rights = req.query.rights;
    if (!['viewer', 'editor', 'owner'].includes(rights)){
        return e(400, res, "invalid_rights_type", "Invalid Rights Type");
    }

    //User not found -> 404
    const user = await User.findOne({where: {id: user_id}}, t);
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Update / Insert ProjectAssignment item
    const data = {id: uuid(), user_id, project_id, rights};
    let project_assignment = await ProjectAssignment.findOne({where: {
        user_id, project_id
    }}, t);

    if (project_assignment){
        await project_assignment.update(data, t);
    }else{
        project_assignment = await ProjectAssignment.create(data, t);
    }

    //Return Data
    delete data.id;
    return res.send(data);

})};

/**
 * PUT /project/:project_id/unassign
 */
exports.unassignProject = async (req, res) => { await w(res, async (t) => {

    const project_id = req.params.project_id;

    //Missing params -> 400
    const user_id = req.query.user_id;
    if (!user_id){
        return e(400, res, "missing_params", "Missing Parameters");
    }
    
    //User not found -> 404
    const user = await User.findOne({where: {id: user_id}}, t);
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Remove ProjectAssignment item
    let project_assignment = await ProjectAssignment.findOne({where: {
        user_id, project_id
    }}, t);

    if (project_assignment){
        await project_assignment.destroy(t);
    }

    //Return Data
    return res.send({});

})};

/**
 * GET /project/:project_id/assignment
 */
exports.getProjectAssignments = async (req, res) => { await w(res, async (t) => {

    const project_id = req.params.project_id;
    let query = "SELECT users.*, rights FROM users"
    + " RIGHT JOIN project_assignments ON project_assignments.user_id = users.id"
    + " WHERE project_id = ?";
    let data = await $models.sequelize.query(query, {
        replacements: [project_id],
        type: QueryTypes.SELECT,
        mapToModel: true,
        model: User,
    });

    //Return Data
    data = data.map(item => item.display());
    return res.send({data});

})};

/**
 * GET /project/:project_id/settings
 */
exports.getProjectSettings = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    const project_settings = await ProjectSettings.findOne({where: {project_id}});

    if (!project_settings){
        return e(500, res, "project_settings_missing", "Project Settings Missing");
    }

    //Return Data
    data = project_settings.toJSON();
    delete data.id;
    return res.send(data);

})};

/**
 * PUT /project/:project_id/settings
 */
exports.setProjectSettings = async (req, res) => { await w(res, async (t) => {

    const project_id = res.locals.project_id;
    const project_settings = await ProjectSettings.findOne({where: {project_id}});

    if (!project_settings){
        return e(500, res, "project_settings_missing", "Project Settings Missing");
    }

    //Update with validation
    const params = ProjectSettings.filterQueries(req.body, false);
    try{
        await project_settings.update(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return settings obj if success
    data = project_settings.toJSON();
    delete data.id;
    return res.send(data);

})};