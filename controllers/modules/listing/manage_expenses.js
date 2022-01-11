var promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    switch (params.action) {
      case "add":
        for (let i = 0; i < params.expenses.length; i++) {
          promise_query("insert into expense set ?", params.expenses[i])
            .then((result) => resolve({ success: true }))
            .catch((error) => reject(error));
        }
        break;
      case "edit":
        promise_query(
          "update Expense set description = ?, amount =?, type=?, date_recorded = ? where ID = ?",
          [
            params.expense.description,
            params.expense.amount,
            params.expense.type,
            params.date_recorded,
            params.expense_id,
          ]
        )
          .then((result) => resolve({ success: true }))
          .catch((error) => reject(error));
        break;
      case "delete":
        promise_query("delete from Expense where ID = ?", [params.expense_id])
          .then((result) => resolve({ success: true }))
          .catch((error) => reject(error));
        break;

      default:
        return reject({ message: "invalid action" });
    }
  });
};
