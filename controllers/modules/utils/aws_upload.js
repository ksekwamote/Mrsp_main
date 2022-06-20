var AWS = require("aws-sdk");

require("dotenv").config({ path: require("app-root-path") + "/.env" });

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: "af-south-1",
});

var s3Bucket = new AWS.S3({ params: { Bucket: "boprita-online" } });

module.exports.uploadToS3 = async (params) => {
  return new Promise((resolve, reject) => {
    const { imageBinary, doc_name, type } = params;

    //var buf = Buffer.from(imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64')
    var buf = Buffer.from(
      imageBinary.replace(/^data:.+;base64,/, ""),
      "base64"
    );

    const currentTime = new Date().getTime();
    var data = {
      Key: `${doc_name}_${currentTime}.${type}`, // dynamically render filename //process.env //multiple
      Body: buf,
      ContentEncoding: "base64",
      //ContentType: 'image/jpeg',
      ACL: "public-read",
    };
    s3Bucket.putObject(data, function (err, data) {
      if (err) {
        console.log(err);
        console.log("Error uploading data");
        reject(err);
      } else {
        const url = `https://boprita-online.s3.af-south-1.amazonaws.com/${username}_${doc_name}_${currentTime}.${type}`;
        console.log("successfully uploaded the image! " + url);
        resolve({ url });
      }
    });
  });
};

// helper functions

//converting the file to a base 64 string
const fileToBase64 = (filename, filepath) => {
  return new Promise((resolve) => {
    var file = new File([filename], filepath);
    var reader = new FileReader();

    //read file content on file loaded event
    reader.onload = function (event) {
      resolve(event.target.result);
    };

    //convert data to base64
    reader.readAsDataURL(file);
  });
};

//Example of the function call:
fileToBase64("test.pdf", "../files/test.pdf").then((result) => {
  console.log(result);
});
