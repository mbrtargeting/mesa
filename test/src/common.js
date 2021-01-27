/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird');

const path = require('path');
const child_process = Promise.promisifyAll(require('child_process'));
const fs = Promise.promisifyAll(require('fs'));

const pg = require('pg');

const mesa = require('../../lib/mesa');

//##################################################################################
// exports

module.exports = {
  mesa: mesa.setConnection(cb => pg.connect(process.env.DATABASE_URL, cb)),
    // .debug (args...) -> console.log args[...3]...

  spy(inner) {
    if (inner == null) { inner = function() {}; }
    var spy = function(...args) {
      spy.calls.push(args);
      return inner(spy.calls, ...Array.from(args));
    };
    spy.calls = [];
    return spy;
  },

  pgDestroyPool(config) {
    const poolKey = JSON.stringify(config);
    console.log('pgDestroyPool');
    console.log('Object.keys(pg.pools.all)', Object.keys(pg.pools.all));
    console.log('poolKey', poolKey);
    const pool = pg.pools.all[poolKey];
    console.log('pool?', (pool != null));
    if (pool != null) {
      return new Promise((resolve, reject) => pool.drain(() => // https://github.com/coopernurse/node-pool#step-3---drain-pool-during-shutdown-optional
      pool.destroyAllNow(function() {
        delete pg.pools.all[poolKey];
        return resolve();
      })));
    } else {
      return Promise.resolve();
    }
  },

  setup(done) {
    console.log('setUp', 'BEGIN');
    console.log('setUp', 'drop database');

    const readSchema = fs.readFileAsync(
      path.resolve(__dirname, 'schema.sql'),
      {encoding: 'utf8'}
    );
    return Promise.join(readSchema, function(schema) {
        console.log('setUp', 'migrate schema');
        return module.exports.mesa.query(schema);
  }).then(function() {
        console.log('setUp', 'END');
        return (typeof done === 'function' ? done() : undefined);
    });
  },

  teardown(done) {
    console.log('tearDown', 'BEGIN');
    console.log('tearDown', 'destroy pool');

    return module.exports.pgDestroyPool(process.env.DATABASE_URL)
      .then(function() {
        console.log('tearDown', 'drop database');
        return (typeof done === 'function' ? done() : undefined);
    });
  }
};
