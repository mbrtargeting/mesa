/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird');

const path = require('path');
const fs = Promise.promisifyAll(require('fs'));

const {Pool} = require('pg');

const mesa = require('../../lib/mesa');

// exports

module.exports = {

  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  mesa: mesa.setConnection((cb) => module.exports.pool.connect(cb)),
  // .debug (args...) -> console.log args[...3]...

  spy(inner) {
    if (inner == null) {
      inner = function() {};
    }
    const spy = function(...args) {
      spy.calls.push(args);
      return inner(spy.calls, ...Array.from(args));
    };
    spy.calls = [];
    return spy;
  },

  setup(done) {
    const readSchema = fs.readFileAsync(path.resolve(__dirname, 'schema.sql'), {
      encoding: 'utf8',
    });
    return Promise.join(readSchema, function(schema) {
      return module.exports.mesa.query(schema);
    }).then(function() {
      console.log('', '(setup done)');
      return typeof done === 'function' ? done() : undefined;
    });
  },

};
