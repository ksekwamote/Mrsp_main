const nodemailer = require("nodemailer");

module.exports = function (mail) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sycamon.bw@gmail.com",
        pass: "pctizqyjbcihsqab",
      },
    });
    // const mail_options = {
    //   from: "sycamon.bw@gmail.com",
    //   to: `${mail.email_address}`,
    //   subject: "IT HELPDESK NOTIFICATION",
    //   html: ,
    // };

    transporter.sendMail(mail, function (error, info) {
      if (error) {
        return reject({ message: "sending failed: " + error.message });
      } else {
        return resolve();
      }
    });
  });
};
