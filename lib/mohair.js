/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash');
const criterion = require('./criterion');

// pull in some helpers from criterion

// TODO put this directly on criterion
const {implementsSqlFragmentInterface} = criterion.helper;

// PROTOTYPES & FACTORIES

// prototype objects for the action-objects that represent sql actions.
// sql actions are: select, insert, update and delete.
// action-objects store just the state specific to that action.
// the rest is stored in mohair itself.

const prototypes = {};

// factory functions that make action-objects by prototypically
// inheriting from the prototypes.
// try to catch errors in the factory functions.

const factories = {};

// PARTIALS

// items joined by a separator character

prototypes.joinedItems = {
  sql(escape) {
    const parts = [];
    this._items.forEach(function(item) {
      if (implementsSqlFragmentInterface(item)) {
        // sql fragment
        let itemSql = item.sql(escape);
        if (!item.dontWrap) {
          itemSql = '(' + itemSql + ')';
        }
        return parts.push(itemSql);
      } else {
        // simple string
        return parts.push(item);
      }
    });
    return parts.join(this._join);
  },
  params() {
    let params = [];
    this._items.forEach(function(item) {
      if (implementsSqlFragmentInterface(item)) {
        // sql fragment
        return (params = params.concat(item.params()));
      }
    });
    return params;
  },
  dontWrap: true,
};

factories.joinedItems = (join, ...items) =>
  _.create(prototypes.joinedItems, {
    _join: join,
    _items: _.flatten(items),
  });

// aliases: `table AS alias`

prototypes.aliases = {
  sql(escape) {
    const object = this._object;
    const escapeStringValues = this._escapeStringValues;
    const parts = [];
    Object.keys(object).forEach(function(key) {
      const value = object[key];
      if (implementsSqlFragmentInterface(value)) {
        let valueSql = value.sql(escape);
        if (!value.dontWrap) {
          valueSql = '(' + valueSql + ')';
        }
        return parts.push(valueSql + ' AS ' + escape(key));
      } else {
        return parts.push(
          (escapeStringValues ? escape(value) : value) + ' AS ' + escape(key),
        );
      }
    });
    return parts.join(', ');
  },
  params() {
    const object = this._object;
    let params = [];
    // aliased
    Object.keys(object).forEach(function(key) {
      const value = object[key];
      if (implementsSqlFragmentInterface(value)) {
        return (params = params.concat(value.params()));
      }
    });
    return params;
  },
  dontWrap: true,
};

factories.aliases = function(object, escapeStringValues) {
  if (escapeStringValues == null) {
    escapeStringValues = false;
  }
  if (Object.keys(object).length === 0) {
    throw new Error('alias object must have at least one property');
  }
  return _.create(prototypes.aliases, {
    _object: object,
    _escapeStringValues: escapeStringValues,
  });
};

// select outputs

// plain strings are treated raw and not escaped
// objects are used for aliases

factories.selectOutputs = function(...outputs) {
  if (outputs.length === 0) {
    return criterion('*');
  }

  return factories.joinedItems(
    ', ',
    _.flatten(outputs).map(function(output) {
      if (implementsSqlFragmentInterface(output)) {
        return output;
      } else if ('object' === typeof output) {
        // alias object
        return factories.aliases(output);
      } else {
        // raw strings are not escaped
        return criterion(output);
      }
    }),
  );
};

// from items

factories.fromItems = (...items) =>
  factories.joinedItems(
    ', ',
    _.flatten(items).map(function(item) {
      if (implementsSqlFragmentInterface(item)) {
        return item;
      } else if ('object' === typeof item) {
        // alias object
        const escapeStringValues = true;
        return factories.aliases(item, escapeStringValues);
      } else {
        // strings are interpreted as table names and escaped
        return criterion.escape(item);
      }
    }),
  );

// ACTIONS: select, insert, update, delete

// select

prototypes.select = {
  sql(mohair, escape) {
    let sql = '';

    // common table expression ?
    if (mohair._with != null) {
      sql += 'WITH ';
      let parts = [];
      parts = Object.keys(mohair._with).map(
        (key) =>
          escape(key) + ' AS (' + criterion(mohair._with[key]).sql(escape) + ')',
      );
      sql += parts.join(', ');
      sql += ' ';
    }

    sql += 'SELECT';

    if (mohair._distinct != null) {
      sql += ` DISTINCT ${mohair._distinct}`;
    }

    sql += ' ';

    // what to select
    sql += this._outputs.sql(escape);

    // where to select from:

    // from takes precedence over table
    if (mohair._from != null) {
      sql += ` FROM ${mohair._from.sql(escape)}`;
    } else if (mohair._table != null) {
      sql += ` FROM ${escape(mohair._table)}`;
    }

    mohair._joins.forEach(function(join) {
      sql += ` ${join.sql}`;
      if (join.criterion != null) {
        return (sql += ` AND (${join.criterion.sql(escape)})`);
      }
    });

    // how to modify the select

    if (mohair._where != null) {
      sql += ` WHERE ${mohair._where.sql(escape)}`;
    }
    if (mohair._group != null) {
      sql += ` GROUP BY ${mohair._group.join(', ')}`;
    }
    if (mohair._having != null) {
      sql += ` HAVING ${mohair._having.sql(escape)}`;
    }
    if (mohair._window != null) {
      sql += ` WINDOW ${mohair._window}`;
    }
    if (mohair._order != null) {
      sql += ` ORDER BY ${mohair._order.join(', ')}`;
    }
    if (mohair._limit != null) {
      sql += ' LIMIT ';
      if (implementsSqlFragmentInterface(mohair._limit)) {
        sql += mohair._limit.sql(escape);
      } else {
        sql += '?';
      }
    }
    if (mohair._offset != null) {
      sql += ' OFFSET ';
      if (implementsSqlFragmentInterface(mohair._offset)) {
        sql += mohair._offset.sql(escape);
      } else {
        sql += '?';
      }
    }
    if (mohair._for != null) {
      sql += ` FOR ${mohair._for}`;
    }

    // combination with other queries ?

    if (mohair._combinations != null) {
      mohair._combinations.forEach(
        (combination) =>
          (sql += ` ${combination.operator} ${combination.query.sql(escape)}`),
      );
    }

    return sql;
  },

  params(mohair) {
    let params = [];

    if (mohair._with != null) {
      Object.keys(mohair._with).forEach(
        (key) => (params = params.concat(criterion(mohair._with[key]).params())),
      );
    }

    params = params.concat(this._outputs.params());

    if (mohair._from != null) {
      params = params.concat(mohair._from.params());
    }

    mohair._joins.forEach(function(join) {
      if (join.criterion != null) {
        return (params = params.concat(join.criterion.params()));
      }
    });

    if (mohair._where != null) {
      params = params.concat(mohair._where.params());
    }
    if (mohair._having != null) {
      params = params.concat(mohair._having.params());
    }
    if (mohair._limit != null) {
      if (implementsSqlFragmentInterface(mohair._limit)) {
        params = params.concat(mohair._limit.params());
      } else {
        params.push(mohair._limit);
      }
    }
    if (mohair._offset != null) {
      if (implementsSqlFragmentInterface(mohair._offset)) {
        params = params.concat(mohair._offset.params());
      } else {
        params.push(mohair._offset);
      }
    }

    if (mohair._combinations != null) {
      mohair._combinations.forEach(
        (combination) => (params = params.concat(combination.query.params())),
      );
    }

    return params;
  },
};

factories.select = (...outputs) =>
  _.create(prototypes.select, {
    _outputs: factories.selectOutputs(...Array.from(outputs || [])),
  });

// insert

prototypes.insert = {
  sql(mohair, escape) {
    if (mohair._table == null) {
      throw new Error(
        '.sql() of insert action requires call to .table() before it',
      );
    }

    if (mohair._from != null) {
      throw new Error(
        '.sql() of insert action ignores and does not allow call to .from() before it',
      );
    }

    const table = escape(mohair._table);

    const records = this._records;

    const keys = Object.keys(records[0]);

    const escapedKeys = keys.map(escape);

    const rows = records.map(function(record) {
      const row = keys.map(function(key) {
        if (implementsSqlFragmentInterface(record[key])) {
          return record[key].sql(escape);
        } else {
          return '?';
        }
      });
      return `(${row.join(', ')})`;
    });

    let sql = `INSERT INTO ${table}(${escapedKeys.join(
      ', ',
    )}) VALUES ${rows.join(', ')}`;

    if (mohair._returning != null) {
      sql += ` RETURNING ${mohair._returning.sql(escape)}`;
    }

    return sql;
  },

  params(mohair) {
    const records = this._records;

    const keys = Object.keys(records[0]);

    let params = [];

    records.forEach((record) =>
      keys.forEach(function(key) {
        if (implementsSqlFragmentInterface(record[key])) {
          return (params = params.concat(record[key].params()));
        } else {
          return params.push(record[key]);
        }
      }),
    );

    if (mohair._returning != null) {
      params = params.concat(mohair._returning.params());
    }

    return params;
  },
};

factories.insert = function(recordOrRecords) {
  if (Array.isArray(recordOrRecords)) {
    if (recordOrRecords.length === 0) {
      throw new Error('array argument is empty - no records to insert');
    }

    const msg = 'all records in the array argument must have the same keys.';
    const keysOfFirstRecord = Object.keys(recordOrRecords[0]);
    if (keysOfFirstRecord.length === 0) {
      throw new Error('can\'t insert empty object');
    }
    recordOrRecords.forEach(function(record) {
      const keys = Object.keys(record);
      if (keys.length !== keysOfFirstRecord.length) {
        throw new Error(msg);
      }

      return keysOfFirstRecord.forEach(function(key) {
        const value = record[key];
        // null values are allowed !
        if (value == null && record[key] !== null) {
          throw new Error(msg);
        }
      });
    });

    return _.create(prototypes.insert, {_records: recordOrRecords});
  }

  if ('object' === typeof recordOrRecords) {
    if (Object.keys(recordOrRecords).length === 0) {
      throw new Error('can\'t insert empty object');
    }
    return _.create(prototypes.insert, {_records: [recordOrRecords]});
  }

  throw new TypeError('argument must be an object or an array');
};

// update

prototypes.update = {
  sql(mohair, escape) {
    const updates = this._updates;

    if (mohair._table == null) {
      throw new Error(
        '.sql() of update action requires call to .table() before it',
      );
    }

    const table = escape(mohair._table);
    const keys = Object.keys(updates);

    const updatesSql = keys.map(function(key) {
      const escapedKey = escape(key);
      if (implementsSqlFragmentInterface(updates[key])) {
        return `${escapedKey} = ${updates[key].sql(escape)}`;
      } else {
        return `${escapedKey} = ?`;
      }
    });

    let sql = `UPDATE ${table} SET ${updatesSql.join(', ')}`;
    if (mohair._from != null) {
      sql += ` FROM ${mohair._from.sql(escape)}`;
    }
    if (mohair._where != null) {
      sql += ` WHERE ${mohair._where.sql(escape)}`;
    }
    if (mohair._returning != null) {
      sql += ` RETURNING ${mohair._returning.sql(escape)}`;
    }
    return sql;
  },

  params(mohair) {
    const updates = this._updates;

    let params = [];

    Object.keys(updates).forEach(function(key) {
      const value = updates[key];
      if (implementsSqlFragmentInterface(value)) {
        return (params = params.concat(value.params()));
      } else {
        return params.push(value);
      }
    });

    if (mohair._from != null) {
      params = params.concat(mohair._from.params());
    }

    if (mohair._where != null) {
      params = params.concat(mohair._where.params());
    }
    if (mohair._returning != null) {
      params = params.concat(mohair._returning.params());
    }

    return params;
  },
};

factories.update = function(updates) {
  if (Object.keys(updates).length === 0) {
    throw new Error('nothing to update');
  }
  return _.create(prototypes.update, {_updates: updates});
};

// delete

prototypes.delete = {
  sql(mohair, escape) {
    if (mohair._table == null) {
      throw new Error(
        '.sql() of delete action requires call to .table() before it',
      );
    }

    const table = escape(mohair._table);
    let sql = `DELETE FROM ${table}`;
    // from for delete acts as using
    if (mohair._from != null) {
      sql += ` USING ${mohair._from.sql(escape)}`;
    }
    if (mohair._where != null) {
      sql += ` WHERE ${mohair._where.sql(escape)}`;
    }
    if (mohair._returning != null) {
      sql += ` RETURNING ${mohair._returning.sql(escape)}`;
    }
    return sql;
  },

  params(mohair) {
    let params = [];
    if (mohair._from != null) {
      params = params.concat(mohair._from.params());
    }
    if (mohair._where != null) {
      params = params.concat(mohair._where.params());
    }
    if (mohair._returning != null) {
      params = params.concat(mohair._returning.params());
    }
    return params;
  },
};

factories.delete = () => _.create(prototypes.delete);

// MOHAIR FLUENT API

const Mohair = function(source) {
  if (source) {
    // only copy OWN properties.
    // don't copy properties on the prototype.
    // OWN properties are just non-default values and user defined methods.
    // OWN properties tend to be very few for most queries.
    for (const k of Object.keys(source || {})) {
      const v = source[k];
      this[k] = v;
    }
  }
  return this;
};

Mohair.prototype = {
  // core

  fluent(key, value) {
    const next = new Mohair(this);
    next[key] = value;
    return next;
  },

  _escape: _.identity,
  escape(arg) {
    return this.fluent('_escape', arg);
  },

  // the default action is select *
  _action: factories.select('*'),

  // actions

  insert(...args) {
    return this.fluent('_action', factories.insert(...Array.from(args || [])));
  },
  select(...args) {
    return this.fluent('_action', factories.select(...Array.from(args || [])));
  },
  delete() {
    return this.fluent('_action', factories.delete());
  },
  update(data) {
    return this.fluent('_action', factories.update(data));
  },

  // for select action only

  with(arg) {
    if ('object' !== typeof arg || Object.keys(arg).length === 0) {
      throw new Error(
        'with must be called with an object that has at least one property',
      );
    }
    return this.fluent('_with', arg);
  },
  distinct(arg) {
    if (arg == null) {
      arg = '';
    }
    return this.fluent('_distinct', arg);
  },
  group(...args) {
    return this.fluent('_group', args);
  },
  window(arg) {
    return this.fluent('_window', arg);
  },
  order(...args) {
    return this.fluent('_order', args);
  },
  limit(arg) {
    return this.fluent(
      '_limit',
      implementsSqlFragmentInterface(arg) ? arg : parseInt(arg, 10),
    );
  },
  offset(arg) {
    return this.fluent(
      '_offset',
      implementsSqlFragmentInterface(arg) ? arg : parseInt(arg, 10),
    );
  },
  for(arg) {
    return this.fluent('_for', arg);
  },

  // from

  // supports multiple tables, subqueries and aliases
  // from: (from...) ->
  //   @fluent '_from', from...

  getTable() {
    return this._table;
  },

  // table must be a simple string
  table(table) {
    if ('string' !== typeof table) {
      throw new Error(
        'table must be a string. use .from() to call with multiple tables or subqueries.',
      );
    }
    return this.fluent('_table', table);
  },

  from(...args) {
    return this.fluent('_from', factories.fromItems(...Array.from(args || [])));
  },

  _joins: [],
  join(sql, ...criterionArgs) {
    const join = {sql};
    if (criterionArgs.length !== 0) {
      join.criterion = criterion(...Array.from(criterionArgs || []));
    }

    const next = new Mohair(this);
    // slice without arguments clones an array
    next._joins = this._joins.slice();
    next._joins.push(join);

    return next;
  },

  // where conditions

  where(...args) {
    const where = criterion(...Array.from(args || []));
    return this.fluent(
      '_where',
      this._where != null ? this._where.and(where) : where,
    );
  },

  having(...args) {
    const having = criterion(...Array.from(args || []));
    return this.fluent(
      '_having',
      this._having != null ? this._having.and(having) : having,
    );
  },

  // returning (ignored for select)

  returning(...args) {
    // returning can be disabled by calling without arguments
    if (args.length === 0) {
      return this.fluent('_returning', null);
    } else {
      return this.fluent(
        '_returning',
        factories.selectOutputs(...Array.from(args || [])),
      );
    }
  },

  // combining queries (select only)

  _combinations: [],
  combine(query, operator) {
    // slice without arguments clones an array
    const combinations = this._combinations.slice();
    combinations.push({
      query,
      operator,
    });
    return this.fluent('_combinations', combinations);
  },

  union(query) {
    return this.combine(query, 'UNION');
  },
  unionAll(query) {
    return this.combine(query, 'UNION ALL');
  },
  intersect(query) {
    return this.combine(query, 'INTERSECT');
  },
  intersectAll(query) {
    return this.combine(query, 'INTERSECT ALL');
  },
  except(query) {
    return this.combine(query, 'EXCEPT');
  },
  exceptAll(query) {
    return this.combine(query, 'EXCEPT ALL');
  },

  // helpers

  // call a one-off function as if it were part of mohair
  call(fn, ...args) {
    return fn.apply(this, args);
  },

  raw(sql, ...params) {
    return criterion(sql, ...Array.from(params));
  },

  // implementation of sql-fragment interface

  sql(escape) {
    // escape can be passed in to override the escape set on this mohair
    return this._action.sql(this, escape || this._escape);
  },

  params() {
    return this._action.params(this);
  },

  implementsSqlFragmentInterface,
};

// exports

module.exports = new Mohair();
