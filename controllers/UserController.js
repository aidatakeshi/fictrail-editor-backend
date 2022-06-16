const User = $models.User;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;
const { v4: uuid } = require('uuid');

function e(status, res, error, message){
    return res.status(status).send({error, message});
}

/**
 * POST	login
 */
exports.login = async function(req, res){

    //Check credentials missing -> 401
    let id, password;
    if (!(id = req.body.id) || !(password = req.body.password)){
        return e(401, res, "missing_credentials", "Missing Credentials");
    }

    //Check if user exists -> 401
    const user = await User.findOne({where: {id: id, is_deleted: false}});
    if (!user){
        return e(401, res, "user_not_exists", "User Not Exists");
    }

    //Check if user disabled -> 401
    if (!user.is_enabled){
        return e(401, res, "user_disabled", "User Disabled");
    }

    //Check if last login attempt too close -> 401
    const min_interval = parseInt(process.env.LOGIN_ATTEMPT_INTERVAL_SEC);
    const current_timestamp = Math.floor(new Date().getTime() / 1000);
    const please_wait = user.last_login_attempt + min_interval - current_timestamp;
    if (please_wait > 0){
        return e(401, res, "try_again_later", `Please Try ${please_wait} Seconds Later`);
    }

    //Update last_login_attempt
    user.update({last_login_attempt: current_timestamp});

    //Check if password incorrect -> 401
    if (!user.verifyPassword(password)){
        return e(401, res, "incorrect_password", "Incorrect Password");
    }

    //Proceed
    //Generate a bearer token
    const user_id = user.id;
    const bearer_token = user.generateBearerToken();
    const login_time = current_timestamp;
    const last_activity_time = login_time;

    //Create login record & login session
    LoginRecord.create({user_id, bearer_token, login_time});
    LoginSession.create({user_id, bearer_token, login_time, last_activity_time});

    return res.send({user_id, bearer_token, login_time});
}

/**
 * POST	logout
 */
exports.logout = async function(req, res){

    //Check if bearer token exists
    let bearer_token;
    if (!(bearer_token = req.headers.authorization)){
        return e(401, res, "missing_bearer_token", "Missing Bearer Token");
    }
    bearer_token = bearer_token.split(' ').pop();

    //Check bearer token -> 401
    let login_session = await LoginSession.findOne({where: {bearer_token}});
    if (!login_session){
        return e(401, res, "session_not_found", "Session Not Found");
    }

    //Update login record; remove login session
    let login_record = await LoginRecord.findOne({where: {bearer_token, logout_time: 0}});
    if (login_record){
        const logout_time = Math.floor(new Date().getTime() / 1000);
        login_record.update({logout_time});
    }
    login_session.destroy();

    //Return Data
    let {user_id, login_time} = login_record;
    return res.send({user_id, login_time, logout_time, bearer_token});

}

/**
 * GET myself
 */
exports.getMyself = async function(req, res){
    res.send(res.locals);
}