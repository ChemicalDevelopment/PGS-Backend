var fs = require('fs');

module.exports = {
    log: log,
    error: error,
    log_find: log_find
}

//Logs info
function log(txt) {
    console.log(txt);
    fs.appendFileSync('./output/output.txt', txt + "\n", 'utf8');
}
//Logs error info
function error(txt) {
    log("error: "+ txt);
    fs.appendFileSync('./output/error.txt', "\n" + txt + "\n", 'utf8');
}
//Logs a found function
function log_find(txt) {
    log("found: "+ txt);
    fs.appendFileSync('./output/finds.txt', txt + "\n", 'utf8');
}