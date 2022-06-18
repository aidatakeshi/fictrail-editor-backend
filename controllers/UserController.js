const User = $models.User;
const LoginSession = $models.LoginSession;
const LoginRecord = $models.LoginRecord;

const {e, val_e, w} = require("./common");

/**
 * POST	/login
 */
exports.login = async (req, res) => { await w(res, async (t) => {

    //Missing Params -> 401
    let id, password;
    if (!(id = req.body.id) || !(password = req.body.password)){
        return e(400, res, "missing_params", "Missing Parameters");
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
        return e(400, res, "try_again_later", `Please Try ${please_wait} Seconds Later`);
    }

    //Update last_login_attempt
    user.update({last_login_attempt: current_timestamp}, t);

    //Check if password incorrect -> 401
    if (!user.verifyPassword(password)){
        return e(401, res, "incorrect_password", "Incorrect Password");
    }

    //Generate a bearer token
    const user_id = user.id;
    const bearer_token = user.generateBearerToken();
    const login_time = current_timestamp;
    const last_activity_time = login_time;

    //Create login record & login session
    await LoginRecord.create({user_id, bearer_token, login_time}, t);
    await LoginSession.create({user_id, bearer_token, login_time, last_activity_time}, t);

    //Return Data
    return res.send({user_id, bearer_token, login_time});
})};

/**
 * POST	/logout
 */
exports.logout = async (req, res) => { await w(res, async (t) => {

    //Check if bearer token exists
    let bearer_token;
    if (!(bearer_token = req.headers.authorization)){
        return e(400, res, "missing_bearer_token", "Missing Bearer Token");
    }
    bearer_token = bearer_token.split(' ').pop();

    //Check bearer token -> 401
    const login_session = await LoginSession.findOne({where: {bearer_token}});
    if (!login_session){
        return e(401, res, "session_not_found", "Session Not Found");
    }
    let {user_id, login_time} = login_session;

    //Update login record & Remove login session
    const logout_time = Math.floor(new Date().getTime() / 1000);
    const login_record = await LoginRecord.findOne({where: {bearer_token, logout_time: 0}});
    if (login_record){
        login_record.update({logout_time}, t);
    }
    await login_session.destroy(t);

    //Return Data
    return res.send({user_id, login_time, logout_time, bearer_token});
})};

/**
 * GET /myself
 */
exports.getMyself = async (req, res) => { await w(res, async (t) => {
    const user = res.locals.user;
    if (user){
        return res.send(user.getDisplayedObject());
    }
    return res.send({});
})};

/**
 * PUT /myself
 */
exports.setMyself = async (req, res) => { await w(res, async (t) => {
    const params = User.getFilteredParams(req.body, true, false);
    const user = res.locals.user;
    try{
        await user.update(params, t);
    }catch(error){
        return val_e(res, error);
    }
    return res.send(user.getDisplayedObject());
})};

/**
 * PUT /my-password
 */
exports.setMyPassword = async (req, res) => { await w(res, async (t) => {
    const user = res.locals.user;
    const old_password = req.body.old_password;
    const new_password = req.body.new_password;

    //Missing Params -> 401
    if (!old_password || !new_password){
        return e(400, res, "missing_params", "Missing Parameters");
    }
    
    //Check if old password incorrect -> 401
    if (!user.verifyPassword(old_password)){
        return e(401, res, "incorrect_old_password", "Incorrect Old Password");
    }

    //Update with validation
    try{
        await user.update({password: new_password}, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return empty obj if success
    return res.send({});
})};

/**
 * POST /user
 */
exports.newUser = async (req, res) => { await w(res, async (t) => {
    const params = User.getFilteredParams(req.body, false, true);

    //Create with validation
    let user;
    try{
        user = await User.create(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return new user obj if success
    return res.send(user.getDisplayedObject());
    
})};

/**
 * GET /user
 */
exports.getUsers = async (req, res) => { await w(res, async (t) => {

})};

/**
 * GET /user/:user_id
 */
exports.getUser = async (req, res) => { await w(res, async (t) => {

    const user = await User.findOne({
        where: {id: req.params.user_id, is_deleted: false},
    }, t);

    //User not found -> 404
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Return Data
    return res.send(user.getDisplayedObject());

})};

/**
 * PUT /user/:user_id
 */
exports.setUser = async (req, res) => { await w(res, async (t) => {

    const params = User.getFilteredParams(req.body, false, false);
    const user = await User.findOne({
        where: {id: req.params.user_id, is_deleted: false},
    }, t);

    //User not found -> 404
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Update with validation
    try{
        await user.update(params, t);
    }catch(error){
        return val_e(res, error);
    }

    //Return new user obj if success
    return res.send(user.getDisplayedObject());

})};

/**
 * DELETE /user/:user_id
 */
exports.removeUser = async (req, res) => { await w(res, async (t) => {

    const user = await User.findOne({
        where: {id: req.params.user_id, is_deleted: false},
    }, t);

    //User not found -> 404
    if (!user){
        return e(404, res, "user_not_found", "User Not Found");
    }

    //Copy user obj
    const old_user = { ... user.getDisplayedObject() };

    //Soft delete user
    user.update({is_deleted: true});

    //Return old user obj
    return res.send(old_user);

})};