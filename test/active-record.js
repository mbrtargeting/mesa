/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {setup, mesa} = require('./src/common');

const {Person} = require('../example/active-record')(mesa);

module.exports = {
  setUp: setup,
  tearDown: (done) => done(),

  'instance lifecycle'(test) {
    const person = new Person({
      name: 'Jake Gyllenhaal',
    });

    return person.save().then(function() {
      test.ok(person.id != null);
      return test.done();
    });
  },
};
