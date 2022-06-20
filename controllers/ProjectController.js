const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const ProjectSettings = $models.ProjectSettings;
const User = $models.User;

const {e, val_e, w} = require("./common");
const {listingAPI, getDisplayObject, filterQueries} = require("./common");

/**
 * POST /project
 */
exports.newProject = async (req, res) => { await w(res, async (t) => {

    //If the user cannot create new project
    if (!res.locals.is_root_user && !res.locals.can_create_new_project){
        return e(403, res, "create_new_project_not_allowed", "Creating New Project Not Allowed");
    }

    const params = filterQueries(req.body, 'Project', true);

    //Set created_at, created_by
    params.created_by = res.locals.user_id;
    params.created_at = Math.floor(new Date().getTime() / 1000);

    //Create project with validation
    let project, project_settings;
    try{
        project = await Project.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Create project_settings with default value
    let params_settings = { ...ProjectSettings.default, project_id: params.id };
    project_settings = await ProjectSettings.create(params_settings, t);

    //Return new project obj if success
    return res.send(getDisplayObject(project, 'Project'));

})};

/**
 * GET /project
 */
exports.getProjects = async (req, res) => { await w(res, async (t) => {

    //Not root user: Only list projects assigned to the user, and public projects
    if (!res.locals.is_root_user){
        let response = await listingAPI(req, res, 'Project', {
            custom_select: 'projects.*, project_assignments.rights',
            custom_join_statement: 'LEFT JOIN project_assignments ON projects.id = project_assignments.project_id',
            append_where: 'user_id = ? or is_public = true',
            append_where_replacement: res.locals.user_id,
        });
        return response;
    }
    //Root user: List all projects
    else{
        let response = await listingAPI(req, res, 'Project', {
            additional_data: () => ({rights: 'root'}),
        });
        return response;
    }

})};

/**
 * GET /project/:project_id
 */
exports.getProject = async (req, res) => { await w(res, async (t) => {

    //Return Data
    return res.send({
        ...getDisplayObject(res.locals.project, 'Project'),
        rights: res.locals.rights,
    });

})};

/**
 * PUT /project/:project_id
 */
exports.setProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * DELETE /project/:project_id
 */
exports.removeProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/assign
 */
exports.assignProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/unassign
 */
exports.unassignProject = async (req, res) => { await w(res, async (t) => {


})};

/**
 * GET /project/:project_id/settings
 */
 exports.getProjectSettings = async (req, res) => { await w(res, async (t) => {


})};

/**
 * PUT /project/:project_id/settings
 */
exports.setProjectSettings = async (req, res) => { await w(res, async (t) => {


})};