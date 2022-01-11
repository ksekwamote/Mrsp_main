const query = require('../utils/promise_connection');

const handle = require('../utils/handle');

module.exports = async(params) => {
  if (params.accept === 'true') {

    if (params.confirmed_amount !== params.payment_amount) {
      var new_balance = params.payment_amount - params.confirmed_amount;
      var [update, error] = await handle(query('update Payment set amount = ?, status = ? where ID = ?',[params.confirmed_amount, 'paid', params.payment_id]));

      handle.throw(error);

      var [payment, error] = await handle(query('select * from Payment where ID = ?', [params.payment_id]));
      handle.throw(error);

      var [result, error] = await handle(query('insert into Payment(ActiveTenantID,InvoiceID, description, status, amount, due_date) values (?,?,?,?,?,?)', [payment[0].ActiveTenantID,payment[0].InvoiceID, payment[0].description + ' (balance)', 'late', new_balance, payment[0].due_date]));
      handle.throw(error);

    }else{
      var [update, error] = await handle(query('update Payment set status = ? where ID = ?',['paid', params.payment_id]));

      handle.throw(error);

    }

    var [update, error] = await handle(query('update Transaction set status = ?, confirmation_date = ? where ID = ?', ['approved',params.date, params.transaction_id]));
    handle.throw(error);
  }else{
    var [update, error] = await handle(query('update Transaction set status = ?, confirmation_date = ? where ID = ?', ['declined', params.date, params.transaction_id]));
    handle.throw(error);
  }


  return {success: true};
};
