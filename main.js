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
var test = require('./test');
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
      log.error("Incorrect name for: " + JSON.stringify(funcs[f]) + ". Expected " + getFuncName(funcs[f]) + " got funcs[f]");
      db.ref("/user_data/" + uid + "/functions/" + getFuncName(funcs[f])).set(funcs[f]);
      db.ref("/user_data/" + uid + "/functions/" + f).remove();
    }
  }
}

function correctFunc(uid, func) {
  var carrythrough = (udata_old == null);
  //Now we incrementally null checking the structure
  if (!carrythrough) carrythrough = carrythrough || (udata_old[uid] == null);
  if (!carrythrough) carrythrough = carrythrough || (udata_old[uid].functions == null);
  if (!carrythrough) carrythrough = carrythrough || (udata_old[uid].functions[func] == null);
  if (!carrythrough) {
    return;
  }
  try {
    var cfunc = udata[uid].functions[func];
    var res = test.test_poly(cfunc.equation);
    var funcName = getFuncName(res);
    var pp = db.ref("/user_data/public/functions/").child(funcName);
    var up = db.ref("/user_data/" + uid + "/functions/").child(funcName);
    var emailLayout = "default";
    if (uid != "public" && record_worth(res)) {
      pp.set(res);
    }
    if (areEquiv(res, cfunc)) {
      return;
    } 
    if (record_worth(res)) {
      emailLayout = "record_changed";
      up.set(res);
    } else {
      emailLayout = "record_deleted";
      up.remove();
    }
    //Send an email
    var curef = db.ref('/user_data/' + uid);
    curef.once('value').then(function(snapshot) {
      var userdata = snapshot.val();
      var emailInfo = {
        address: userdata.email,
        subject: "PGS - PrimeGenSearch",
        template: emailLayout,
        name: userdata.email,
        old_eq: test.print_quad(cfunc.equation[0], cfunc.equation[1], cfunc.equation[2]),
        old_record: JSON.stringify(cfunc),
        new_eq: test.print_quad(res.equation[0], res.equation[1], res.equation[2]),
        new_record: JSON.stringify(res),
      };
      mail.send(emailInfo);
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
  if (new Date().getTime() - lastUpdate < updategap) {
    return;
  }
  for (u in udata) {
    correctUser(u);
  }
  lastUpdate = new Date().getTime();
}

//Everytime it updates, show the update
uref.on('value', function (snapshot) {
  udata = snapshot.val();
  correctAll();
  console.log("End Of Update\n\n");
  udata_old = udata;
});

test.readPrimes();
console.log("Done reading in primes");
