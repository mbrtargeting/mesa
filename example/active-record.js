/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash');

// camelToSnake('camelCase') returns 'camel_case'
const camelToSnake = string => string.replace(/([a-z][A-Z])/g, m => m[0] + '_' + m[1].toLowerCase());

// snakeToCamel('snake_case') returns 'snakeCase'
const snakeToCamel = string => string.replace(/_([a-z])/g, m => m[1].toUpperCase());

const mapKeys = function(object, f) {
  const result = {};
  Object.keys(object).forEach(key => result[f(key)] = object[key]);
  return result;
};

const snakeToCamelObject = snake => mapKeys(snake, snakeToCamel);
const camelToSnakeObject = camel => mapKeys(camel, camelToSnake);

//###############################################################################
// record

// constructor
const Record = function(data) {
  return _.assign(this, data);
};

// instance methods
Record.prototype = {
  save() {
    const that = this;
    if (this.id != null) {
      return this._table
        .where({id: this.id})
        .returnFirst()
        .update(this)
        .then(function(data) {
          _.assign(that, data);
          return that;
      });
    } else {
      return this._table
        .insert(this)
        .then(function(data) {
          _.assign(that, data);
          return that;
      });
    }
  },
  delete() {
    const that = this;
    return this._table
      .where({id: this.id})
      .delete()
      .then(() => delete that.id);
  },
  load() {
    const that = this;
    return this._table
      .where({id: this.id})
      .first()
      .then(data => _.assign(that, data));
  }
};

//###############################################################################
// movie

const Movie = function(data) {
  return Record.call(this, data);
};

Movie.prototype = Object.create(Record.prototype);

_.assign(Movie.prototype,
  {name() {}});

//###############################################################################
// person

const Person = function(data) {
  return Record.call(this, data);
};

Person.prototype = Object.create(Record.prototype);

_.assign(Person.prototype,
  {name() {}});

//###############################################################################
// export factory

module.exports = function(mesa) {
  const result = {};

  result.Movie = function(data) { return Movie.call(this, data); };
  result.Movie.prototype = Object.create(Movie.prototype);

  const mesaForActiveRecord = mesa
    .queueBeforeEach(camelToSnakeObject)
    .queueAfterEach(snakeToCamelObject);

  const movieTable = mesaForActiveRecord
    .table('movie')
    .allow('name')
    .queueAfterEach(data => new result.Movie(data));

  const personTable = mesaForActiveRecord
    .table('person')
    .allow('name')
    .queueAfterEach(data => new result.Person(data));

  result.Person = function(data) { return Person.call(this, data); };
  result.Person.prototype = Object.create(Person.prototype);

  // make all instances share the same table property
  result.Movie.prototype._table = movieTable;
  result.Person.prototype._table = personTable;

  // static methods

  _.assign(result.Movie, {
    getWhereName(name) {
      return movieTable.where({name}).first();
    },

    getWhereNameMatches(name) {
      return movieTable.where({name}).first();
    },

    getWhereId(id) {
      return movieTable.where({id}).first();
    },

    all() {
      return movieTable.find();
    },

    starring(nameOrId) {
      return Person.getWhereName(actorName)(function() {});
    }
  }
  );

  return result;
};
