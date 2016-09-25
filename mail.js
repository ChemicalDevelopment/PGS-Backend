module.exports = {
    send: send
};
//file stuff
var fs = require('fs');
var creds = JSON.parse(fs.readFileSync("./my.creds", 'utf8').toString());
var nodemailer = require('nodemailer');
const pug = require('pug');

var log = require('./log');

var transporter = nodemailer.createTransport('smtps://' + creds.email + "%40gmail.com:" + creds.pass + '@smtp.gmail.com');

//Sends to an address with subject, and info
function send(info) {
    //Compile function, and substitute info
    var htmlFunc = pug.compileFile('./' + info.template + ".pug");
    var txt = htmlFunc(info);

    var mailOptions = {
        from: '"PGS - Prime Generator Search" <pgs@chemicaldevelopment.us>', // sender address
        to: info.address,
        subject: info.subject, // Subject line
        text: txt,
        html: txt
    };
    transporter.sendMail(mailOptions, function(error, i){
        if (error){
            return log.error(error);
        }
        log.error('Message sent to: ' + info.address + ", regarding: " + info.subject);
        log.log('   Additional Info: ');
        log.log(JSON.stringify(info));
    });
}