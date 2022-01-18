const promise_query = require("../utils/promise_connection");


module.exports = (params) => {

    return new Promise((resolve, reject) => {

        console.log(params)
        promise_query(`update RentalPreset set due_day =  ${params.due_date}`)
        .then(res => console.log(res))
        .then(() => resolve({success: true}))
        .catch((err)=> reject({error:err}))
    })

}

module.exports.getInvoiceDate = () => {
    return new Promise((resolve, reject) => {
        promise_query('select * from RentalPreset limit 1')
        .then((res) => resolve(res))
        .catch((err)=> reject({error:err}))
    })
}