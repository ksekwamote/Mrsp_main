const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//setting up the client for billing
const client = require("@sendgrid/client");
client.setApiKey(process.env.SENDGRID_API_KEY);

// module.exports.mail = (mail_options) => {
//   return new Promise((resolve, reject) => {
//     var transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.MAILER_ADDRESS,
//         pass: process.env.MAILER_PASSWORD,
//       },
//     });

//     transporter.sendMail(mail_options, function (error, info) {
//       if (error) {
//         return reject({ message: "sending failed: " + error.message });
//       } else {
//         return resolve();
//       }
//     });
//   });
// };
