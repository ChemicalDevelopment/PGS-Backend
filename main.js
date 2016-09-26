//Files
var fs = require('fs');
//firebase module
var firebase = require("firebase");
//Our logging
var log = require('./log');

//Settings
var prefs = {
  distinct: 40,
  consecutive: 60
};

//our extra modules
var mail = require('./mail');

//Create app with tokens
firebase.initializeApp(
  JSON.parse(fs.readFileSync("my.prefs", 'utf8').toString())
);

//Create ref to database
var db = firebase.database();

//Create a ref to users data
var uref = db.ref("/user_data/");

var updategap = 1000;
var lastUpdate = new Date().getTime();

//All user data
var udata = null;
var udata_old = null;


//Returns if it is noteworthy enough to post
function record_worth(a) {
  return (a.distinct >= prefs.distinct) || (a.consecutive >= prefs.consecutive);
}

//returns if they are roughly the same
function areEquiv(a, b) {
  return (a.distinct == b.distinct) && (a.consecutive == b.consecutive) && (a.equation == b.equation);
}

//Changes important values to a, from b
function setImportant(a, b) {
  a.distinct = b.distinct;
  a.consecutive = b.consecutive;
  a.equation = b.equation;
  return a;
}

function removeDuplicates(uid) {
  var funcs = udata[uid].functions;
  var i;
  if (funcs == undefined) {
    return;
  }
  for (f in funcs) {
    if (f != getFuncName(funcs[f])) {
      log.error("Incorrect name for: " + JSON.stringify(funcs[f]) + ". Expected " + getFuncName(funcs[f]) + " got " + funcs[f]);
      db.ref("/user_data/" + uid + "/functions/" + f).remove();
      db.ref("/user_data/" + uid + "/functions/" + getFuncName(funcs[f])).set(funcs[f]);
    }
  }
}

function getFindKey(func, email) {
  return getFuncName(func) + "--" + email;
}

function correctFunc(uid, func) {
  try {
    var cfunc = udata[uid].functions[func];
    if (cfunc.processed || uid == "public") {
      return;
    }
    cfunc.processed = true;
    var funcName = getFuncName(cfunc);
    db.ref("/user_data/public/functions/").child(funcName).set(cfunc);
    db.ref("/user_data/" + uid + "/functions/").child(funcName).set(cfunc);
    var emailLayout = "record_found";
    //Send an email
    var curef = db.ref('/user_data/' + uid);
    curef.once('value').then(function(snapshot) {
      var userdata = snapshot.val();
      var emailInfo = {
        address: userdata.email,
        subject: "PGS - PrimeGenSearch",
        template: emailLayout,
        name: userdata.email,
        //new_eq: test.print_quad(res.equation[0], res.equation[1], res.equation[2]),
        new_record: JSON.stringify(cfunc),
      };
      var findname =  getFindKey(cfunc, userdata.email);
      var foundWorkloads = fs.readFileSync('./output/finds.txt', 'utf8').split("\n");
      for (var i in foundWorkloads) {
        if (i == findname) {
          return;
        }
      }
      log.log_find(findname);
      var mainInfo = emailInfo;
      mainInfo.address = "brown.cade@gmail.com";
      mail.send(emailInfo);
      mail.send(mainInfo);
    });
  } catch (e) {
    log.error("Error checking function or sending mail: " + e);
  }
}

function getFuncName(func) {
  var nm = "";
  for (var k = 0; k < func.equation.length; ++k) {
      nm += "(" + func.equation[k] + ")";
      if (k != func.equation.length - 1) {
          nm += "-";
      }
  }
  return nm;
}

//tests and uploads all of a users functions
function correctUser(uid) {
  console.log("   Checking User: " + uid);
  for (func in udata[uid].functions) {
    correctFunc(uid, func);
  }
  removeDuplicates(uid);
}

//Corrects all users.
function correctAll() {
  for (u in udata) {
    correctUser(u);
  }
}

//Everytime it updates, show the update
uref.on('value', function (snapshot) {
  udata = snapshot.val();
  correctAll();
  console.log("End Of Update\n\n");
  udata_old = udata;
});

setInterval(correctAll(), 1000 * 60 * 60);