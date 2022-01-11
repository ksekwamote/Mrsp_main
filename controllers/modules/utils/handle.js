module.exports = (promise) => {
  return promise
    .then((data) => [data, undefined])
    .catch((error) => Promise.resolve([undefined, error]));
};
module.exports.throw = (error, how) => {
  //how:'soft' - log and keep executing.
  if (error) {
    console.log("---------------------------------------------------------");
    console.log(error);
    console.log("---------------------------------------------------------");
    if (!how) throw Exception(error.message);
  }
};
