var promise_query = require('../utils/promise_connection');
var handle = require('../utils/promise_connection');
var cryptojs = require('crypto-js');


module.exports = async (params) => {
    return new Promise((resolve, reject) => {
        promise_query('update LandLord set email_address = ?, first_name=?, last_name=?, country =?, town=?, physical_address=?, company_name= ?, registration_number = ?, registered_address =?, company_email_address = ?, company_phone_number =?, collection_bank_name= ?, collection_account_name =?, collection_account_number =?, collection_branch_code =?, accounting_email_address = ?, maintenance_email_address = ?, secondary_email_address = ?, management_email_address = ? where ID = ?',
        [params.email_address,
           params.first_name,
           params.last_name,
           params.country,
           params.town,
           params.physical_address,
           params.company_name,
           params.registration_number,
           params.registered_address,
           params.company_email_address,
           params.company_phone_number,
           params.collection_bank_name,
           params.collection_account_name,
           params.collection_account_number,
           params.collection_branch_code,
           params.accounting_email_address,
           params.maintenance_email_address,
           params.secondary_email_address,
           params.management_email_address,
           params.ID
           ])

        .then(res => {

            if(params.old_password === '' &&
                params.old_accounting_password === '' &&
                params.old_maintenance_password === '' &&
                params.old_management_password === '' &&
                params.old_secondary_password === ''){
                return resolve({success:'true'});
            }else{

              if (params.old_password !== '') {
                if(params.new_password !== params.confirm_password || params.new_password === '' || params.confirm_password === ''){

                    return reject({message: 'New Primary passwords do not match', profile: params})

                }else{

                  promise_query('select password from LandLord where ID = ?', [params.ID])
                  .then(result => {

                    var hash = cryptojs.SHA256(params.old_password).toString(cryptojs.enc.Base64);

                    if(hash != result[0].password){
                        return reject({message: 'Old Primary password incorrect', profile: params});
                    }

                    var new_hash = cryptojs.SHA256(params.new_password).toString(cryptojs.enc.Base64);
                    return promise_query('update LandLord set password = ? where ID = ?', [new_hash, params.ID]);
                  })
                  .catch(error => reject({message: error.message, profile: params}));

                }

              }
              if (params.old_accounting_password !== '') {
                if(params.new_accounting_password !== params.confirm_accounting_password || params.new_accounting_password === '' || params.confirm_accounting_password === ''){

                    return reject({message: 'New Accounting passwords do not match', profile: params})

                }else{

                  promise_query('select accounting_password from LandLord where ID = ?', [params.ID])
                  .then(result => {

                    var hash = cryptojs.SHA256(params.old_accounting_password).toString(cryptojs.enc.Base64);

                    if(hash != result[0].accounting_password){
                        return reject({message: 'Old Accounting password incorrect', profile: params});
                    }

                    var new_hash = cryptojs.SHA256(params.new_accounting_password).toString(cryptojs.enc.Base64);
                    return promise_query('update LandLord set accounting_password = ? where ID = ?', [new_hash, params.ID]);
                  })
                  .catch(error => reject({message: error.message, profile: params}));

                }

              }
              if (params.old_maintenance_password !== '') {
                if(params.new_maintenance_password !== params.confirm_maintenance_password || params.new_maintenance_password === '' || params.confirm_maintenance_password === ''){

                    return reject({message: 'New Maintenance passwords do not match', profile: params})

                }else{

                  promise_query('select maintenance_password from LandLord where ID = ?', [params.ID])
                  .then(result => {

                    var hash = cryptojs.SHA256(params.old_maintenance_password).toString(cryptojs.enc.Base64);

                    if(hash != result[0].maintenance_password){
                        return reject({message: 'Maintenance password incorrect', profile: params});
                    }

                    var new_hash = cryptojs.SHA256(params.new_maintenance_password).toString(cryptojs.enc.Base64);
                    return promise_query('update LandLord set maintenance_password = ? where ID = ?', [new_hash, params.ID]);
                  })
                  .catch(error => reject({message: error.message, profile: params}));

                }

              }
              if (params.old_management_password !== '') {
                if(params.new_management_password !== params.confirm_management_password || params.new_management_password === '' || params.confirm_management_password === ''){

                    return reject({message: 'New Management passwords do not match', profile: params})

                }else{

                  promise_query('select management_password from LandLord where ID = ?', [params.ID])
                  .then(result => {

                    var hash = cryptojs.SHA256(params.old_management_password).toString(cryptojs.enc.Base64);

                    if(hash != result[0].management_password){
                        return reject({message: 'Maintenance password incorrect', profile: params});
                    }

                    var new_hash = cryptojs.SHA256(params.new_management_password).toString(cryptojs.enc.Base64);
                    return promise_query('update LandLord set management_password = ? where ID = ?', [new_hash, params.ID]);
                  })
                  .catch(error => reject({message: error.message, profile: params}));

                }

              }

              if (params.old_secondary_password !== '') {

                if(params.new_secondary_password !== params.confirm_secondary_password ||
                  params.new_secondary_password === '' || params.confirm_secondary_password === ''){

                    return reject({message: 'New Secondary passwords do not match', profile: params})

                }else{

                  promise_query('select secondary_password from LandLord where ID = ?', [params.ID])
                  .then(result => {

                    var hash = cryptojs.SHA256(params.old_secondary_password).toString(cryptojs.enc.Base64);

                    if(hash != result[0].secondary_password){
                        return reject({message: 'Secondary password incorrect', profile: params});
                    }

                    var new_hash = cryptojs.SHA256(params.new_secondary_password).toString(cryptojs.enc.Base64);
                    return promise_query('update LandLord set secondary_password = ? where ID = ?', [new_hash, params.ID]);
                  })
                  .catch(error => reject({message: error.message, profile: params}));

                }

              }

            }


        })
        .then(result => resolve({success:'true'}))
        .catch(error => reject({message: error.message, profile: params}));

    });
};
