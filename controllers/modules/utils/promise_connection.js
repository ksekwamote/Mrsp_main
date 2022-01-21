require("dotenv").config({ path: require("app-root-path") + "/.env" });
var connection = require("mysql").createPool({
  connectionLimit: 10000,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = (sql, args) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, results) => {
      if (error) return reject(error);

      if (results) return resolve(results);

      return reject({ message: "no results" });
    });
  });
};
