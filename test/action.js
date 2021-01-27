/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {setup, teardown, mesa, spy} = require('./src/common');

let userTable = mesa.table('user');

module.exports = {

  'setUp': setup,
  'tearDown': teardown,

//###############################################################################
// query

  'query'(test) {
    const debug = spy();
    return mesa
      .debug(debug)
      .query('SELECT * FROM "user"').then(function(results) {
        test.equal(results.rows.length, 6);
        test.equal(debug.calls.length, 4);
        return test.done();
    });
  },

  'query with params'(test) {
    const debug = spy();
    return mesa
      .debug(debug)
      .query('SELECT * FROM "user" WHERE name = ?', ['laura']).then(function(results) {
        test.equal(results.rows.length, 1);
        test.equal(debug.calls.length, 4);
        return test.done();
    });
  },

  'query with sql fragment'(test) {
    const debug = spy();
    const fragment = {
      sql() { return 'SELECT * FROM "user" WHERE name = ?'; },
      params() { return ['laura']; }
    };
    return mesa
      .debug(debug)
      .query(fragment).then(function(results) {
        test.equal(results.rows.length, 1);
        test.equal(debug.calls.length, 4);
        return test.done();
    });
  },

//###############################################################################
// find

  'find'(test) {
    const debug = spy();
    return userTable
      .debug(debug)
      .find()
      .then(function(rows) {
        test.equal(rows.length, 6);
        test.equal(debug.calls.length, 6);
        return test.done();
    });
  },

//###############################################################################
// first

  'first'(test) {
    const debug = spy();
    return userTable
      .debug(debug)
      .where({name: 'audrey'})
      .first()
      .then(function(row) {
        test.equal(row.name, 'audrey');
        test.equal(debug.calls.length, 6);
        return test.done();
    });
  },

//###############################################################################
// exists

  'exists'(test) {
    const debug = spy();
    return userTable
      .debug(debug)
      .where({name: 'audrey'})
      .exists()
      .then(function(exists) {
        test.ok(exists);
        test.equal(debug.calls.length, 4);
        return test.done();
    });
  },

  'not exists'(test) {
    const debug = spy();
    return userTable
      .debug(debug)
      .where({name: 'josie'})
      .exists()
      .then(function(exists) {
        test.ok(!exists);
        test.equal(debug.calls.length, 4);
        return test.done();
    });
  },

//###############################################################################
// insert

  'insert one'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .allow(['name'])
      .insert({name: 'josie'})
      .then(function(row) {
        test.equal(row.name, 'josie');
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

  'insert many'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .allow('name')
      .insert([
        {name: 'josie'},
        {name: 'jake'}
      ])
      .then(function(rows) {
        test.equal(rows.length, 2);
        test.equal(rows[0].name, 'josie');
        test.equal(rows[1].name, 'jake');
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

  'insert unsafe'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .unsafe()
      .insert({name: 'josie'})
      .then(function(row) {
        test.equal(row.name, 'josie');
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

//###############################################################################
// update

  'update with effect'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .allow('name')
      .where({name: 'audrey'})
      .returnFirst()
      .update({name: 'josie'})
      .then(function(row) {
        test.equal(row.name, 'josie');
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

  'update unsafe with effect'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .unsafe()
      .where({name: 'audrey'})
      .update({name: 'josie'})
      .then(function(rows) {
        test.equal(rows.length, 1);
        test.equal(rows[0].name, 'josie');
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

  'update without effect'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .allow('name')
      .where({name: 'josie'})
      .update({name: 'audrey'})
      .then(function(rows) {
        test.equal(rows.length, 0);
        test.equal(debug.calls.length, 8);
        return test.done();
    });
  },

//###############################################################################
// delete

  'delete with effect'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .where({name: 'audrey'})
      .returnFirst()
      .delete()
      .then(function(row) {
        test.equal(row.name, 'audrey');
        test.equal(debug.calls.length, 6);
        return test.done();
    });
  },

  'delete without effect'(test) {
    const debug = spy();

    return userTable
      .debug(debug)
      .where({name: 'josie'})
      .delete()
      .then(function(rows) {
        test.equal(rows.length, 0);
        test.equal(debug.calls.length, 6);
        return test.done();
    });
  },

//###############################################################################
// all actions together

  'all actions together'(test) {

    userTable = mesa
      .table('user')
      .allow(['name']);

    return userTable.insert({name: 'josie'}).bind({})
      .then(function(row) {
        this.insertedRow = row;
        test.equal(this.insertedRow.name, 'josie');
        return userTable.where({name: 'josie'}).find();}).then(function(rows) {
        test.equal(this.insertedRow.id, rows[0].id);
        console.log('@insertedRow', this.insertedRow);
        return userTable
          .where({id: this.insertedRow.id})
          .returnFirst()
          .update({name: 'josie packer'});}).then(function(updatedRow) {
        test.equal(this.insertedRow.id, updatedRow.id);
        test.equal('josie packer', updatedRow.name);
        return userTable
          .where({name: 'josie packer'})
          .first();}).then(function(row) {
        test.equal('josie packer', row.name);
        return userTable
          .where({id: this.insertedRow.id})
          .returnFirst()
          .delete();}).then(function(deletedRow) {
        test.equal(this.insertedRow.id, deletedRow.id);
        return userTable.find();}).then(function(rows) {
        test.equal(rows.length, 6);

        return test.done();
    });
  }
};
