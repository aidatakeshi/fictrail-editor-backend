const User = $models.User;
const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;

const {e, w} = require("../controllers/common");

/**
 * restriction:
 * "root": Root users only
 * "user": Any users (default mode)
 * "owner": Owner user of project (only applicable for routes with :project_id specified)
 * "editor": Editor user of project (same as above)
 * "viewer": Viewer user of project, or any user / non-user of public project (same as above)
 */
module.exports = function(restriction = "user", use_file_token = false){
    return async (req, res, next) => { await w(res, async (t) => {

        let login_session;
        let user, user_id;
        let is_root_user, can_create_new_project;
        let project_id = req.params.project_id;
        let user_rights_in_project, is_project_public;

        let bearer_token = req.headers.authorization;
        let file_token = req.query.token;

        //Find Login Session
        if (!use_file_token && bearer_token){
            bearer_token = bearer_token.split(' ').pop();
            login_session = await LoginSession.findOne({where: {bearer_token}});
            if (!login_session){
                return e(401, res, "session_not_found", "Session Not Found");
            }
        }else if (file_token){
            login_session = await LoginSession.findOne({where: {file_token}});
            if (!login_session){
                return e(401, res, "session_not_found", "Session Not Found");
            }
        }

        //Bearer Token Specified
        if (login_session){

            //"Force Logout" Flag
            let force_logout_error = null, force_logout_message = null;

            //Check if login session expired -> 401
            const last_activity_time = login_session.last_activity_time;
            const logout_inactivity_sec = parseInt(process.env.LOGOUT_INACTIVITY_SEC || 86400);
            const current_timestamp = Math.floor(new Date().getTime() / 1000);
            if (current_timestamp > last_activity_time + logout_inactivity_sec){
                force_logout_error = "session_expired";
                force_logout_message = "Session Expired. Please Login Again";
            }

            //Get user instance
            user_id = login_session.user_id;
            user = await User.findOne({where: {id: user_id, deleted_by: null}}, t);
            is_root_user = user.is_root_user;
            can_create_new_project = user.can_create_new_project;

            //If user not found -> 401
            if (!user){
                force_logout_error = "user_not_found";
                force_logout_message = "User Not Found";
            }

            //If user disabled -> 401
            if (!user.is_enabled){
                force_logout_error = "user_disabled";
                force_logout_message = "User Disabled";
            }

            //Force Logout?
            if (force_logout_error){
                //Update login record & Remove login session
                let login_record = await LoginRecord.findOne({where: {bearer_token, logout_time: 0}}, t);
                if (login_record){
                    login_record.update({logout_time: current_timestamp}, t);
                }
                await login_session.destroy(t);
                return e(401, res, force_logout_error, force_logout_message);
            }

            //Proceed, Update last_activity_time
            login_session.update({last_activity_time: current_timestamp});

            //Pass Session Data to Controller
            res.locals.bearer_token = login_session.bearer_token;
            res.locals.file_token = login_session.file_token;
        }

        //Pass User Data to Controller
        res.locals.user = user;
        res.locals.user_id = user_id;
        res.locals.is_root_user = is_root_user;
        res.locals.can_create_new_project = can_create_new_project;

        //Check User Rights in the Project
        if (project_id && res.locals.user_id){

            //...is_project_public, user_rights_in_project
            const project = await Project.findOne({
                where: {id: project_id},
            }, t);

            //Project not found -> 404
            if (!project){
                return e(404, res, "project_not_found", "Project Not Found");
            }

            //is_project_public
            is_project_public = project.is_public;

            //Check user rights
            let project_assignment;
            if (res.locals.is_root_user){
                user_rights_in_project = 'root';
            }else{
                project_assignment = await ProjectAssignment.findOne({
                    where: {project_id, user_id},
                }, t);
                if (project_assignment){
                    user_rights_in_project = project_assignment.rights;
                }else{
                    user_rights_in_project = null;
                }
            }

            //Pass Project Data to Controller
            res.locals.project = project;
            res.locals.project_id = project.id;
            res.locals.rights = user_rights_in_project;
            res.locals.assignment = project_assignment;

        }

        //Handle Different Restrictions
        
        //root
        if (restriction == "root"){
            if (!is_root_user){
                return e(403, res, "not_root_user", "Not Root User");
            }
        }
        //owner
        else if (restriction == "owner" && project_id){
            if (user_rights_in_project == "owner"){}
            else if (user_rights_in_project == "root"){}
            else{
                return e(403, res, "not_project_owner", "Not Project Owner");
            }
        }
        //editor
        else if (restriction == "editor" && project_id){
            if (user_rights_in_project == "owner"){}
            else if (user_rights_in_project == "editor"){}
            else if (user_rights_in_project == "root"){}
            else{
                return e(403, res, "not_project_editory", "Not Project Editor");
            }
        }
        //viewer
        else if (restriction == "viewer" && project_id){
            if (is_project_public){}
            else if (user_rights_in_project){}
            else{
                return e(403, res, "project_private", "Project Private");
            }
        }
        //user
        else{
            if (!user_id){
                return e(401, res, "not_valid_user", "Not Valid User");
            }
        }

        //Pass to Next
        next();

    })};
}