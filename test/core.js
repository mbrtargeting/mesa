/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const mesa = require('../lib/mesa');

module.exports = {

  'user-added method is called with correct `this` value'(test) {
    const query = Object.create(mesa);
    query.attached = function() {
      test.equal(this, query);
      return test.done();
    };

    return query.attached();
  },

  'user-added method is copied and can be chained'(test) {
    const table = mesa.table('user');
    let thisInFoo = null;
    table.foo = function() {
      thisInFoo = this;
      return this;
    };
    const rightBeforeCallToFoo = table
      .allow('a', 'b')
      .where({c: 3});

    rightBeforeCallToFoo
      .foo()
      .order('id DESC');

    test.equal(rightBeforeCallToFoo, thisInFoo);
    return test.done();
  },

  'the correct properties (only own) are copied'(test) {
    test.deepEqual(Object.getOwnPropertyNames(mesa), [
      '_queueBeforeEachInsert',
      '_queueBeforeEachUpdate'
    ]);

    const userTable = mesa.table('user');
    test.deepEqual(Object.getOwnPropertyNames(userTable), [
      '_queueBeforeEachInsert',
      '_queueBeforeEachUpdate',
      '_mohair'
    ]);

    userTable.userAddedMethod = function() {};

    test.deepEqual(Object.getOwnPropertyNames(userTable.debug(console.log)), [
      '_queueBeforeEachInsert',
      '_queueBeforeEachUpdate',
      '_mohair',
      'userAddedMethod',
      '_debug'
    ]);

    return test.done();
  },

  'queueBeforeEachInsert is called with correct `this` value'(test) {
    test.expect(1);

    const mockConnection = {
      query(sql, params, cb) {
        return cb(null, {rows: []});
      }
    };
    var query = mesa
      .table('user')
      .setConnection(mockConnection)
      .allow(['a'])
      .queueBeforeEachInsert(function(data) {
        test.equal(this, query);
        return data;
    });

    return query.insert({a: 1}).then(() => test.done());
  },

  'queueBeforeEachInsert is called with correct default args and `this` value'(test) {
    test.expect(3);

    const mockConnection = {
      query(sql, params, cb) {
        return cb(null, {rows: []});
      }
    };
    var query = mesa
      .table('user')
      .setConnection(mockConnection)
      .allow(['a'])
      .queueBeforeEachInsert((function(data, arg2, arg3) {
          test.equal(this, query);
          test.equal(arg2, 'arg2');
          test.equal(arg3, 'arg3');
          return data;
      }), 'arg2', 'arg3');

    return query.insert({a: 1}).then(() => test.done());
  },

  '.call(f) is called with correct default args and `this` value'(test) {
    test.expect(2);

    const f = function(x) {
      test.equal(this, mesa);
      test.equal(x, 'x');
      return this;
    };

    mesa.call(f, 'x');

    return test.done();
  },

  '.when(...) with false'(test) {
    const f = () => test.ok(false);
    mesa.when((1 === 2), f);
    return test.done();
  },

  '.when(...) with true is called with correct default args and `this` value'(test) {
    test.expect(3);
    const f = function(arg1, arg2) {
      test.equal(this, mesa);
      test.equal(arg1, 1);
      test.equal(arg2, 2);
      return this;
    };
    mesa
      .when((2 === 2), f, 1, 2);
    return test.done();
  },

  '.when(...) with true and .where()'(test) {
    const query = mesa
      .when(true, mesa.where, 'a BETWEEN ? AND ?', 1, 10);

    test.equal(query.sql(), 'SELECT * WHERE a BETWEEN ? AND ?');
    test.deepEqual(query.params(), [1, 10]);

    return test.done();
  },

  '.each() with empty array'(test) {
    const query = mesa.each([], () => test.ok(false));
    test.equal(query, mesa);
    return test.done();
  },

  '.each() with object'(test) {
    const query = mesa.each({a: 1, b: 2, c: 3}, function(value, key) {
      const condition = {};
      condition[key] = value;
      return this.where(condition);
    });
    test.equal(query.sql(), 'SELECT * WHERE ("a" = ?) AND ("b" = ?) AND ("c" = ?)');
    test.deepEqual(query.params(), [1, 2, 3]);
    return test.done();
  },

  'getTable'(test) {
    test.equal('user', mesa.table('user').getTable());
    return test.done();
  },

  'isInstance'(test) {
    test.ok(mesa.isInstance(mesa));
    test.ok(mesa.isInstance(mesa.table('user')));
    test.ok(mesa.isInstance(mesa.table('user').where({id: 3})));
    test.ok(!mesa.isInstance({}));
    return test.done();
  },

  'the entire mohair interface is exposed and working'(test) {
    // TODO
    return test.done();
  }
};
