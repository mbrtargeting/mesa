/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {setup, teardown, mesa, spy} = require('./src/common');

module.exports = {

  'setUp': setup,
  'tearDown': teardown,

  'getConnection'(test) {
    const debug = spy();
    return mesa
      .debug(debug)
      .getConnection()
      .then(function({connection, done}) {
        test.ok(connection != null);
        test.equals(debug.calls.length, 1);
        done();
        test.equals(debug.calls.length, 2);
        return test.done();
    });
  },

  'wrapInTransaction - commit'(test) {
    test.expect(3);
    const debug = spy();
    return mesa
      .debug(debug)
      .wrapInTransaction(
        function(transaction) {
          const withTransaction = mesa.setConnection(transaction);
          return withTransaction
            .query('INSERT INTO "user"(name) VALUES ($1)', ['josie'])
            .then(() => withTransaction.query('SELECT * FROM "user"')).then(results => test.equal(results.rows.length, 7));
      }).then(() => mesa.query('SELECT * FROM "user"').then(function(results) {
      test.equal(results.rows.length, 7);
      test.equal(debug.calls.length, 10);
      return test.done();
    }));
  },

  'wrapInTransaction - rollback'(test) {
    test.expect(3);
    const debug = spy();
    return mesa
      .debug(debug)
      .wrapInTransaction(
        function(transaction) {
          const withTransaction = mesa.setConnection(transaction);
          return withTransaction
            .query('INSERT INTO "user"(name) VALUES ($1)', ['josie'])
            .then(() => withTransaction.query('SELECT * FROM "user"')).then(function(results) {
              test.equal(results.rows.length, 7);
              throw new Error('rollback please');});
      }).catch(function() {
        mesa.query('SELECT * FROM "user"').then(function(results) {
          test.equal(results.rows.length, 6);
          return test.equal(debug.calls.length, 10);
        });
        return test.done();
    });
  }
};
