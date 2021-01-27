/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird');

let {setup, teardown, mesa} = require('./src/common');

module.exports = {

  'adding to queueBeforeInsert works correctly'(test) {
    let instance = mesa;

    const beforeInsert = function() {};
    instance = instance.queueBeforeInsert(beforeInsert);
    test.equal(instance._queueBeforeInsert.length, 1);
    test.equal(instance._queueBeforeInsert[0], beforeInsert);

    test.ok((instance._queueBeforeUpdate == null));
    test.ok((instance.queueBeforeUpdate == null));

    return test.done();
  },

  'adding to queueBeforeEach* works correctly'(test) {
    let instance = mesa;

    test.equal(instance._queueBeforeEachInsert.length, 1);
    test.equal(instance._queueBeforeEachUpdate.length, 1);
    test.equal(instance._queueBeforeEachInsert[0], mesa.pickAllowed);
    test.equal(instance._queueBeforeEachUpdate[0], mesa.pickAllowed);

    const beforeEachInsert = function() {};
    instance = instance.queueBeforeEachInsert(beforeEachInsert);
    test.equal(instance._queueBeforeEachInsert.length, 2);
    test.equal(instance._queueBeforeEachInsert[1], beforeEachInsert);

    const beforeEachUpdate = function() {};
    instance = instance.queueBeforeEachUpdate(beforeEachUpdate);
    test.equal(instance._queueBeforeEachUpdate.length, 2);
    test.equal(instance._queueBeforeEachUpdate[1], beforeEachUpdate);

    const beforeEach = function() {};
    instance = instance.queueBeforeEach(beforeEach);
    test.equal(instance._queueBeforeEachInsert.length, 3);
    test.equal(instance._queueBeforeEachInsert[2], beforeEach);
    test.equal(instance._queueBeforeEachUpdate.length, 3);
    test.equal(instance._queueBeforeEachUpdate[2], beforeEach);

    return test.done();
  },

  'adding to queueAfter* works correctly'(test) {
    let instance = mesa;

    const after = function() {};
    instance = instance.queueAfter(after);
    test.equal(instance._queueAfterSelect.length, 1);
    test.equal(instance._queueAfterSelect[0], after);
    test.equal(instance._queueAfterInsert.length, 1);
    test.equal(instance._queueAfterInsert[0], after);
    test.equal(instance._queueAfterUpdate.length, 1);
    test.equal(instance._queueAfterUpdate[0], after);
    test.equal(instance._queueAfterDelete.length, 1);
    test.equal(instance._queueAfterDelete[0], after);

    const afterSelect = function() {};
    instance = instance.queueAfterSelect(afterSelect);
    test.equal(instance._queueAfterSelect.length, 2);
    test.equal(instance._queueAfterSelect[1], afterSelect);

    const afterInsert = function() {};
    instance = instance.queueAfterInsert(afterInsert);
    test.equal(instance._queueAfterInsert.length, 2);
    test.equal(instance._queueAfterInsert[1], afterInsert);

    const afterUpdate = function() {};
    instance = instance.queueAfterUpdate(afterUpdate);
    test.equal(instance._queueAfterUpdate.length, 2);
    test.equal(instance._queueAfterUpdate[1], afterUpdate);

    const afterDelete = function() {};
    instance = instance.queueAfterDelete(afterDelete);
    test.equal(instance._queueAfterDelete.length, 2);
    test.equal(instance._queueAfterDelete[1], afterDelete);

    return test.done();
  },

  'adding to queueAfterEach* works correctly'(test) {
    let instance = mesa;

    const after = function() {};
    instance = instance.queueAfterEach(after);
    test.equal(instance._queueAfterEachSelect.length, 1);
    test.equal(instance._queueAfterEachSelect[0], after);
    test.equal(instance._queueAfterEachInsert.length, 1);
    test.equal(instance._queueAfterEachInsert[0], after);
    test.equal(instance._queueAfterEachUpdate.length, 1);
    test.equal(instance._queueAfterEachUpdate[0], after);
    test.equal(instance._queueAfterEachDelete.length, 1);
    test.equal(instance._queueAfterEachDelete[0], after);

    const afterSelect = function() {};
    instance = instance.queueAfterEachSelect(afterSelect);
    test.equal(instance._queueAfterEachSelect.length, 2);
    test.equal(instance._queueAfterEachSelect[1], afterSelect);

    const afterInsert = function() {};
    instance = instance.queueAfterEachInsert(afterInsert);
    test.equal(instance._queueAfterEachInsert.length, 2);
    test.equal(instance._queueAfterEachInsert[1], afterInsert);

    const afterUpdate = function() {};
    instance = instance.queueAfterEachUpdate(afterUpdate);
    test.equal(instance._queueAfterEachUpdate.length, 2);
    test.equal(instance._queueAfterEachUpdate[1], afterUpdate);

    const afterDelete = function() {};
    instance = instance.queueAfterEachDelete(afterDelete);
    test.equal(instance._queueAfterEachDelete.length, 2);
    test.equal(instance._queueAfterEachDelete[1], afterDelete);

    return test.done();
  },

  'queues are executed correctly for insert'(test) {
    test.expect(27);
    const input1 = {};
    const input2 = {};
    const input3 = {};
    const input4 = {a: 1, b: 2, c: 3};

    const output1 = {};
    const output2 = {};
    const output3 = {};
    const output4 = {};

    const row = {};
    const rows = [row];
    const results =
      {rows};

    mesa = Object.create(mesa);
    mesa.query = function(fragment) {
      test.equal(fragment.sql(), 'INSERT INTO "movie"("a", "b", "c") VALUES (?, ?, ?) RETURNING *');
      test.deepEqual(fragment.params(), [1, 2, 3]);
      return Promise.resolve(results);
    };

    return mesa
      .table('movie')
      .unsafe()
      .queueBeforeInsert((function(arg1, arg2, arg3) {
        test.equal(arg1.length, 1);
        test.equal(arg1[0], input1);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return [input2];
      }), 'arg2', 'arg3')
      .queueBeforeEachInsert((function(arg1, arg2, arg3) {
        test.equal(arg1, input2);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return Promise.resolve(input3);
      }), 'arg2', 'arg3')
      .queueBeforeEach((function(arg1, arg2, arg3) {
        test.equal(arg1, input3);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return input4;
      }), 'arg2', 'arg3')
      .queueAfter((function(arg1, arg2, arg3) {
        test.equal(arg1, rows);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return Promise.resolve([output1]);
      }), 'arg2', 'arg3')
      .queueAfterInsert((function(arg1, arg2, arg3) {
        test.equal(arg1.length, 1);
        test.equal(arg1[0], output1);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return [output2];
      }), 'arg2', 'arg3')
      .queueAfterEach((function(arg1, arg2, arg3) {
        test.equal(arg1, output2);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return output3;
      }), 'arg2', 'arg3')
      .queueAfterEachInsert((function(arg1, arg2, arg3) {
        test.equal(arg1, output3);
        test.equal(arg2, 'arg2');
        test.equal(arg3, 'arg3');
        return output4;
      }), 'arg2', 'arg3')
      .insert([input1])
      .then(function(outputs) {
        test.equal(outputs.length, 1);
        test.equal(outputs[0], output4);
        return test.done();
    });
  },

  'queues are executed correctly for update'(test) {
    test.expect(11);
    const input1 = {};
    const input2 = {};
    const input3 = {a: 1, b: 2, c: 3};

    const output1 = {};
    const output2 = {};
    const output3 = {};
    const output4 = {};

    const row = {};
    const rows = [row];
    const results =
      {rows};

    mesa = Object.create(mesa);
    mesa.query = function(fragment) {
      test.equal(fragment.sql(), 'UPDATE "movie" SET "a" = ?, "b" = ?, "c" = ? RETURNING *');
      test.deepEqual(fragment.params(), [1, 2, 3]);
      return Promise.resolve(results);
    };

    return mesa
      .table('movie')
      .unsafe()
      .queueBeforeEachUpdate((function(arg1) {
        test.equal(arg1, input1);
        return Promise.resolve(input2);
      })).queueBeforeEach((function(arg1) {
        test.equal(arg1, input2);
        return input3;
      })).queueAfter((function(arg1) {
        test.equal(arg1, rows);
        return Promise.resolve([output1]);
      })).queueAfterUpdate((function(arg1) {
        test.equal(arg1.length, 1);
        test.equal(arg1[0], output1);
        return [output2];
      })).queueAfterEach((function(arg1) {
        test.equal(arg1, output2);
        return output3;
      })).queueAfterEachUpdate((function(arg1) {
        test.equal(arg1, output3);
        return output4;
      })).update(input1)
      .then(function(outputs) {
        test.equal(outputs.length, 1);
        test.equal(outputs[0], output4);
        return test.done();
    });
  },

  'queues are executed correctly for select'(test) {
    test.expect(9);

    const output1 = {};
    const output2 = {};
    const output3 = {};
    const output4 = {};

    const row = {};
    const rows = [row];
    const results =
      {rows};

    mesa = Object.create(mesa);
    mesa.query = function(fragment) {
      test.equal(fragment.sql(), 'SELECT * FROM "movie"');
      test.deepEqual(fragment.params(), []);
      return Promise.resolve(results);
    };

    return mesa
      .table('movie')
      .unsafe()
      .queueAfter((function(arg1) {
        test.equal(arg1, rows);
        return Promise.resolve([output1]);
      })).queueAfterSelect((function(arg1) {
        test.equal(arg1.length, 1);
        test.equal(arg1[0], output1);
        return [output2];
      })).queueAfterEach((function(arg1) {
        test.equal(arg1, output2);
        return output3;
      })).queueAfterEachSelect((function(arg1) {
        test.equal(arg1, output3);
        return output4;
      })).find()
      .then(function(outputs) {
        test.equal(outputs.length, 1);
        test.equal(outputs[0], output4);
        return test.done();
    });
  },

  'queues are executed correctly for delete'(test) {
    test.expect(8);

    const output1 = {};
    const output2 = {};
    const output3 = {};
    const output4 = {};

    const row = {};
    const rows = [row];
    const results =
      {rows};

    mesa = Object.create(mesa);
    mesa.query = function(fragment) {
      test.equal(fragment.sql(), 'DELETE FROM "movie" RETURNING *');
      test.deepEqual(fragment.params(), []);
      return Promise.resolve(results);
    };

    return mesa
      .table('movie')
      .unsafe()
      .queueAfter((function(arg1) {
        test.equal(arg1, rows);
        return Promise.resolve([output1]);
      })).queueAfterDelete((function(arg1) {
        test.equal(arg1.length, 1);
        test.equal(arg1[0], output1);
        return [output2];
      })).queueAfterEach((function(arg1) {
        test.equal(arg1, output2);
        return output3;
      })).queueAfterEachDelete((function(arg1) {
        test.equal(arg1, output3);
        return output4;
      })).returnFirst()
      .delete()
      .then(function(output) {
        test.equal(output, output4);
        return test.done();
    });
  }
};
