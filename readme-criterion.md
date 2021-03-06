# criterion

[![NPM version](https://badge.fury.io/js/criterion.svg)](http://badge.fury.io/js/criterion)
[![Build Status](https://travis-ci.org/snd/criterion.svg?branch=master)](https://travis-ci.org/snd/criterion/branches)
[![Dependencies](https://david-dm.org/snd/criterion.svg)](https://david-dm.org/snd/criterion)

#### ABOUT THIS VERSION !

**this is the readme for criterion version `0.4.0` - a work in progress.
release candidate `0.4.0-rc.1` is published to npm:
the api is stable, the implementation complete, the tests numerous and passing,
the documentation (this readme) still needs some love.
to see the readme for `0.3.3` [click here](https://github.com/snd/criterion/tree/0808d66443fd72aaece2f3e5134f49d3af0bf72e) !
to see what has changed in `0.4.0` [click here](#changelog).**

> criterion allows you to work with (build, combine, reuse, ...) SQL-where-conditions
> (`x = 5 AND y IS NOT NULL`...) as data
> (goodbye string-concatenation)
> and compile them to SQL:
> it has a _succinct_ [mongodb-like query-language](#condition-objects),
> a _simple_ and _elegant_ functional API,
> is [reasily extended](#the-sql-fragment-interface)
> just by implementing 2 functions
> and _gets out of your way_: you can always drop down to [raw-sql](#raw-sql).

- [background](#background)
- [introduction](#get-started)
  - [install (`npm install criterion`)](#install)
  - [require (`var criterion = require('criterion');`)](#require)
  - [condition-objects (`var c = criterion({x: 7, y: {$lt: 5}});`)](#condition-objects)
  - [raw-sql (`var c = criterion('LOG(y, ?)', 5);`)](#raw-sql)
  - [the sql-fragment interface](#the-sql-fragment-interface)
- [for users of mesa and mohair](#for-users-of-mesa-and-mohair)
- [reference by example](#reference-by-example)
  - [how to read this reference](#how-to-read-this-reference)
  - [comparisons](#comparisons)
    - [equal (`{x: 1}` -> `x = ?`)](#equal)
    - [not equal (`{x: {$ne: 1}}` -> `x != ?`)](#not-equal)
    - [lower than (`{x: {$lt: 1}}` -> `x < ?`, `{x: {$lte: 1}}` -> `x <= ?`)](#lower-than)
    - [greater than (`$gt` -> `>`, `$gte` -> `>=`](#greater-than)
    - [null (`{$null: true}` -> `IS NULL`)](#null)
    - [not null (`{$null: false}` -> `IS NOT NULL`)](#not-null)
  - [boolean operations](#boolean-operations)
    - [and (`{x: 1, y: {$lt: 2}}` -> `(x = ?) AND (y < ?)`)](#and)
    - [or (`{$or: {x: 1, y: {$lt: 2}}}` -> `(x = ?) OR (y < ?)`)](#or)
    - [not (`{$not: {x: 1}}` -> `NOT (x = ?)`)](#not)
  - [lists of scalar expressions](#lists-of-scalar-expressions)
    - [in list (`{x: [1, 2, 3]}` -> `x IN (?, ?, ?)`)](#in-list)
    - [not in list (`{x: {$nin: [1, 2, 3]}}` -> `x NOT IN (?, ?, ?)`)](#not-in-list)
  - [subqueries](#subqueries)
    - [in subquery (`{x: subquery}` -> `x IN subquery`)](#in-subquery)
    - [not in subquery (`{x: {$nin: subquery}}` -> `x NOT IN subquery`)](#not-in-subquery)
    - [exists - whether subquery returns any rows](#exists-whether-subquery-returns-any-rows)
    - [row-wise comparison with subqueries](#row-wise-comparison-with-subqueries)
- [advanced topics](#advanced-topics)
  - [combining criteria with `.and()`](#combining-criteria-with-and)
  - [combining criteria with `.or()`](#combining-criteria-with-or)
  - [negating criteria with `.not()`](#negating-criteria-with-not)
  - [escaping column names with `.sql(escape)`](#escaping-column-names)
  - [param array explosion](#param-array-explosion)
- [changelog](#changelog)
- [license: MIT](#license-mit)

## background

criterion is part of three libraries for nodejs that make SQL with nodejs:

- [simple](http://www.infoq.com/presentations/Simple-Made-Easy),
- DRY
- extendable
- well documented

> make SQL with Nodejs
> succinct,
> DRY,
> functional
> data-driven
> composable
> flexible

- free
- close to the metal (sql, database, database-driver)
- and FUN !

- succinct
- FUN !

used in production

short code

high quality

- few lines of high quality code

well tested

philosophy

#### [CRITERION](http://github.com/snd/criterion) <- you are looking at it

parses SQL-where-conditions from a mongodb-like query-language into
objects which it can compile to SQL

#### [MOHAIR](http://github.com/snd/mohair)

a powerful SQL-query-builder with a fluent, functional, side-effect-free API.

uses [criterion](http://github.com/snd/criterion) to build and combine its SQL-where-clauses.

#### [MESA](http://github.com/snd/mesa)

helps as much as possible with the construction, composition and execution of SQL-queries while not restricting full access to the database in any way.

is not an ORM !

uses [mohair](http://github.com/snd/mohair) to build its SQL-queries.

uses [criterion](http://github.com/snd/criterion) (through [mohair](http://github.com/snd/mohair)) to build and combine its SQL-where-clauses.

## introduction

### install

```
npm install criterion
```

### require

```js
var criterion = require("criterion");
```

criterion exports a single function `criterion()` which
can be called either with a [condition-object](#condition-objects)
or with [raw-sql](#raw-sql):

### condition-objects

a _condition-object_ describes an SQL-where-condition
as data using a _query-language_ that is inspired by the
[mongodb query language](http://docs.mongodb.org/manual/tutorial/query-documents/).

let's make a _condition-object_:

```js
var condition = {
  a: 7,
  b: { $lt: 5 },
  $not: {
    $or: {
      c: [1, 2, 3],
      d: { $null: false },
    },
  },
};
```

you see that the _query-language_ uses special _modifier-keys_ to model comparisons (`$lt`), boolean operations (`$not`, `$or`)
and [much much more](#reference-by-example) (not unlike the [mongodb query language](http://docs.mongodb.org/manual/tutorial/query-documents/)).

now we can make a _criterion_ from the _condition-object_:

```js
var c = criterion(condition);
```

we can then compile the _criterion_ to SQL:

```js
c.sql();
// ->
// '(a = ?)
//  AND
//  (b < ?)
//  AND
//  NOT (
//    (c IN (?, ?, ?))
//    OR
//    (d IS NOT NULL)
//  )'
```

we can also get the bound parameters of the _criterion_:

```js
c.params();
// -> [7, 5, 1, 2, 3]
```

[see the reference below for examples on how to model almost every SQL-where-condition using _condition-objects_ !](#reference-by-example)

### raw-sql

_raw-sql_ is a string of SQL followed by some optional parameter bindings.

use _raw-sql_ for those rare cases where condition-objects and you have to fall back to using strings.

note that [_condition-objects_ and _raw-sql_ can be mixed](#mixing-condition-objects-and-sql-fragments) to keep _raw-sql_ to a minimum.

```js
var c = criterion("LOG(y, ?)", 4);
```

a criterion made from _raw-sql_ behaves exactly like one made from
a _condition-object_:

you can get the sql:

```js
c.sql();
// -> 'LOG(y, ?)'
```

...and the bound parameters:

```js
c.params();
// -> [4]
```

in fact both the criterion made from _raw-sql_ and one made from
a _condition-object_ are _sql-fragments_:

### the sql-fragment interface

in
[mesa](http://github.com/snd/mesa),
[mohair](http://github.com/snd/mohair)
and
[criterion](http://github.com/snd/criterion)
every object that has a `.sql()` method and a `.params()` method
is an implements the [sql-fragment](#the-sql-fragment-interface) interface
and is an [sql-fragment](#the-sql-fragment-interface).

more precisely:

the `.sql()` method should return a string of valid SQL.
the `.sql()` method might be called with a single argument:
a function `escape()` which takes a string and returns a string.
when the `escape()` function is present then the `.sql()` method should call it
to transform table- and column-names in the returned SQL.

if `.sql()` constructs the SQL on-the-fly that should be straightforward.
in the case of _raw-sql_ escaping is complex, ambigous and not worth the effort.

the `.params()` method takes no arguments and must return an array.

#### things that are sql-fragments (already)

- EVERY _criterion_:
  - `criterion({x: 7})`
  - `criterion('LOG(y, ?)', 4)`
- EVERY [mesa](http://github.com/snd/mesa)-query or [mohair](http://github.com/snd/mohair)-query:
  - `mesa.table('post')`
  - `mesa.table('post').where({id: 7})`
  - `mohair.table('host')`
  - `mohair.table('host').select('name').where({created_at: {$lt: new Date()}})`
- EVERY return value of [mesa's](http://github.com/snd/mesa) or [mohair's](http://github.com/snd/mohair) `.raw()` method:
  - `mesa.raw('LOG(y, ?)', 4)`
  - `mohair.raw('LOG(y, ?)', 4)`
- EVERY object you create that implements the [sql-fragment interface](#sql-fragment-interface)

#### mixing condition-objects and sql-fragments

now to the FUN part !

**ANY** _sql-fragment_ can be used in place of **ANY** value in a [condition-object](#condition-objects):

```js
var c = criterion({
  x: criterion("crypt(?, gen_salt(?, ?))", "password", "bf", 4),
});

c.sql();
// -> 'x = (crypt(?, gen_salt(?, ?)))'
c.params();
// -> ['password', 'bf', 4]
```

or

```js
var c = criterion({ x: { $ne: criterion("LOG(y, ?)", 4) } });

c.sql();
// -> 'x != LOG(y, ?)'
c.params();
// -> [4]
```

you see how this allows mixing _condition-objects_ with arbitrary sql: use it to keep [raw-sql](#raw-sql) to a minimum !

_sql-fragments_ can be mixed with _condition-objects_ inside boolean operations:

```js
var c = criterion({
  $or: [
    criterion('x BETWEEN ? AND ?', 5, 10),
    {y: {$ne: 12}}
    [
      criterion('x != LOG(y, ?)', 4)}}),
      {x: {$lt: 10}}
    ]
  ]
});

c.sql();
// ->
// '(x BETWEEN ? AND ?)
//  OR
//  (y != ?)
//  OR
//  (
//    (x != LOG(y, ?))
//    AND
//    (x < ?)
//  )'
c.params();
// -> [5, 10, 12, 4, 10]
```

last but not least:

the fact that [mohair](http://github.com/snd/mohair)/[mesa](http://github.com/snd/mesa)-queries are _sql-fragments_
allows you to model subqueries with mohair/mesa
and then use them directly in _condition-objects_.
this makes the creation of SQL-where-conditions that contain subqueries quite elegant:
[see the examples !](#subqueries)

#### making your own fragments

if we wanted to support [see also](http://www.postgresql.org/docs/9.4/static/functions-json.html)

```js

var pgJsonGet = function(left, right) {
  var leftF = criterion.coerceToSqlFragment(left);
  var rightF = criterion.coerceToSqlFragment(right);
  return {
    sql: function(escape) {
      return left.sql(escape) +
    },
    params: function() {

    }
  };
};
```

and use them like this

```js
var c = criterion({
  $or: [
    criterion('x BETWEEN ? AND ?', 5, 10),
    {y: {$ne: 12}}
    [
      criterion('x != LOG(y, ?)', 4)}}),
      {x: {$lt: 10}}
    ]
  ]
});
```

there is a library that does that for you.

## for users of mesa and mohair

[EVERYTHING possible with criterion](http://github.com/snd/criterion#reference-by-example) is possible
for the where conditions in
[mesa](http://github.com/snd/mesa)
and [mohair](http://github.com/snd/mohair) !

the [criterion reference](http://github.com/snd/criterion#reference-by-example) completes mesa's and mohair's documentation !

here's why:

the criterion module exports a single function: `var criterion = require('criterion')`

[mesa's](http://github.com/snd/mesa) and [mohair's](http://github.com/snd/mohair) fluent `.where()` methods
call `criterion()` under the hood and forward all their arguments **unmodifed** to `criterion()`.
this means that all arguments supported by `criterion()` are supported by `.where()` !

```js
// same condition-object
var condition = { x: 7 };

// criterion
var criterion = require("criterion");
var c = criterion(condition);
c.sql();
// -> 'x = ?'
c.params();
// -> [7]

// mohair
var mohair = require("mohair");
var query = mohair.table("post").where(condition);
query.sql();
// -> 'SELECT * FROM post WHERE x = ?'
query.params();
// -> [7]
```

if `.where()` is called more than once the resulting criteria are [ANDed](#combining-criteria-with-and) together:

```js
var mohair = require("mohair");

var postTable = mohair.table("post");
var queryAlpha = postTable.where({ x: 7 });
var queryBravo = queryAlpha.where("y IN (?)", [1, 2]);

postTable.sql();
// -> 'SELECT * FROM post'
postTable.params();
// -> []

queryAlpha.sql();
// -> 'SELECT * FROM post WHERE x = ?'
queryAlpha.params();
// -> [7]

queryBravo.sql();
// -> 'SELECT * FROM post WHERE x = ? AND y IN (?, ?)'
queryBravo.params();
// -> [7, 1, 2]
```

calling methods on does not but
refines

this is one of the nice properties of mohair and mesa.

## reference by example

### how to read this reference

_for each section several examples are given and seperated by "or".
the criteria created in the examples behave identical.
the first example in each section
uses condition-objects and is always the preferred way of doing things !_

### comparisons

#### equal

where `x = 7`:

```js
var c = criterion({ x: 7 });
c.sql();
// -> 'x = ?'
c.params();
// -> [7]
```

or raw:

```js
var c = criterion("x = ?", 7);
```

or functional:

```js
var c = criterion.eq(criterion.escape(x), 7);
```

#### not equal

where `x != 3`:

```js
var c = criterion({ x: { $ne: 3 } });
c.sql(); // -> 'x != ?'
c.params(); // -> [3]
```

or raw:

```js
var c = criterion("x != ?", 3);
```

or functional:

```js
var c = criterion.ne(criterion.escape(x), 3);
```

#### lower than

where `x < 3` and `y <= 4`:

```js
var c = criterion({ x: { $lt: 3 }, y: { $lte: 4 } });
c.sql();
// -> 'x < ? AND y <= ?'
c.params();
// -> [3, 4]
```

or raw:

```js
var c = criterion("x < ? AND y <= ?", 3, 4);
```

or functional:

```js
var c = criterion.and(
  criterion.lt(criterion.escape("x"), 3),
  criterion.lte(criterion.escape("y"), 4)
);
```

#### greater than

where `x > 3` and `y >= 4`:

```js
var c = criterion({ x: { $gt: 3 }, y: { $gte: 4 } });
c.sql();
// -> 'x > ? AND y >= ?'
c.params();
// -> [3, 4]
```

or raw:

```js
var c = criterion("x > ? AND y >= ?", 3, 4);
```

or functional:

```js
var c = criterion.and(
  criterion.gt(criterion.escape("x"), 3),
  criterion.gte(criterion.escape("y"), 4)
);
```

#### null

where `x` is `null`

```js
var c = criterion({x: {$null: true});
c.sql();
// -> 'x IS NULL'
c.params();
// -> []
```

or raw:

```js
var c = criterion("x IS NULL");
```

or functional:

```js
var c = criterion.null(criterion.escape("x"), true);
// true is default
```

#### not null

where `x` is not `null`:

```js
var c = criterion({ x: { $null: false } });
c.sql();
// -> 'x IS NOT NULL'
c.params();
// -> []
```

or raw:

```js
var c = criterion("x IS NOT NULL");
```

or functional:

```js
var c = criterion.null(criterion.escape("x"), false);
```

### boolean operations

`$or`, `$and` and `$not` can be nested arbitrarily.

#### and

where `x = 7` and `y = 'a'`:

```js
var c = criterion({ x: 7, y: "a" });
c.sql();
// -> 'x = ? AND y = ?'
c.params();
// -> [7, 'a']
```

or using an array:

```js
var c = criterion([{ x: 7 }, { y: "a" }]);
```

or more verbose:

```js
var c = criterion({ $and: { x: 7, y: "a" } });
```

or more verbose using an array:

```js
var c = criterion({ $and: [{ x: 7 }, { y: "a" }] });
```

or raw:

```js
var c = criterion("x = ? AND y = ?", 7, "a");
```

or functional:

```js
var c = criterion.and(
  criterion.eq(criterion.escape("x"), 7),
  criterion.eq(criterion.escape("y"), "a")
);
```

#### or

where `x = 7` or `y = 6`:

```js
var c = criterion({ $or: { x: 7, y: 6 } });
c.sql();
// -> 'x = ? OR y = ?'
c.params();
// -> [7, 6]
```

or using an array:

```js
var c = criterion({ $or: [{ x: 7 }, { y: 6 }] });
```

or raw:

```js
var c = criterion("x = ? OR y = ?", 7, 6);
```

or functional:

```js
var c = criterion.or(
  criterion.eq(criterion.escape("x"), 7),
  criterion.eq(criterion.escape("y"), 6)
);
```

#### not

where not (`x > 3` and `y >= 4`):

```js
var c = criterion({ $not: { x: { $gt: 3 }, y: { $gte: 4 } } });
c.sql();
// -> 'NOT (x > ? AND y >= ?)'
c.params();
// -> [3, 4]
```

or raw:

```js
var c = criterion("NOT (x > ? AND y >= ?)", 3, 4);
```

or functional:

```js
var c = criterion.not(
  criterion.and(
    criterion.eq(criterion.escape("x"), 3),
    criterion.eq(criterion.escape("y"), 4)
  )
);
```

`$or`, `$and` and `$not` can be nested arbitrarily.

### lists of scalar expressions

[see also the postgres documentation on row and array comparisons](http://www.postgresql.org/docs/9.3/static/functions-comparisons.html)

#### in list

where `x` is in `[1, 2, 3]`

```js
var c = criterion({ x: [1, 2, 3] });
c.sql();
// -> 'x IN (?, ?, ?)'
c.params();
// -> [1,2,3]
```

or more verbose:

```js
var c = criterion({ x: { $in: [1, 2, 3] } });
```

or raw:

```js
var c = criterion("x IN (?)", [1, 2, 3]);
```

or functional:

```js
var c = criterion.in(criterion.escape("x"), [1, 2, 3]);
```

#### not in list

where `x` is not in `[1, 2, 3]`

```js
var c = criterion({ x: { $nin: [1, 2, 3] } });
c.sql();
// -> 'x NOT IN (?, ?, ?)'
c.params();
// -> [1,2,3]
```

or raw:

```js
var c = criterion("x NOT IN (?)", [1, 2, 3]);
```

or functional:

```js
var c = criterion.nin(criterion.escape("x"), [1, 2, 3]);
```

### subqueries

`var subquery` in the examples below can be any [sql-fragment](#the-sql-fragment-interface).

the fact that [mohair](http://github.com/snd/mohair)/[mesa](http://github.com/snd/mesa)-queries are _sql-fragments_
allows you to model subqueries with mohair/mesa
and then use them directly in _condition-objects_.
this makes the creation of SQL-where-conditions that contain subqueries quite elegant.

[see also the postgres documentation on row and array comparisons](http://www.postgresql.org/docs/9.3/static/functions-comparisons.html)

#### in subquery

where `x` is in subquery:

```js
var subquery = mohair.table("post").where({ is_published: true }).select("id");

var c = criterion({ x: { $in: subquery } });

c.sql();
// -> 'x IN (SELECT id FROM post WHERE is_published = ?)'
c.params();
// -> [true]
```

or functional:

```js
var c = criterion.in(criterion.escape("x"), subquery);
```

#### not in subquery

where `x` is not in subquery:

```js
var subquery = mohair.table("post").where({ is_published: true }).select("id");

var c = criterion({ x: { $nin: subquery } });

c.sql();
// -> 'x NOT IN (SELECT id FROM post WHERE is_published = ?)'
c.params();
// -> [true]
```

or functional:

```js
var c = criterion.nin(criterion.escape("x"), subquery);
```

#### subquery returns any rows

```js
# TODO this isnt right
var subquery = mohair
  .table('post')
  .where({is_published: false})
  .where({user_id: mohair.raw('id')})

var c = criterion({$exists: subquery})

c.sql();
// -> 'EXISTS (SELECT * FROM post WHERE is_published = ?)'
c.params();
// -> [true]
```

or functional:

```js
var c = criterion.exists(subquery);
```

#### compare to any/all in subquery

```js
var subquery = mohair.table("post").select("id").where({ is_published: false });

var c = criterion({ x: { $any: subquery } });

c.sql();
// -> 'x = ANY (SELECT * FROM post WHERE is_published = ?)'
c.params();
// -> [true]
```

or functional:

```js
var c = criterion.any(criterion.escape("x"), subquery);
```

criterion supports

#### row-wise comparison with subqueries

find published posts that were created strictly-before the user with `id = 1` was created:

```js
var mohair = require("mohair");

var creationDateOfUserWithId1 = mohair
  .table("user")
  .where({ id: 1 })
  .select("created_at");

var postsCreatedBeforeUser = mohair
  .table("post")
  .where({ is_published: true })
  .where({ created_at: { $lt: creationDateOfUserWithId1 } });

postsCreatedBeforeUser.sql();
// ->
// 'SELECT *
//  FROM post
//  WHERE is_published = ?
//  AND created_at < (SELECT created_at FROM user WHERE id = ?)'
postsCreatedBeforeUser.params();
// -> [true, 1]
```

## advanced topics

### combining criteria with `.and()`

```js
var alpha = criterion({ x: 7, y: "a" });
var bravo = criterion("z = ?", true);

alpha.and(bravo).sql();
// -> '(x = ?) AND (y = ?) AND (z = ?)'
alpha.and(bravo).params();
// -> [7, 'a', true]
```

`and()`, `or()` and `not()` return new objects.
no method ever changes the object it is called on.

### combining criteria with `.or()`

```js
var alpha = criterion({ x: 7, y: "a" });
var bravo = criterion("z = ?", true);

bravo.or(alpha).sql();
// -> '(z = ?) OR (x = ? AND y = ?)'
bravo.or(alpha).params();
// -> [true, 7, 'a']
```

`and()`, `or()` and `not()` return new objects.
no method ever changes the object it is called on.

### negating criteria with `.not()`

```js
var c = criterion({ x: 7, y: "a" });
c.not().sql();
// -> 'NOT ((x = ?) AND (y = ?))'
c.not().params();
// -> [7, 'a']
```

double negations are removed:

```js
var c = criterion({ x: 7, y: "a" });
c.not().not().sql();
// -> '(x = ?) AND (y = ?)'
c.not().not().params();
// -> [7, 'a']
```

### escaping column names

you can pass a function into any `sql()` method to escape column names:

```js
var c = criterion({ x: 7, y: 8 });

var escape = function (x) {
  return '"' + x + '"';
};
c.sql(escape);
// -> '"x" = ? AND "y" = ?' <- x and y are escaped !
c.params();
// -> [7, 8]
```

### param array explosion

if a parameter binding for raw sql is an array then
the corresponding binding `?` is exploded into a list of `?`:

```js
var c = criterion("x = ? AND y IN (?)", 7, [8, 9, 10]);

c.sql();
// -> 'x = ? AND y IN (?, ?, ?)'
c.params();
// -> [7, 8, 9, 10]
```

```js
var c = criterion("x = ? AND (y && ARRAY[?])", 7, [8, 9, 10]);

c.sql();
// -> 'x = ? AND (y && ARRAY[?, ?, ?])'
c.params();
// -> [7, 8, 9, 10]
```

## changelog

### 0.4.0

- to escape column names in the resulting SQL an escape function can now be passed as an argument into any `sql()` method
- sql fragments are now always wrapped in parentheses before pasting them into a query.
  - doesn't break anything and makes subqueries work without further changes.
- added `$exists` which can be used with mesa/mohair queries (or any object that responds to an `sql()` method): `criterion({$exists: mohair.table('post').where({id: 7})})`
- `$in` and `$nin` now support not just lists of values but also subqueries:
  - `criterion({id: {$in: mohair.table('post').where({is_active: true}).select('id')}})`
- added modifiers `$any`, `$neAny`, `$ltAny`, `$gtAny`, `$gteAny`, `$all`, `$neAll`, `$ltAll`, `$lteAll`, `$gtAll`, `$gteAll` to be used with subqueries:
  - `criterion({created_at: {$gteAll: mohair.table('post').where({is_active: true}).select('updated_at')}})`
- sql-fragments can now be used in more places...
  - where the value would normally go in a comparison: `{$lt: criterion('5 + 8')}`
    - this makes row-wise comparisons with subqueries possible
  - in the arrays passed to `$or` and `$and`: `{$or [{a: 7}, criterion('b < ?', 5)]}`
  - ...
- bugfixes
  - made some (exotic) condition-objects work which didn't work before
- improved implementation and based everything on a DSL which is also exposed
- major improvements to
  - code quality
  - tests
  - terminology
  - documentation

## [license: MIT](LICENSE)

## TODO

- test dsl
- document dsl
- read through the code again
- often the left side of an operation is just a column or a table qualified column
- atoms are treated as values
- dontWrap
  - says how outer fragments should handle this fragment
  - things are only wrapped when inside of something
- finish the readme
- test left operands
  - reverse operands
