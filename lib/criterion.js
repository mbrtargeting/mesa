/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// HELPERS

let beget;
let explodeObject;
let flatten;
let identity;
let implementsSqlFragmentInterface;
let isEmptyArray;
let normalizeParams;
let normalizeSql;
let some;
const helper = {};

// return a new object which has `proto` as its prototype and
// all properties in `properties` as its own properties.

helper.beget = beget = function(proto, properties) {
  const object = Object.create(proto);

  if (properties != null) {
    for (const key in properties) {
      const value = properties[key];
      ((key, value) => (object[key] = value))(key, value);
    }
  }

  return object;
};

// if `thing` is an array return `thing`
// otherwise return an array of all key value pairs in `thing` as objects
// example: explodeObject({a: 1, b: 2}) -> [{a: 1}, {b: 2}]

helper.explodeObject = explodeObject = function(arrayOrObject) {
  if (Array.isArray(arrayOrObject)) {
    return arrayOrObject;
  }

  const array = [];
  for (const key in arrayOrObject) {
    const value = arrayOrObject[key];
    (function(key, value) {
      const object = {};
      object[key] = value;
      return array.push(object);
    })(key, value);
  }

  return array;
};

helper.identity = identity = (x) => x;

helper.isEmptyArray = isEmptyArray = (x) => Array.isArray(x) && x.length === 0;

// calls iterator for the values in array in sequence (with the index as the second argument).
// returns the first value returned by iterator for which predicate returns true.
// otherwise returns sentinel.

helper.some = some = function(array, iterator, predicate, sentinel) {
  if (iterator == null) {
    iterator = identity;
  }
  if (predicate == null) {
    predicate = (x) => x != null;
  }
  if (sentinel == null) {
    sentinel = undefined;
  }
  let i = 0;
  const {length} = array;
  while (i < length) {
    const result = iterator(array[i], i);
    if (predicate(result, i)) {
      return result;
    }
    i++;
  }
  return sentinel;
};

// flatten array one level

helper.flatten = flatten = (array) => [].concat(...Array.from(array || []));

// sql-fragments are treated differently in many situations
helper.implementsSqlFragmentInterface = implementsSqlFragmentInterface = (
  value,
) =>
  value != null &&
  'function' === typeof value.sql &&
  'function' === typeof value.params;

// normalize sql for fragments and values
helper.normalizeSql = normalizeSql = function(
  fragmentOrValue,
  escape,
  ignoreWrap,
) {
  if (ignoreWrap == null) {
    ignoreWrap = false;
  }
  if (implementsSqlFragmentInterface(fragmentOrValue)) {
    const sql = fragmentOrValue.sql(escape);
    if (ignoreWrap || fragmentOrValue.dontWrap) {
      return sql;
    } else {
      return '(' + sql + ')';
    }
  } else {
    // if thing is not an sql fragment treat it as a value
    return '?';
  }
};

// normalize params for fragments and values
helper.normalizeParams = normalizeParams = function(fragmentOrValue) {
  if (implementsSqlFragmentInterface(fragmentOrValue)) {
    return fragmentOrValue.params();
    // if thing is not an sql fragment treat it as a value
  } else {
    return [fragmentOrValue];
  }
};

// PROTOTYPES AND FACTORIES

// prototype objects for the objects that describe parts of sql-where-conditions

const prototypes = {};

const dsl = {};

const modifiers = {};

// the base prototype for all other prototypes:
// all objects should have the logical operators not, and and or

prototypes.base = {
  not() {
    return dsl.not(this);
  },
  and(...args) {
    return dsl.and(this, criterion(...Array.from(args || [])));
  },
  or(...args) {
    return dsl.or(this, criterion(...Array.from(args || [])));
  },
};

// raw sql

prototypes.rawSql = beget(prototypes.base, {
  sql() {
    if (!this._params) {
      return this._sql;
    }

    let i = -1;
    const params = this._params;

    return this._sql.replace(/\?/g, function() {
      i++;
      // if the param is an array explode into a comma separated list of question marks
      if (Array.isArray(params[i])) {
        return params[i].map(() => '?').join(', ');
      } else {
        return '?';
      }
    });
  },

  params() {
    return flatten(this._params);
  },
  dontWrap: true,
});

const rawSql = function(sql, params) {
  if (params == null) {
    params = [];
  }
  return beget(prototypes.rawSql, {_sql: sql, _params: params});
};

// escape

prototypes.escape = beget(prototypes.base, {
  sql(escape) {
    return escape(this._sql);
  },
  params() {
    return [];
  },
  dontWrap: true,
});

dsl.escape = (sql) => beget(prototypes.escape, {_sql: sql});

// comparisons: eq, ne, lt, lte, gt, gte

prototypes.comparison = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    return `${normalizeSql(this._left, escape)} ${
      this._operator
    } ${normalizeSql(this._right, escape)}`;
  },
  params() {
    return normalizeParams(this._left).concat(normalizeParams(this._right));
  },
});

// for when you need arbitrary comparison operators
dsl.compare = (operator, left, right) =>
  beget(prototypes.comparison, {
    _left: left,
    _right: right,
    _operator: operator,
  });

// make dsl functions and modifier functions for the most common comparison operators
[
  {name: 'eq', modifier: '$eq', operator: '='},
  {name: 'ne', modifier: '$ne', operator: '!='},
  {name: 'lt', modifier: '$lt', operator: '<'},
  {name: 'lte', modifier: '$lte', operator: '<='},
  {name: 'gt', modifier: '$gt', operator: '>'},
  {name: 'gte', modifier: '$gte', operator: '>='},
].forEach(
  ({name, modifier, operator}) =>
    (dsl[name] = modifiers[modifier] = (left, right) =>
      dsl.compare(operator, left, right)),
);

// null

prototypes.null = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    return `${normalizeSql(this._operand, escape)} IS ${
      this._isNull ? '' : 'NOT '
    }NULL`;
  },
  params() {
    return normalizeParams(this._operand);
  },
});

dsl.null = modifiers.$null = function(operand, isNull) {
  if (isNull == null) {
    isNull = true;
  }
  if (operand == null) {
    throw new Error('`null` needs an operand');
  }
  return beget(prototypes.null, {_operand: operand, _isNull: isNull});
};

// negation

prototypes.not = beget(prototypes.base, {
  sql(escape) {
    // remove double negation
    if (escape == null) {
      escape = identity;
    }
    if (isNegation(this._inner)) {
      const ignoreWrap = true;
      return normalizeSql(this._inner._inner, escape, ignoreWrap);
    } else {
      return `NOT ${normalizeSql(this._inner, escape)}`;
    }
  },
  params() {
    return this._inner.params();
  },
});

const isNegation = (x) => prototypes.not.isPrototypeOf(x);

dsl.not = function(inner) {
  if (!implementsSqlFragmentInterface(inner)) {
    throw new Error('`not`: operand must implement sql-fragment interface');
  }
  return beget(prototypes.not, {_inner: inner});
};

// exists

prototypes.exists = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    return `EXISTS ${normalizeSql(this._operand, escape)}`;
  },
  params() {
    return this._operand.params();
  },
});

dsl.exists = function(operand) {
  if (!implementsSqlFragmentInterface(operand)) {
    throw new Error('`exists` operand must implement sql-fragment interface');
  }
  return beget(prototypes.exists, {_operand: operand});
};

// subquery expressions: in, nin, any, neAny, ...

prototypes.subquery = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    let sql = '';
    sql += normalizeSql(this._left, escape);
    sql += ` ${this._operator} `;
    if (implementsSqlFragmentInterface(this._right)) {
      sql += `${normalizeSql(this._right, escape)}`;
    } else {
      const questionMarks = [];
      this._right.forEach(() => questionMarks.push('?'));
      sql += `(${questionMarks.join(', ')})`;
    }
    return sql;
  },
  params() {
    let params = normalizeParams(this._left);
    if (implementsSqlFragmentInterface(this._right)) {
      params = params.concat(this._right.params());
    } else {
      // only for $in and $nin: in that case @_value is already an array
      params = params.concat(this._right);
    }
    return params;
  },
});

dsl.subquery = (operator, left, right) =>
  beget(prototypes.subquery, {
    _left: left,
    _right: right,
    _operator: operator,
  });

// make dsl functions and modifier functions for common subquery operators
[
  {name: 'in', modifier: '$in', operator: 'IN'},
  {name: 'nin', modifier: '$nin', operator: 'NOT IN'},

  {name: 'any', modifier: '$any', operator: '= ANY'},
  {name: 'neAny', modifier: '$neAny', operator: '!= ANY'},
  {name: 'ltAny', modifier: '$ltAny', operator: '< ANY'},
  {name: 'lteAny', modifier: '$lteAny', operator: '<= ANY'},
  {name: 'gtAny', modifier: '$gtAny', operator: '> ANY'},
  {name: 'gteAny', modifier: '$gteAny', operator: '>= ANY'},

  {name: 'all', modifier: '$all', operator: '= ALL'},
  {name: 'neAll', modifier: '$neAll', operator: '!= ALL'},
  {name: 'ltAll', modifier: '$ltAll', operator: '< ALL'},
  {name: 'lteAll', modifier: '$lteAll', operator: '<= ALL'},
  {name: 'gtAll', modifier: '$gtAll', operator: '> ALL'},
  {name: 'gteAll', modifier: '$gteAll', operator: '>= ALL'},
].forEach(
  ({name, modifier, operator}) =>
    (dsl[name] = modifiers[modifier] = function(left, right) {
      if (left == null) {
        throw new Error(`\`${name}\` needs left operand`);
      }
      if (right == null) {
        throw new Error(`\`${name}\` needs right operand`);
      }
      if (Array.isArray(right)) {
        if (['in', 'nin'].includes(name)) {
          if (right.length === 0) {
            throw new Error(`\`${name}\` with empty array as right operand`);
          }
        } else {
          // only $in and $nin support arrays
          throw new TypeError(
            `\`${name}\` doesn't support array as right operand. only \`in\` and \`nin\` do!`,
          );
        }
        // not array
      } else {
        if (!implementsSqlFragmentInterface(right)) {
          if (['in', 'nin'].includes(name)) {
            throw new TypeError(
              `\`${name}\` requires right operand that is an array or implements sql-fragment interface`,
            );
          } else {
            throw new TypeError(
              `\`${name}\` requires right operand that implements sql-fragment interface`,
            );
          }
        }
      }

      return dsl.subquery(operator, left, right);
    }),
);

// and

const isAnd = (x) => prototypes.and.isPrototypeOf(x);

prototypes.and = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    const parts = this._operands.map(function(x) {
      // we don't have to wrap ANDs inside an AND
      const ignoreWrap = isAnd(x);
      return normalizeSql(x, escape, ignoreWrap);
    });
    return parts.join(' AND ');
  },
  params() {
    let params = [];
    this._operands.forEach((c) => (params = params.concat(c.params())));
    return params;
  },
});

dsl.and = function(...args) {
  const operands = flatten(args);
  if (operands.length === 0) {
    throw new Error('`and` needs at least one operand');
  }
  operands.forEach(function(x) {
    if (!implementsSqlFragmentInterface(x)) {
      throw new Error(
        '`and`: all operands must implement sql-fragment interface',
      );
    }
  });
  return beget(prototypes.and, {_operands: operands});
};

// or

const isOr = (x) => prototypes.or.isPrototypeOf(x);

prototypes.or = beget(prototypes.base, {
  sql(escape) {
    if (escape == null) {
      escape = identity;
    }
    const parts = this._operands.map(function(x) {
      // we don't have to wrap ORs inside an OR
      const ignoreWrap = isOr(x);
      return normalizeSql(x, escape, ignoreWrap);
    });
    return parts.join(' OR ');
  },
  params() {
    let params = [];
    this._operands.forEach((c) => (params = params.concat(c.params())));
    return params;
  },
});

dsl.or = function(...args) {
  const operands = flatten(args);
  if (operands.length === 0) {
    throw new Error('`or` needs at least one operand');
  }
  operands.forEach(function(x) {
    if (!implementsSqlFragmentInterface(x)) {
      throw new Error(
        '`or`: all operands must implement sql-fragment interface',
      );
    }
  });
  return beget(prototypes.or, {_operands: operands});
};

// MAIN FACTORY

// always returns an sql-fragment.
// can be used to normalize sql strings and fragments.

// when called with a single sql fragment returns that fragment unchanged.
//
// when called with a list of
// when called with a condition-object parses that object into a fragment and returns it.
// function that recursively constructs the object graph
// of the criterion described by the arguments.
// when called with a string

const criterion = function(firstArg, ...restArgs) {
  const typeOfFirstArg = typeof firstArg;

  // invalid arguments?
  if ('string' !== typeOfFirstArg && 'object' !== typeOfFirstArg) {
    throw new TypeError(
      `string or object expected as first argument but ${typeOfFirstArg} given`,
    );
  }

  // raw sql string with optional params?
  if (typeOfFirstArg === 'string') {
    // make sure that no param is an empty array

    const emptyArrayParam = some(
      restArgs,
      (x, i) => ({
        x,
        i,
      }),
      ({x, i}) => isEmptyArray(x),
    );

    if (emptyArrayParam != null) {
      throw new Error(`params[${emptyArrayParam.i}] is an empty array`);
    }

    // valid raw sql !
    return rawSql(firstArg, restArgs);
  }

  // if there is more than one argument and the first isnt a string
  // map criterion over all arguments and AND them together

  if (restArgs.length !== 0) {
    return dsl.and([firstArg].concat(restArgs).map((x) => criterion(x)));
  }

  // FROM HERE ON THERE IS ONLY A SINGLE ARGUMENT

  if (implementsSqlFragmentInterface(firstArg)) {
    return firstArg;
  }

  // array of condition objects?
  if (Array.isArray(firstArg)) {
    if (firstArg.length === 0) {
      throw new Error('condition-object is an empty array');
    }
    // let's AND them together
    return dsl.and(firstArg.map((x) => criterion(x)));
  }

  // FROM HERE ON `firstArg` IS A CONDITION OBJECT

  const keyCount = Object.keys(firstArg).length;

  if (0 === keyCount) {
    throw new Error('empty condition-object');
  }

  // if there is more than one key in the condition-object
  // cut it up into objects with one key and AND them together
  if (keyCount > 1) {
    return dsl.and(explodeObject(firstArg).map((x) => criterion(x)));
  }

  // column name
  const key = Object.keys(firstArg)[0];
  const keyFragment = dsl.escape(key);
  const value = firstArg[key];

  // FROM HERE ON `firstArg` IS A CONDITION-OBJECT WITH EXACTLY ONE KEY-VALUE-MAPPING:
  // `key` MAPS TO `value`

  if (value == null) {
    throw new TypeError(`value undefined or null for key ${key}`);
  }

  if (key === '$and') {
    return dsl.and(explodeObject(value).map((x) => criterion(x)));
  }

  if (key === '$or') {
    return dsl.or(explodeObject(value).map((x) => criterion(x)));
  }

  if (key === '$not') {
    return dsl.not(criterion(value));
  }

  if (key === '$exists') {
    return dsl.exists(value);
  }

  if ('object' !== typeof value) {
    return dsl.eq(keyFragment, value);
  }

  // {x: [1, 2, 3]} is a shorthand for {x: {$in: [1, 2, 3]}}
  if (Array.isArray(value)) {
    return dsl.in(keyFragment, value);
  }

  // FROM HERE ON `value` IS AN OBJECT AND NOT A NUMBER, STRING, ARRAY, ...

  const keys = Object.keys(value);

  const hasModifier = keys.length === 1 && 0 === keys[0].indexOf('$');

  if (!hasModifier) {
    // handle other objects which are values but have no modifiers
    // (dates for example) like primitives (strings, numbers)
    return dsl.eq(keyFragment, value);
  }

  const modifier = keys[0];
  const innerValue = value[modifier];

  // FROM HERE ON `value` IS AN OBJECT WITH A `modifier` KEY AND an `innerValue`

  if (innerValue == null) {
    throw new TypeError(
      `value undefined or null for key ${key} and modifier key ${modifier}`,
    );
  }

  const modifierFactory = modifiers[modifier];

  if (modifierFactory != null) {
    return modifierFactory(keyFragment, innerValue);
  }

  throw new Error(`unknown modifier key ${modifier}`);
};

// EXPORTS

module.exports = criterion;

// make the dsl public
for (const key in dsl) {
  const value = dsl[key];
  ((key, value) => (criterion[key] = value))(key, value);
}

// make the helpers available to mesa, mohair
// and any other module that needs them
criterion.helper = helper;

// make prototypes available
criterion.prototypes = prototypes;
