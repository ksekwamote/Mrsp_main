const nodemailer = require('nodemailer');

/*
options:
from
to
subject
text
*/

module.exports.mail = (mail_options) => {
    return new Promise((resolve, reject) => {

        var transporter = nodemailer.createTransport({
          host:'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.MAILER_ADDRESS,
            pass: process.env.MAILER_PASSWORD
          }
        });

      transporter.sendMail(mail_options, function(error, info){
                if (error) {
                    return reject({message: 'sending failed: ' + error.message});
                } else {
                    return resolve();
                }
      });
    });
};
