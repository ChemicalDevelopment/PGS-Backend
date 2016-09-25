module.exports = {
    send: send
};
//file stuff
var fs = require('fs');
//Mail service
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
//Allows us to sleep
//var sleep = require('sleep');

//Our private info
var log = require('./log');


//Our auth into google
var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: JSON.parse(fs.readFileSync("my.creds", 'utf8'))
}));

//Sends to an address with subject, and info
function send(info) {
    var fdata = [];
    function readHandle(err, data) {
        if (err) {
            return err;
        }
        for (prop in info) {
            data = data.split("{{" + prop + "}}").join(info[prop]);
        }
        fdata = data.split("{{{}}}");

        var mailOptions = {
            from: '"PGS - Prime Generator Search" <pgs@chemicaldevelopment.us>', // sender address
            to: info.address,
            subject: info.subject, // Subject line
            text: fdata[0], // plaintext body
            html: fdata[1] // html body
        };
        transporter.sendMail(mailOptions, function(error, i){
            if (error){
                return console.log(error);
            }
            log.error('Message sent to: ' + info.address + ", regarding: " + info.subject);
            log.error('   Additional Info: ');
            log.error(JSON.stringify(info));
        });
    }
    fs.readFile('./' + info.template + ".layout", 'utf8', readHandle);
}

