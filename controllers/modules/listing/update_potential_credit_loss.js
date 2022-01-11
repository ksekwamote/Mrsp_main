var promise_query = require('../utils/promise_connection');

module.exports = (params) => {

    return new Promise((resolve, reject) => {

        promise_query('update Listing set potential_credit_loss = ? where ID = ?', [params.potential_credit_loss, params.listing_id])
        .then(result => {
            console.log(result);
            return resolve();
        })
        .catch(error => reject({message: error.message}));


    });

};
