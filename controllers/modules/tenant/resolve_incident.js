var promise_query = require('../utils/promise_connection');
var messenger = require('../utils/messenger');

module.exports = (params) => {
    return new Promise((resolve, reject) => {

        promise_query('update ServiceRequest set status = ?, labour_cost = ?, supply_cost = ?, vat = ?, total_cost = ?, date_resolved = ? where ID = ?', ['resolved', params.labour_cost, params.supply_cost, params.vat,(parseFloat(params.labour_cost) + parseFloat(params.supply_cost) + parseFloat(params.vat)), params.date, params.service_request_id])
        .then(result => {
          var expenses = [];

          if (params.labour_cost.length > 0) {
            expenses.push([
              params.listing_id,
              'Labour SR #'+ params.service_request_id,
              params.labour_cost,
              'service',
              params.date
            ]);
          }
          if (params.supply_cost.length > 0) {
            expenses.push([
              params.listing_id,
              'Supply SR #'+ params.service_request_id,
              params.supply_cost,
              'service',
              params.date
            ]);
          }
          if (params.vat.length > 0) {
            expenses.push([
              params.listing_id,
              'VAT SR #'+ params.service_request_id,
              params.vat,
              'service',
              params.date
            ]);
          }

          return promise_query('insert into Expense(ListingID, description, amount, type, date_recorded) values ?', [expenses]);
        })
        .then(result => messenger.mail({
            from: process.env.MAILER_ADDRESS,
            to:params.email,
            subject:'MRSP - Incident Resolved',
            text: 'The following issue has been marked as resolved: \"' + params.title + '\"'
        }))
        .then(result => resolve({success: 'true'}))
        .catch(error => reject({success: 'false', message: error.message}));

    });
}
