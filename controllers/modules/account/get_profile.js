var promise_query = require('../utils/promise_connection');

module.exports = (params) => {

    return new Promise((resolve, reject) => {
        console.log(params);
        promise_query('select email_address, maintenance_email_address, accounting_email_address,secondary_email_address, management_email_address,first_name, last_name, country, town, physical_address, company_name, registration_number, registered_address, company_email_address, company_phone_number,  collection_bank_name, collection_account_name, collection_account_number, collection_branch_code from LandLord where ID = ?', [params.ID])
        .then(result => resolve({profile: result[0], message: ''}))
        .catch(error => reject({message: error.message}));
    });

};
