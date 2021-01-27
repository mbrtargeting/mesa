/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const mohair = require('mohair');
const Promise = require('bluebird');
const _ = require('lodash');

// helpers

const helpers = {};

// escape that handles table schemas correctly:
// schemaAwareEscape('someschema.users') -> '"someschema"."users"
helpers.schemaAwareEscape = (string) =>
  string
    .split('.')
    .map((str) => `\"${str}\"`)
    .join('.');

helpers.defaultMohair = mohair
  .escape(helpers.schemaAwareEscape)
  // return everything by default
  .returning('*');

// TODO better name
helpers.replacePlaceholders = function(sql) {
  // replace ?, ?, ... with $1, $2, ...
  let index = 1;
  return sql.replace(/\?/g, () => '$' + index++);
};

helpers.ignoredArgumentWarning = (receiver) =>
  `you called ${receiver} with an argument but ${receiver} ignores all arguments. ${receiver} returns a promise and maybe you wanted to call that promise instead: ${receiver}.then(function(result) { ... })`;

helpers.normalizeLink = function(leftTable, rightTable, immutableLink) {
  const leftTableName = leftTable.getTable();
  const rightTableName = rightTable.getTable();

  const link = immutableLink != null ? _.clone(immutableLink) : {};

  if (link.forward == null) {
    link.forward = true;
  }
  if (link.first == null) {
    link.first = false;
  }

  if (link.left == null) {
    if (link.forward) {
      // primary key
      link.left = leftTable.getPrimaryKey();
    } else {
      // foreign key
      if (rightTableName == null) {
        // TODO fix error message
        throw new Error(
          'default for embed option `thisKey` requires call to .table(name) on this table',
        );
      }
      link.left = rightTableName + '_' + rightTable.getPrimaryKey();
    }
  }

  if (link.right == null) {
    if (link.forward) {
      // foreign key
      if (leftTableName == null) {
        // TODO fix error message
        throw new Error(
          'default for embed option `otherKey` requires call to .table(name) on other table',
        );
      }
      link.right = leftTableName + '_' + leftTable.getPrimaryKey();
    } else {
      // primary key
      link.right = rightTable.getPrimaryKey();
    }
  }

  if (link.as === true) {
    if (rightTableName == null) {
      // TODO fix error message
      throw new Error(
        'default for embed option `as` requires call to .table(name) on other table',
      );
    }
    link.as = rightTableName;
    if (!link.first) {
      link.as += 's';
    }
  }

  return link;
};

// returns a list of tables with complete links between them
// TODO error handling for malformed argument lists
helpers.normalizeIncludeArguments = function(...args) {
  // some state that will be modified by the loop below
  const normalized = [];
  let leftTable = null;
  let link = null;

  const lastIndex = args.length - 1;

  args.forEach(function(arg, index) {
    if (helpers.isInstance(arg)) {
      if (leftTable != null) {
        // last results are always included
        link = link != null ? _.clone(link) : {};
        if (index === lastIndex) {
          if (link.as == null) {
            link.as = true;
          }
        }
        const rightTable = arg;
        link = helpers.normalizeLink(leftTable, rightTable, link);
        link.table = rightTable;
        normalized.push(link);
        // dont use the link again
        link = null;
      }

      // in any case set the next leftTable
      return (leftTable = arg);
    } else {
      return (link = arg);
    }
  });

  return normalized;
};

// core

const Mesa = function(source) {
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

Mesa.prototype = {
  // the magic behind mohair's fluent interface:
  // after benchmarking several possible solutions
  // and even prototypically inheriting from the calling objects
  // i found that
  // splitting the properties
  // and
  // is the most time and space efficient solution.
  // in reality only very few properties
  //
  // with prototypical inheritance produces a long prototype chain.
  // long prorotypical inheritance chains are not performant.
  // it also prevents the entire chain from being garbage collected
  // which requires a lot of space.
  //
  // all intermediaries can be safely garbage collected

  fluent(key, value) {
    const next = new Mesa(this);
    next[key] = value;
    return next;
  },

  // call a one-off function as if it were part of mesa
  call(f, ...args) {
    const result = f.apply(this, args);
    if (!helpers.isInstance(result)) {
      throw new Error(
        'the function passed to .call() must return a mesa-object',
      );
    }
    return result;
  },

  when(condition, fn, ...args) {
    if (condition) {
      return this.call(fn, ...Array.from(args));
    } else {
      return this;
    }
  },

  each(arrayOrObject, fn, ...args) {
    const callback = function(that, value, indexOrKey) {
      const result = fn.call(that, value, indexOrKey, ...Array.from(args));
      if (!helpers.isInstance(result)) {
        throw new Error(
          'the function passed to .each() must return a mesa-object',
        );
      }
      return result;
    };
    return _.reduce(arrayOrObject, callback, this);
  },

  _returnFirst: false,
  returnFirst(arg) {
    if (arg == null) {
      arg = true;
    }
    return this.fluent('_returnFirst', arg);
  },

  debug(arg) {
    return this.fluent('_debug', arg);
  },

  // mass assignment protection

  _allowed: [],
  allow(...columns) {
    return this.fluent('_allowed', _.flatten(columns));
  },

  _isUnsafe: false,
  unsafe(isUnsafe) {
    if (isUnsafe == null) {
      isUnsafe = true;
    }
    return this.fluent('_isUnsafe', isUnsafe);
  },

  pickAllowed(record) {
    if (this._isUnsafe) {
      return record;
    }
    if (this._allowed.length === 0) {
      throw new Error(
        [
          'no columns are allowed.',
          'this will make .update() or .insert() fail.',
          'call .allow(columns...) with at least one column before .insert() or .update().',
          'alternatively call .unsafe() before to disable mass assignment protection altogether.',
        ].join(' '),
      );
    }
    return _.pick(record, this._allowed);
  },

  // pass throughs to the underlying mohair query builder instance

  _mohair: helpers.defaultMohair,

  // implementation of sql-fragment interface

  sql(escape) {
    return this._mohair.sql(escape);
  },
  params() {
    return this._mohair.params();
  },

  raw(...args) {
    return this._mohair.raw(...Array.from(args || []));
  },

  table(arg) {
    return this.fluent('_mohair', this._mohair.table(arg));
  },

  getTable() {
    return this._mohair.getTable();
  },

  from(...args) {
    return this.fluent('_mohair', this._mohair.from(...Array.from(args || [])));
  },

  where(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.where(...Array.from(args || [])),
    );
  },
  having(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.having(...Array.from(args || [])),
    );
  },
  join(...args) {
    return this.fluent('_mohair', this._mohair.join(...Array.from(args || [])));
  },
  select(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.select(...Array.from(args || [])),
    );
  },
  limit(arg) {
    return this.fluent('_mohair', this._mohair.limit(arg));
  },
  offset(arg) {
    return this.fluent('_mohair', this._mohair.offset(arg));
  },
  order(arg) {
    return this.fluent('_mohair', this._mohair.order(arg));
  },
  group(arg) {
    return this.fluent('_mohair', this._mohair.group(arg));
  },
  with(arg) {
    return this.fluent('_mohair', this._mohair.with(arg));
  },
  returning(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.returning(...Array.from(args || [])),
    );
  },
  distinct(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.distinct(...Array.from(args || [])),
    );
  },
  for(...args) {
    return this.fluent('_mohair', this._mohair.for(...Array.from(args || [])));
  },
  window(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.window(...Array.from(args || [])),
    );
  },

  combine(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.combine(...Array.from(args || [])),
    );
  },
  union(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.union(...Array.from(args || [])),
    );
  },
  unionAll(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.unionAll(...Array.from(args || [])),
    );
  },
  intersect(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.intersect(...Array.from(args || [])),
    );
  },
  intersectAll(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.intersectAll(...Array.from(args || [])),
    );
  },
  except(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.except(...Array.from(args || [])),
    );
  },
  exceptAll(...args) {
    return this.fluent(
      '_mohair',
      this._mohair.exceptAll(...Array.from(args || [])),
    );
  },

  // set and get connection

  setConnection(arg) {
    if (
      'function' !== typeof arg &&
      ('object' !== typeof arg || arg.query == null)
    ) {
      throw new Error(
        '.setConnection() must be called with either a connection object or a function that takes a callback and calls it with a connection',
      );
    }
    return this.fluent('_connection', arg);
  },

  getConnection(arg) {
    const that = this;
    if (arg != null) {
      throw new Error(helpers.ignoredArgumentWarning('.getConnection()'));
    }
    const connection = this._connection;
    const debug = this._debug;

    if (connection == null) {
      return Promise.reject(
        new Error(
          'the method you are calling requires a call to .setConnection() before it',
        ),
      );
    }

    return new Promise(function(resolve, reject) {
      if ('function' === typeof connection) {
        return connection(function(err, result, realDone) {
          const done = function() {
            if (typeof debug === 'function') {
              debug('connection', 'done', {}, {connection}, that);
            }
            return realDone();
          };
          if (err != null) {
            if (typeof done === 'function') {
              done();
            }
            return reject(err);
          }
          if (typeof debug === 'function') {
            debug(
              'connection',
              'fresh',
              {},
              {
                connection: result,
                done,
              },
              that,
            );
          }
          return resolve({
            connection: result,
            done,
          });
        });
      }

      if (typeof debug === 'function') {
        debug('connection', 'reuse', {}, {connection}, that);
      }
      return resolve({
        connection,
      });
    });
  },

  // promise wrapper around node-postgres

  wrapInConnection(block) {
    return this.getConnection().then(({connection, done}) =>
      block(connection).finally(() =>
        typeof done === 'function' ? done() : undefined,
      ),
    );
  },

  query(sqlOrFragment, params) {
    let sql;
    if (mohair.implementsSqlFragmentInterface(sqlOrFragment)) {
      sql = sqlOrFragment.sql(helpers.schemaAwareEscape);
      if (params != null) {
        throw new Error(
          'query with sql fragment as first arg is not allowed to have a second arg',
        );
      }
      params = sqlOrFragment.params();
    } else {
      sql = sqlOrFragment;
    }

    sql = helpers.replacePlaceholders(sql);

    const that = this;
    const debug = this._debug;
    return this.wrapInConnection(
      (connection) =>
        new Promise(function(resolve, reject) {
          if (typeof debug === 'function') {
            debug(
              'query',
              'before',
              {
                sql,
                params,
              },
              {
                connection,
              },
              that,
            );
          }
          return connection.query(sql, params, function(err, results) {
            if (typeof debug === 'function') {
              debug(
                'query',
                'after',
                {
                  sql,
                  params,
                },
                {
                  connection,
                  err,
                  results,
                },
                that,
              );
            }
            if (err != null) {
              return reject(err);
            }
            return resolve(results);
          });
        }),
    );
  },

  wrapInTransaction(block) {
    const that = this;
    const debug = this._debug;
    return this.wrapInConnection(function(connection) {
      const withConnection = that.setConnection(connection);
      if (typeof debug === 'function') {
        debug('transaction', 'begin', {}, {connection, block}, that);
      }
      return withConnection
        .query('BEGIN;')
        .then(() => block(connection))
        .then(function(result) {
          if (typeof debug === 'function') {
            debug('transaction', 'commit', {}, {connection, block}, that);
          }
          return withConnection.query('COMMIT;').then(() => result);
        })
        .catch(function(error) {
          if (typeof debug === 'function') {
            debug(
              'transaction',
              'rollback',
              {error},
              {
                connection,
                block,
              },
              that,
            );
          }
          return withConnection
            .query('ROLLBACK;')
            .then(() => Promise.reject(error));
        });
    });
  },

  runQueue(queue, value) {
    const context = this;
    const reducer = (soFar, step) => soFar.then(step.bind(context));
    return queue.reduce(reducer, Promise.resolve(value));
  },

  // what happens after the promise returned by .query(sql, params) is resolved
  // but before the promise returned by the calling function
  // (.select(), insert.(), ...) is resolved.

  afterQuery(results, options) {
    const that = this;
    const debug = this._debug;
    const {rows} = results;
    if (!rows) {
      return results;
    }

    if (typeof debug === 'function') {
      debug('after-query', 'before-queue', {rows}, options, that);
    }
    return this.runQueue(options.after, rows)
      .map(this.runQueue.bind(this, options.afterEach))
      .then(function(rows) {
        if (typeof debug === 'function') {
          debug('after-query', 'after-queue', {rows}, options, that);
        }
        if (options.returnFirst) {
          return rows[0];
        } else {
          return rows;
        }
      });
  },

  // command: these functions have side effects

  insert(...args) {
    const that = this;
    const debug = this._debug;

    const records = _.flatten(args);

    if (records.length === 0) {
      throw new Error('no records to insert');
    }

    const returnFirst = args.length === 1 && !Array.isArray(args[0]);

    if (typeof debug === 'function') {
      debug('insert', 'before-queue', {records}, {}, that);
    }

    return this.runQueue(this._queueBeforeInsert, records)
      .map(this.runQueue.bind(this, this._queueBeforeEachInsert))
      .then(function(records) {
        if (typeof debug === 'function') {
          debug('insert', 'after-queue', {records}, {}, that);
        }
        records.forEach(function(record, index) {
          if (Object.keys(record).length === 0) {
            throw new Error(
              `insert would fail because record at index ${index} is empty after processing before queue`,
            );
          }
        });

        return that.query(that._mohair.insert(records)).then((results) =>
          that.afterQuery(results, {
            returnFirst,
            after: that._queueAfterInsert,
            afterEach: that._queueAfterEachInsert,
          }),
        );
      });
  },

  update(update) {
    const that = this;
    const debug = this._debug;

    if (typeof debug === 'function') {
      debug('update', 'before-queue', {update}, {}, that);
    }

    return this.runQueue(this._queueBeforeEachUpdate, update).then(function(
      update,
    ) {
      if (typeof debug === 'function') {
        debug('update', 'after-queue', {update}, {}, that);
      }

      return that.query(that._mohair.update(update)).then((results) =>
        that.afterQuery(results, {
          returnFirst: that._returnFirst,
          after: that._queueAfterUpdate,
          afterEach: that._queueAfterEachUpdate,
        }),
      );
    });
  },

  delete() {
    if (typeof arg !== 'undefined' && arg !== null) {
      throw new Error(helpers.ignoredArgumentWarning('.delete()'));
    }
    const that = this;

    return that.query(that._mohair.delete()).then((results) =>
      that.afterQuery(results, {
        returnFirst: that._returnFirst,
        after: that._queueAfterDelete,
        afterEach: that._queueAfterEachDelete,
      }),
    );
  },

  // query: these functions have no side effects

  find(arg) {
    if (arg != null) {
      throw new Error(helpers.ignoredArgumentWarning('.find()'));
    }

    const that = this;

    return that.query(this).then((results) =>
      that.afterQuery(results, {
        returnFirst: that._returnFirst,
        after: that._queueAfterSelect,
        afterEach: that._queueAfterEachSelect,
      }),
    );
  },

  first(arg) {
    if (arg != null) {
      throw new Error(helpers.ignoredArgumentWarning('.first()'));
    }

    return this.limit(1).returnFirst().find();
  },

  exists(arg) {
    if (arg != null) {
      throw new Error(helpers.ignoredArgumentWarning('.exists()'));
    }

    return this.query(this._mohair.limit(1)).then(
      (results) => results.rows != null && results.rows.length !== 0,
    );
  },

  // primary key (used by embeds)

  _primaryKey: 'id',
  primaryKey(arg) {
    return this.fluent('_primaryKey', arg);
  },
  getPrimaryKey() {
    return this._primaryKey;
  },

  // embed

  // TODO REFACTOR this function works and is well tested
  // but a bit of a complicated mess of side effects and promises
  baseEmbed(originalRecords, includes) {
    // regardless of how we branch off we keep them in buckets
    // buckets always contains the records of the last layer
    // that are connected to the records in the starting table
    let groupedByFirst = null;
    let prevRecords = originalRecords;

    const reducer = (
      soFar,
      include, // run in series
    ) =>
      // wait for previous include steps to continue
      soFar.then(function() {
        const condition = {};
        condition[include.right] = _.map(prevRecords, include.left);

        return include.table
          .where(condition)
          .find()
          .then(function(nextRecords) {
            const groupedByCurrent = _.groupBy(nextRecords, include.right);

            groupedByFirst =
              groupedByFirst == null ?
                groupedByCurrent :
                _.mapValues(groupedByFirst, (
                  records, // forward bucket to the next layer
                ) =>
                // by replacing records by the records they are
                // associated with
                  _.reduce(
                    records,
                    function(acc, record) {
                      records = groupedByCurrent[record[include.left]];
                      if (records != null) {
                        return acc.concat(records);
                      } else {
                        return acc;
                      }
                    },
                    [],
                  ),
                );

            if (include.as != null) {
              // embed this layer (currently in buckets) into the original records
              originalRecords.forEach(function(record) {
                const group = groupedByFirst[record[includes[0].left]] || [];
                if (include.first) {
                  if (group[0] != null) {
                    return (record[include.as] = group[0]);
                  }
                } else {
                  return (record[include.as] = group);
                }
              });
            }
            return (prevRecords = nextRecords);
          });
      });

    // run include steps in series
    return includes.reduce(reducer, Promise.resolve()).then(
      () =>
        // finally return the original records
        originalRecords,
    );
  },

  embed(records, ...args) {
    if (records.length === 0) {
      return records;
    }
    return this.baseEmbed(
      records,
      helpers.normalizeIncludeArguments(this, ...Array.from(args)),
    );
  },

  include(...args) {
    return this.queueAfter(_.partialRight(this.embed, ...Array.from(args)));
  },
};

// automatic construction of setters and properties for queue:
// (automating this prevents copy & paste errors)

// TODO better name
const payload = function(f, ...args) {
  if (args.length === 0) {
    return f;
  } else {
    return _.partialRight(f, ...Array.from(args));
  }
};

const setQueueProperties = function(object, suffix) {
  const setterPropertyName = 'queue' + suffix;
  const dataPropertyName = '_' + setterPropertyName;
  object[dataPropertyName] = [];
  return (object[setterPropertyName] = function(...args) {
    return this.fluent(
      dataPropertyName,
      this[dataPropertyName].concat([payload(...Array.from(args || []))]),
    );
  });
};

// queueBeforeInsert, queueBeforeEachInsert
// queueBeforeEachUpdate (just that because the update is a single object/record)

setQueueProperties(Mesa.prototype, 'BeforeInsert');
setQueueProperties(Mesa.prototype, 'BeforeEachInsert');
setQueueProperties(Mesa.prototype, 'BeforeEachUpdate');

// queueAfterSelect, queueAfterEachSelect
// queueAfterInsert, queueAfterEachInsert
// queueAfterUpdate, queueAfterEachUpdate
// queueAfterDelete, queueAfterEachDelete

for (const phase of ['Select', 'Insert', 'Update', 'Delete']) {
  setQueueProperties(Mesa.prototype, 'After' + phase);
  setQueueProperties(Mesa.prototype, 'AfterEach' + phase);
}

Mesa.prototype.queueBeforeEach = function(...args) {
  const object = new Mesa(this);
  ['Insert', 'Update'].forEach(function(phase) {
    const propertyName = '_queueBeforeEach' + phase;
    return (object[propertyName] = object[propertyName].concat([
      payload(...Array.from(args || [])),
    ]));
  });
  return object;
};

Mesa.prototype.queueAfter = function(...args) {
  const object = new Mesa(this);
  ['Select', 'Insert', 'Update', 'Delete'].forEach(function(phase) {
    const propertyName = '_queueAfter' + phase;
    return (object[propertyName] = object[propertyName].concat([
      payload(...Array.from(args || [])),
    ]));
  });
  return object;
};

Mesa.prototype.queueAfterEach = function(...args) {
  const object = new Mesa(this);
  ['Select', 'Insert', 'Update', 'Delete'].forEach(function(phase) {
    const propertyName = '_queueAfterEach' + phase;
    return (object[propertyName] = object[propertyName].concat([
      payload(...Array.from(args || [])),
    ]));
  });
  return object;
};

// exports

Mesa.prototype.isInstance = helpers.isInstance = (object) =>
  object instanceof Mesa;

Mesa.prototype.helpers = helpers;

// put mesaBaseProperties one step away from the exported object in the prototype chain
// such that mesa.clone() does not copy the mesaBase properties.
// mesa.clone() just copies OWN properties.
// user-added methods are OWN properties and get copied.
// this keeps the copies small which is nice for performance (memory and cpu)
// and makes inspecting the `this` objects more pleasant as they
// only contain relevant state.
const mesa = new Mesa();

module.exports = mesa
  // enable mass assignment protection
  .queueBeforeEach(mesa.pickAllowed);
