var promise_query = require("../utils/promise_connection");
var handle = require("../utils/handle");
var cryptojs = require("crypto-js");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    if (params.password != params.confirm_password) {
      return reject({ message: "Primary Account Password Mismatch" });
    }

    if (params.maintenance_password != params.confirm_maintenance_password) {
      return reject({ message: "Maintenance Password Mismatch" });
    }

    if (params.accounting_password != params.confirm_accounting_password) {
      return reject({ message: "Accounting Password Mismatch" });
    }
    if (params.management_password != params.confirm_management_password) {
      return reject({ message: "Management Password Mismatch" });
    }
    if (params.secondary_password != params.confirm_secondary_password) {
      return reject({ message: "Secondary Password Mismatch" });
    }

    var user_id;
    promise_query("select hash, activated from ProductKey", [])
      .then((results) => {
        var check = cryptojs
          .SHA256(params.activation_key)
          .toString(cryptojs.enc.Base64);

        if (results[0].activated === "true") {
          return reject({ message: "Unauthorized Activation Attempt" });
        }
        if (check !== results[0].hash) {
          return reject({ message: "Invalid Product Activation Key" });
        }

        var main_hash = cryptojs
          .SHA256(params.password)
          .toString(cryptojs.enc.Base64);
        var accounting_hash = cryptojs
          .SHA256(params.accounting_password)
          .toString(cryptojs.enc.Base64);
        var maintenance_hash = cryptojs
          .SHA256(params.maintenance_password)
          .toString(cryptojs.enc.Base64);
        var management_hash = cryptojs
          .SHA256(params.management_password)
          .toString(cryptojs.enc.Base64);
        var secondary_hash = cryptojs
          .SHA256(params.secondary_password)
          .toString(cryptojs.enc.Base64);

        return promise_query(
          "insert into LandLord(first_name, last_name, country, town, physical_address, company_name, registration_number, registered_address, company_phone_number, collection_bank_name, collection_account_name, collection_account_number, collection_branch_code, accounting_email_address, accounting_password, maintenance_email_address, maintenance_password, management_email_address, management_password, secondary_email_address, secondary_password,  email_address, password) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            params.first_name,
            params.last_name,
            params.country,
            params.town,
            params.physical_address,
            params.company_name,
            params.registration_number,
            params.registered_address,
            params.company_phone_number,
            params.collection_bank_name,
            params.collection_account_name,
            params.collection_account_number,
            params.collection_branch_code,
            params.accounting_email_address,
            accounting_hash,
            params.maintenance_email_address,
            maintenance_hash,
            params.management_email_address,
            management_hash,
            params.secondary_email_address,
            secondary_hash,
            params.email_address,
            main_hash,
          ]
        );
      })
      .then((result) => {
        user_id = result.insertId;
        return promise_query("update ProductKey set activated = ?", ["true"]);
      })

      .then((result) =>
        resolve({
          ID: user_id,
          username: params.email_address,
          password: params.password,
        })
      )
      .catch((error) => {
        console.log(error);
        return reject({ message: error.message });
      });
  });
};
