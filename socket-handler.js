/**
 * Socket.io Handler
 */

const User = $models.User;
const Project = $models.Project;
const ProjectAssignment = $models.ProjectAssignment;
const LoginSession = $models.LoginSession;

//Handle Authentication During Connection
global.io.use(async function(socket, next){

    //Get Bearer Token & Project ID
    const bearer_token = socket.handshake.auth.token;
    const project_id = socket.handshake.query.project_id;

    //Check project_id
    const project = await Project.findOne({
        where: {id: project_id},
    });
    if (!project){
        return next(new Error("Project Not Found"));
    }

    //Check bearer_token
    if (!bearer_token && !project.is_public){
        return next(new Error("Project Not Public"));
    }
    let user_id = null;
    if (bearer_token){
        const login_session = await LoginSession.findOne({where: {bearer_token}});
        if (!login_session){
            return next(new Error("Invalid Bearer Token"));
        }
        user_id = login_session.user_id;
    }

    //Check user
    //If user not found or disabled -> Fail; If user is root -> Success; Else -> Proceed
    if (user_id){
        const user = await User.findOne({where: {id: user_id, deleted_by: null}});
        if (!user){
            return next(new Error("User Not Found"));
        }
        if (!user.is_enabled){
            return next(new Error("User Disabled"));
        }
        //Check user assignment if not root user
        if (!user.is_root_user){
            const project_assignment = await ProjectAssignment.findOne({
                where: {project_id, user_id},
            });
            if (!project_assignment){
                return next(new Error("User Not Assigned To Project"));
            }
        }
    }

    //Finally, proceed
    socket.user_id = user_id;
    socket.project_id = project_id;
    return next();

});

//Handle Socket Connection (for certain project_id as room)
global.io.on('connection', function (socket) {

    //Join Room (project_id as room name)
    socket.join(socket.project_id);

    //Make Disconnection Handler
    socket.on("disconnect", (reason) => {
        io.to(socket.project_id).emit("bye", socket.user_id);
    });

    //Event: hello
    socket.on("hello", function () {
        io.to(socket.project_id).emit("hello", socket.user_id);
    });

});