var moodle_client = require("moodle-client");
var fs = require('fs').promises;
var UserCache = require('./usercache')

let arguments = process.argv.slice(2);
let usercache = new UserCache();

if(arguments[0]==='c') {
    if(arguments[1] && Number.parseInt(arguments[1])) {
        let courseId = Number.parseInt(arguments[1]);
        doWork(getAssignments, {courseId});
    } else {
        doWork(getCourses);
    }
};

if(arguments[0]==='m') {
    if(arguments[1] && Number.parseInt(arguments[1])) {
        let cmId = Number.parseInt(arguments[1]);
        doWork(showModule, {cmId});
    }
}

if(arguments[0]==='a') {
    if(arguments[1] && Number.parseInt(arguments[1])) {
        let cmId = Number.parseInt(arguments[1]);
        doWork(showAssignmentAnswers, {cmId});
    }
}

if(arguments[0]==='u') {
    if(arguments[1] && Number.parseInt(arguments[1])) {
        let courseId = Number.parseInt(arguments[1]);
        doWork(getUsers, {courseId});
    }
}

async function doWork(command, params) {
    let credentials = await getCredentials();
    moodle_client.init(credentials).then((client) => command(client, params)
    
    ).catch(function(err) {
        console.log("Unable to initialize the client: " + err);
    });
}

async function getCourses(client){
    info = await site_info(client);
    let userid = info.userid;
    let coursesList = await list_courses(client, userid);
    console.log(coursesList.map(e => e.id + ' ' + e.fullname));
}

async function getAssignments(client, params) {
    let courseId = params.courseId;
    let contents = await get_contents(client, courseId);
    workshopsAndAssignments = contents.map(c=>c.modules)
        .reduce((acc,v)=>{return acc.concat(v)},[])
        .filter(v=>(v.modname === 'assign' || v.modname === 'workshop'));

    console.log(workshopsAndAssignments.map(e=> {
        return e.id + ' ' + e.modname + '   ' + e.name;
    }));
}

async function showModule(client, params) {
    let cmId = params.cmId;
    let moduleInfo = await get_module(client, cmId);
    console.log(moduleInfo);
}

async function showAssignmentAnswers(client, params) {
    let cmId = params.cmId;
    let moduleInfo = await get_module(client, cmId);
    //console.log(moduleInfo);
    if(moduleInfo.cm.modname === 'workshop') {
        let workshopId = moduleInfo.cm.instance;
        let result = await get_workshop_submissions(client, workshopId);
        console.log(result.submissions/*.map(s=>s.attachmentfiles)*/);
    }
}

async function getUsers(client, params) {
    let courseId = params.courseId;
    let users = await get_enrolled_users(client, courseId);
    usersList = users.map(u => {let e = {}; e.id=u.id;e.fullname=u.fullname; return e;});
    usersList.forEach(e=>{
        usercache.addUser(e.id,e.fullname);
    });
    usercache.saveToFile();
}


async function getCredentials() {
    try{
        const credentialsData = await fs.readFile('./credentials.json', 'utf8');
        return JSON.parse(credentialsData);
    } catch(e){
        console.log('failed to read ./credentials.json. Please copy and edit ./credentials-example.json');
        process.exit(1);
    }
}


function get_contents(client, courseId) {
    return client.call({
        wsfunction: "core_course_get_contents",
        args: {
            courseid: courseId
        }
    });
}

function site_info(client) {
    return client.call({
        wsfunction: "core_webservice_get_site_info",
    });
} 


function list_courses(client, userid) {
    return client.call({
        wsfunction: "core_enrol_get_users_courses",
        args: {
        	userid: userid
    	}
    })
}

function get_module(client, cmid) {
    return client.call({
        wsfunction: "core_course_get_course_module",
        args: {
            cmid: cmid
        }
    })
}

function get_workshop_submissions(client, workshopId) {
    return client.call({
        wsfunction: "mod_workshop_get_submissions",
        args: {
            workshopid: workshopId
        }
    })
}

function get_enrolled_users(client, courseId) {
    return client.call({
        wsfunction: "core_enrol_get_enrolled_users",
        args: {
            courseid: courseId
        }
    });
}