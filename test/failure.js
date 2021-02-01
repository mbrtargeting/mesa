/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const mesa = require('../lib/mesa');

module.exports = {
  'first() with ignored argument'(test) {
    try {
      return mesa.first(1);
    } catch (e) {
      test.equal(
        e.message,
        'you called .first() with an argument but .first() ignores all arguments. .first() returns a promise and maybe you wanted to call that promise instead: .first().then(function(result) { ... })',
      );
      return test.done();
    }
  },

  'insert with no allowed columns'(test) {
    return mesa
      .table('user')
      .insert({a: 1})
      .catch(function(e) {
        test.equal(
          e.message,
          'no columns are allowed. this will make .update() or .insert() fail. call .allow(columns...) with at least one column before .insert() or .update(). alternatively call .unsafe() before to disable mass assignment protection altogether.',
        );
        return test.done();
      });
  },

  'update with no allowed columns'(test) {
    return mesa
      .table('user')
      .update({a: 1})
      .catch(function(e) {
        test.equal(
          e.message,
          'no columns are allowed. this will make .update() or .insert() fail. call .allow(columns...) with at least one column before .insert() or .update(). alternatively call .unsafe() before to disable mass assignment protection altogether.',
        );
        return test.done();
      });
  },

  'setConnection without function or object argument'(test) {
    try {
      return mesa.setConnection(1);
    } catch (e) {
      test.equal(
        e.message,
        '.setConnection() must be called with either a connection object or a function that takes a callback and calls it with a connection',
      );
      return test.done();
    }
  },

  'query with sql fragment and params'(test) {
    const fragment = {
      sql() {
        return 'SELECT * FROM "user" WHERE name = $1';
      },
      params() {
        return ['laura'];
      },
    };
    try {
      return mesa.query(fragment, []);
    } catch (e) {
      test.equal(
        e.message,
        'query with sql fragment as first arg is not allowed to have a second arg',
      );
      return test.done();
    }
  },

  'find without preceeding .setConnection()'(test) {
    return mesa.find().catch(function(e) {
      test.equal(
        e.message,
        'the method you are calling requires a call to .setConnection() before it',
      );
      return test.done();
    });
  },

  'insert without preceeding .setConnection()'(test) {
    return mesa
      .table('user')
      .unsafe()
      .insert({a: 1})
      .catch(function(e) {
        test.equal(
          e.message,
          'the method you are calling requires a call to .setConnection() before it',
        );
        return test.done();
      });
  },

  'no records to insert'(test) {
    try {
      return mesa.table('user').insert();
    } catch (e) {
      test.equal(e.message, 'no records to insert');
      return test.done();
    }
  },

  'empty record after queue'(test) {
    try {
      return (
        mesa
          .table('user')
          // .debug (args...) -> console.log args[...3]...
          .unsafe()
          .queueBeforeEach(function(record) {
            delete record.b;
            return record;
          })
          .insert({a: 1}, {b: 2}, {c: 3})
          .catch(function(e) {
            test.equal(
              e.message,
              'insert would fail because record at index 1 is empty after processing before queue',
            );
            return test.done();
          })
      );
    } catch (error) {}
  },
};
