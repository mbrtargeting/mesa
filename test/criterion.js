/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let C;
const criterion = (C = require('../lib/criterion'));

const escape = (x) => '"' + x + '"';

module.exports = {
  'successfully making criteria': {
    'x = 7'(test) {
      const SQL = 'x = ?';
      const ESCAPED = '"x" = ?';
      const PARAMS = [7];

      const lang1 = criterion({x: 7});
      const lang2 = criterion({x: {$eq: 7}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.eq(C.escape('x'), 7);
      const dslReversed = C.eq(7, C.escape('x'));

      test.equal(lang1.sql(), SQL);
      test.equal(lang1.sql(escape), ESCAPED);
      test.deepEqual(lang1.params(), PARAMS);

      test.equal(lang2.sql(), SQL);
      test.equal(lang2.sql(escape), ESCAPED);
      test.deepEqual(lang2.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      test.equal(dslReversed.sql(), '? = x');

      return test.done();
    },

    '!='(test) {
      const SQL = 'x != ?';
      const ESCAPED = '"x" != ?';
      const PARAMS = ['a'];

      const lang = criterion({x: {$ne: 'a'}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.ne(C.escape('x'), 'a');

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    '< AND <='(test) {
      const SQL = '(x < ?) AND (y <= ?)';
      const ESCAPED = '("x" < ?) AND ("y" <= ?)';
      const PARAMS = [3, 4];

      const lang = criterion({x: {$lt: 3}, y: {$lte: 4}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.and(C.lt(C.escape('x'), 3), C.lte(C.escape('y'), 4));
      const combined = criterion({x: {$lt: 3}}).and({y: {$lte: 4}});

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      test.equal(combined.sql(), SQL);
      test.equal(combined.sql(escape), ESCAPED);
      test.deepEqual(combined.params(), PARAMS);

      return test.done();
    },

    '> AND >='(test) {
      const SQL = '(x > ?) AND (y >= ?)';
      const ESCAPED = '("x" > ?) AND ("y" >= ?)';
      const PARAMS = [5, 6];

      const lang = criterion({x: {$gt: 5}, y: {$gte: 6}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.and(C.gt(C.escape('x'), 5), C.gte(C.escape('y'), 6));

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'x IS NULL'(test) {
      const SQL = 'x IS NULL';
      const ESCAPED = '"x" IS NULL';
      const PARAMS = [];

      const lang = criterion({x: {$null: true}});
      const raw = criterion(SQL);
      const dsl = C.null(C.escape('x'));

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'x IS NOT NULL'(test) {
      const SQL = 'x IS NOT NULL';
      const ESCAPED = '"x" IS NOT NULL';
      const PARAMS = [];

      const lang = criterion({x: {$null: false}});
      const raw = criterion(SQL);
      const dsl = C.null(C.escape('x'), false);

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'x IN (?, ?, ?)'(test) {
      const SQL = 'x IN (?, ?, ?)';
      const ESCAPED = '"x" IN (?, ?, ?)';
      const PARAMS = [1, 2, 3];

      const lang = criterion({x: [1, 2, 3]});
      const langLong = criterion({x: {$in: [1, 2, 3]}});
      const raw1 = criterion(SQL, 1, 2, 3);
      const raw2 = criterion('x IN (?)', [1, 2, 3]);
      const dsl = C.in(C.escape('x'), [1, 2, 3]);

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(langLong.sql(), SQL);
      test.equal(langLong.sql(escape), ESCAPED);
      test.deepEqual(langLong.params(), PARAMS);

      test.equal(raw1.sql(), SQL);
      test.equal(raw1.sql(escape), SQL);
      test.deepEqual(raw1.params(), PARAMS);

      test.equal(raw2.sql(), SQL);
      test.equal(raw2.sql(escape), SQL);
      test.deepEqual(raw2.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'NOT IN'(test) {
      const SQL = 'x NOT IN (?, ?, ?)';
      const ESCAPED = '"x" NOT IN (?, ?, ?)';
      const PARAMS = [1, 2, 3];

      const lang = criterion({x: {$nin: [1, 2, 3]}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.nin(C.escape('x'), [1, 2, 3]);

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    AND(test) {
      const SQL = '(x = ?) AND (y = ?) AND (z = ?) AND a = ?';
      const ESCAPED = '("x" = ?) AND ("y" = ?) AND ("z" = ?) AND a = ?';
      const PARAMS = [7, 'foo', 2.5, 6];

      const lang1 = criterion({x: 7, y: 'foo'}, {z: 2.5}, [
        criterion('a = ?', 6),
      ]);
      const lang2 = criterion([
        {x: 7, y: 'foo'},
        {z: 2.5},
        criterion('a = ?', 6),
      ]);
      const lang3 = criterion({
        $and: [{x: 7, y: 'foo'}, {z: 2.5}, criterion('a = ?', 6)],
      });
      const lang4 = criterion({
        x: 7,
        y: 'foo',
        $and: [{z: 2.5}, criterion('a = ?', 6)],
      });
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl1 = C.and(
        C.eq(C.escape('x'), 7),
        C.eq(C.escape('y'), 'foo'),
        C.eq(C.escape('z'), 2.5),
        C('a = ?', 6),
      );
      const dsl2 = C.and(
        C.eq(C.escape('x'), 7),
        C.eq(C.escape('y'), 'foo'),
        C.and(C.eq(C.escape('z'), 2.5), C('a = ?', 6)),
      );
      const dsl3 = C(
        C.eq(C.escape('x'), 7),
        C.eq(C.escape('y'), 'foo'),
        C(C.eq(C.escape('z'), 2.5), C('a = ?', 6)),
      );

      test.equal(lang1.sql(), SQL);
      test.equal(lang1.sql(escape), ESCAPED);
      test.deepEqual(lang1.params(), PARAMS);

      test.equal(lang2.sql(), SQL);
      test.equal(lang2.sql(escape), ESCAPED);
      test.deepEqual(lang2.params(), PARAMS);

      test.equal(lang3.sql(), SQL);
      test.equal(lang3.sql(escape), ESCAPED);
      test.deepEqual(lang3.params(), PARAMS);

      test.equal(lang4.sql(), SQL);
      test.equal(lang4.sql(escape), ESCAPED);
      test.deepEqual(lang4.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl1.sql(), SQL);
      test.equal(dsl1.sql(escape), ESCAPED);
      test.deepEqual(dsl1.params(), PARAMS);

      test.equal(dsl2.sql(), SQL);
      test.equal(dsl2.sql(escape), ESCAPED);
      test.deepEqual(dsl2.params(), PARAMS);

      test.equal(dsl3.sql(), SQL);
      test.equal(dsl3.sql(escape), ESCAPED);
      test.deepEqual(dsl3.params(), PARAMS);

      return test.done();
    },

    OR(test) {
      const SQL = '(x = ?) OR (y = ?) OR (z = ?) OR a = ?';
      const ESCAPED = '("x" = ?) OR ("y" = ?) OR ("z" = ?) OR a = ?';
      const PARAMS = [7, 'foo', 2.5, 6];

      const lang1 = criterion({
        $or: [{x: 7}, {y: 'foo'}, {z: 2.5}, criterion('a = ?', 6)],
      });
      const lang2 = criterion({
        $or: {x: 7, y: 'foo', $or: [{z: 2.5}, criterion('a = ?', 6)]},
      });
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl1 = C.or(
        C.eq(C.escape('x'), 7),
        C.eq(C.escape('y'), 'foo'),
        C.eq(C.escape('z'), 2.5),
        C('a = ?', 6),
      );
      const dsl2 = C.or(
        C.eq(C.escape('x'), 7),
        C.eq(C.escape('y'), 'foo'),
        C.or(C.eq(C.escape('z'), 2.5), C('a = ?', 6)),
      );

      test.equal(lang1.sql(), SQL);
      test.equal(lang1.sql(escape), ESCAPED);
      test.deepEqual(lang1.params(), PARAMS);

      test.equal(lang2.sql(), SQL);
      test.equal(lang2.sql(escape), ESCAPED);
      test.deepEqual(lang2.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl1.sql(), SQL);
      test.equal(dsl1.sql(escape), ESCAPED);
      test.deepEqual(dsl1.params(), PARAMS);

      test.equal(dsl2.sql(), SQL);
      test.equal(dsl2.sql(escape), ESCAPED);
      test.deepEqual(dsl2.params(), PARAMS);

      return test.done();
    },

    NOT(test) {
      const SQL = 'NOT ((x > ?) AND (y >= ?))';
      const ESCAPED = 'NOT (("x" > ?) AND ("y" >= ?))';
      const PARAMS = [3, 4];

      const lang = criterion({$not: {x: {$gt: 3}, y: {$gte: 4}}});
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.not(C.and(C.gt(C.escape('x'), 3), C.gte(C.escape('y'), 4)));

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'OR inside AND (is wrapped in parentheses)'(test) {
      const SQL =
        '(username = ?) AND (password = ?) AND ((active = ?) OR (active IS NULL))';
      const ESCAPED =
        '("username" = ?) AND ("password" = ?) AND (("active" = ?) OR ("active" IS NULL))';
      const PARAMS = ['user', 'hash', 1];

      const lang = criterion({
        username: 'user',
        password: 'hash',
        $or: [{active: 1}, {active: {$null: true}}],
      });
      const raw = criterion(SQL, ...Array.from(PARAMS));
      const dsl = C.and(
        C.eq(C.escape('username'), 'user'),
        C.eq(C.escape('password'), 'hash'),
        C.or(C.eq(C.escape('active'), 1), C.null(C.escape('active'))),
      );

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'AND, OR and NOT can be deeply nested'(test) {
      const SQL =
        '(alpha = ?) OR ((charlie != ?) AND (NOT (((delta = ?) OR (delta IS NULL)) AND (echo = ?)))) OR ((echo < ?) AND ((golf = ?) OR (NOT (lima != ?)))) OR (foxtrot = ?) OR (NOT (alpha = ? OR (NOT (echo < ?)) OR (alpha < ?) OR (bravo = ?) OR ((alpha = ?) AND (bravo = ?)))) OR (bravo = ?)';
      const ESCAPED =
        '("alpha" = ?) OR (("charlie" != ?) AND (NOT ((("delta" = ?) OR ("delta" IS NULL)) AND ("echo" = ?)))) OR (("echo" < ?) AND (("golf" = ?) OR (NOT ("lima" != ?)))) OR ("foxtrot" = ?) OR (NOT (alpha = ? OR (NOT ("echo" < ?)) OR ("alpha" < ?) OR ("bravo" = ?) OR (("alpha" = ?) AND ("bravo" = ?)))) OR ("bravo" = ?)';
      const PARAMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

      const lang = criterion({
        $or: {
          alpha: 1,
          $and: {
            charlie: {$ne: 2},
            $not: {
              $and: {
                $or: [{delta: 3}, {delta: {$null: true}}],
                echo: 4,
              },
            },
          },
          $or: [
            [
              {echo: {$lt: 5}},
              {
                $or: {
                  golf: 6,
                  $not: {lima: {$ne: 7}},
                },
              },
            ],
            {foxtrot: 8},
          ],
          $not: {
            $or: [
              criterion('alpha = ?', 9),
              {$not: {echo: {$lt: 10}}},
              {alpha: {$lt: 11}},
              {bravo: 12},
              [{alpha: 13}, {bravo: 14}],
            ],
          },
          bravo: 15,
        },
      });
      const raw = criterion(SQL, ...Array.from(PARAMS));

      const dsl = C.or(
        C.eq(C.escape('alpha'), 1),
        C.and(
          C.ne(C.escape('charlie'), 2),
          C.not(
            C.and(
              C.or(C.eq(C.escape('delta'), 3), C.null(C.escape('delta'))),
              C.eq(C.escape('echo'), 4),
            ),
          ),
        ),
        C.or(
          C.and(
            C.lt(C.escape('echo'), 5),
            C.or(C.eq(C.escape('golf'), 6), C.not(C.ne(C.escape('lima'), 7))),
          ),
          C.eq(C.escape('foxtrot'), 8),
        ),
        C.not(
          C.or(
            C('alpha = ?', 9),
            C.not(C.lt(C.escape('echo'), 10)),
            C.lt(C.escape('alpha'), 11),
            C.eq(C.escape('bravo'), 12),
            C(C.eq(C.escape('alpha'), 13), C.eq(C.escape('bravo'), 14)),
          ),
        ),
        C.eq(C.escape('bravo'), 15),
      );

      test.equal(lang.sql(), SQL);
      test.equal(lang.sql(escape), ESCAPED);
      test.deepEqual(lang.params(), PARAMS);

      test.equal(raw.sql(), SQL);
      test.equal(raw.sql(escape), SQL);
      test.deepEqual(raw.params(), PARAMS);

      test.equal(dsl.sql(), SQL);
      test.equal(dsl.sql(escape), ESCAPED);
      test.deepEqual(dsl.params(), PARAMS);

      return test.done();
    },

    'IN and $nin'(test) {
      const subquery = {
        sql(escape) {
          return `SELECT ${escape('id')} FROM \"user\" WHERE ${escape(
            'is_active',
          )}`;
        },
        params() {
          return [];
        },
      };

      const subqueryWithParams = {
        sql(escape) {
          return `SELECT ${escape('id')} FROM \"user\" WHERE ${escape(
            'is_active',
          )} = ?`;
        },
        params() {
          return [true];
        },
      };

      const inWithoutParams = criterion({x: {$in: subquery}});

      test.equal(
        inWithoutParams.sql(),
        'x IN (SELECT id FROM "user" WHERE is_active)',
      );
      test.equal(
        inWithoutParams.sql(escape),
        '"x" IN (SELECT "id" FROM "user" WHERE "is_active")',
      );
      test.deepEqual(inWithoutParams.params(), []);

      const inWithParams = criterion({x: {$in: subqueryWithParams}});

      test.equal(
        inWithParams.sql(),
        'x IN (SELECT id FROM "user" WHERE is_active = ?)',
      );
      test.equal(
        inWithParams.sql(escape),
        '"x" IN (SELECT "id" FROM "user" WHERE "is_active" = ?)',
      );
      test.deepEqual(inWithParams.params(), [true]);

      const ninWithoutParams = criterion({x: {$nin: subquery}});

      test.equal(
        ninWithoutParams.sql(),
        'x NOT IN (SELECT id FROM "user" WHERE is_active)',
      );
      test.equal(
        ninWithoutParams.sql(escape),
        '"x" NOT IN (SELECT "id" FROM "user" WHERE "is_active")',
      );
      test.deepEqual(ninWithoutParams.params(), []);

      const ninWithParams = criterion({x: {$nin: subqueryWithParams}});

      test.equal(
        ninWithParams.sql(),
        'x NOT IN (SELECT id FROM "user" WHERE is_active = ?)',
      );
      test.equal(
        ninWithParams.sql(escape),
        '"x" NOT IN (SELECT "id" FROM "user" WHERE "is_active" = ?)',
      );
      test.deepEqual(ninWithParams.params(), [true]);

      return test.done();
    },

    $exists(test) {
      const subquery = {
        sql(escape) {
          return `SELECT * FROM \"user\" WHERE ${escape('is_active')}`;
        },
        params() {
          return [];
        },
      };
      const subqueryWithParams = {
        sql(escape) {
          return `SELECT * FROM \"user\" WHERE ${escape('is_active')} = ?`;
        },
        params() {
          return [true];
        },
      };

      const existsWithoutParams = criterion({id: 7, $exists: subquery});

      test.equal(
        existsWithoutParams.sql(),
        '(id = ?) AND (EXISTS (SELECT * FROM "user" WHERE is_active))',
      );
      test.equal(
        existsWithoutParams.sql(escape),
        '("id" = ?) AND (EXISTS (SELECT * FROM "user" WHERE "is_active"))',
      );
      test.deepEqual(existsWithoutParams.params(), [7]);

      const existsWithParams = criterion({
        id: 7,
        $exists: subqueryWithParams,
      });

      test.equal(
        existsWithParams.sql(),
        '(id = ?) AND (EXISTS (SELECT * FROM "user" WHERE is_active = ?))',
      );
      test.equal(
        existsWithParams.sql(escape),
        '("id" = ?) AND (EXISTS (SELECT * FROM "user" WHERE "is_active" = ?))',
      );
      test.deepEqual(existsWithParams.params(), [7, true]);

      return test.done();
    },

    '$any, $neAny, $ltAny, $lteAny, $gtAny, $gteAny, $all, $neAll, $ltAll, $lteAll, $gtAll, $gteAll'(
      test,
    ) {
      const subquery = {
        sql(escape) {
          return `SELECT * FROM ${escape('user')}`;
        },
        params() {
          return [];
        },
      };

      const subqueryWithParams = {
        sql(escape) {
          return `SELECT * FROM ${escape('user')} WHERE ${escape('id')} = ?`;
        },
        params() {
          return [7];
        },
      };

      const anyWithoutParams = criterion({x: {$any: subquery}});

      test.equal(anyWithoutParams.sql(), 'x = ANY (SELECT * FROM user)');
      test.equal(
        anyWithoutParams.sql(escape),
        '"x" = ANY (SELECT * FROM "user")',
      );
      test.deepEqual(anyWithoutParams.params(), []);

      const anyWithParams = criterion({
        x: {$any: subqueryWithParams},
        y: 6,
      });

      test.equal(
        anyWithParams.sql(),
        '(x = ANY (SELECT * FROM user WHERE id = ?)) AND (y = ?)',
      );
      test.equal(
        anyWithParams.sql(escape),
        '("x" = ANY (SELECT * FROM "user" WHERE "id" = ?)) AND ("y" = ?)',
      );
      test.deepEqual(anyWithParams.params(), [7, 6]);

      // since all other subqueries follow the same code path
      // we omit testing with params and escaping for them

      test.equal(
        criterion({x: {$neAny: subquery}}).sql(),
        'x != ANY (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$ltAny: subquery}}).sql(),
        'x < ANY (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$lteAny: subquery}}).sql(),
        'x <= ANY (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$gtAny: subquery}}).sql(),
        'x > ANY (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$gteAny: subquery}}).sql(),
        'x >= ANY (SELECT * FROM user)',
      );

      test.equal(
        criterion({x: {$all: subquery}}).sql(),
        'x = ALL (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$neAll: subquery}}).sql(),
        'x != ALL (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$ltAll: subquery}}).sql(),
        'x < ALL (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$lteAll: subquery}}).sql(),
        'x <= ALL (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$gtAll: subquery}}).sql(),
        'x > ALL (SELECT * FROM user)',
      );
      test.equal(
        criterion({x: {$gteAll: subquery}}).sql(),
        'x >= ALL (SELECT * FROM user)',
      );

      return test.done();
    },

    'row-wise comparison'(test) {
      const subquery = {
        sql(escape) {
          return `SELECT ${escape('created_at')} FROM ${escape(
            'message',
          )} WHERE ${escape('id')} = ?`;
        },
        params() {
          return [1];
        },
      };

      const c = criterion({is_active: true, created_at: {$lte: subquery}});

      test.equal(
        c.sql(),
        '(is_active = ?) AND (created_at <= (SELECT created_at FROM message WHERE id = ?))',
      );
      test.equal(
        c.sql(escape),
        '("is_active" = ?) AND ("created_at" <= (SELECT "created_at" FROM "message" WHERE "id" = ?))',
      );
      test.deepEqual(c.params(), [true, 1]);

      return test.done();
    },

    'with one param and one array'(test) {
      const c = criterion('x = ? AND y IN (?)', 7, [8, 9, 10]);

      test.equal(c.sql(), 'x = ? AND y IN (?, ?, ?)');
      test.deepEqual(c.params(), [7, 8, 9, 10]);

      return test.done();
    },

    'with two params and array'(test) {
      const c = criterion('x = ? AND y = ? AND z IN (?)', 7, 8, [9, 10, 11]);

      test.equal(c.sql(), 'x = ? AND y = ? AND z IN (?, ?, ?)');
      test.deepEqual(c.params(), [7, 8, 9, 10, 11]);

      return test.done();
    },

    'with two params and two arrays'(test) {
      const c = criterion(
        'x = ? AND y = ? AND z IN (?) AND (a && ARRAY[?])',
        7,
        8,
        [9, 10, 11],
        [12, 13, 14],
      );

      test.equal(
        c.sql(),
        'x = ? AND y = ? AND z IN (?, ?, ?) AND (a && ARRAY[?, ?, ?])',
      );
      test.deepEqual(c.params(), [7, 8, 9, 10, 11, 12, 13, 14]);

      return test.done();
    },

    'equality with criterion argument'(test) {
      const c = criterion({
        x: criterion('crypt(?, gen_salt(?, ?))', 'password', 'bf', 4),
      });

      test.equal(c.sql(), 'x = crypt(?, gen_salt(?, ?))');
      test.equal(c.sql(escape), '"x" = crypt(?, gen_salt(?, ?))');
      test.deepEqual(c.params(), ['password', 'bf', 4]);

      return test.done();
    },

    '$ne with criterion argument'(test) {
      const c = criterion({
        x: {$ne: criterion('crypt(?, gen_salt(?, ?))', 'password', 'bf', 4)},
      });

      test.equal(c.sql(), 'x != crypt(?, gen_salt(?, ?))');
      test.equal(c.sql(escape), '"x" != crypt(?, gen_salt(?, ?))');
      test.deepEqual(c.params(), ['password', 'bf', 4]);

      return test.done();
    },

    '$lt with criterion argument'(test) {
      const c = criterion({x: {$lt: criterion('NOW()')}});

      test.equal(c.sql(), 'x < NOW()');
      test.equal(c.sql(escape), '"x" < NOW()');
      test.deepEqual(c.params(), []);

      return test.done();
    },
  },

  'successfully manipulating criteria': {
    and(test) {
      const fst = criterion({x: 7, y: 'foo'});
      const snd = criterion('z = ?', true);

      const fstAndSnd = fst.and(snd);

      test.equal(fstAndSnd.sql(), '(x = ?) AND (y = ?) AND z = ?');
      test.deepEqual(fstAndSnd.params(), [7, 'foo', true]);

      return test.done();
    },

    or(test) {
      const fst = criterion({x: 7, y: 'foo'});
      const snd = criterion('z = ?', true);

      const sndOrFst = snd.or(fst);

      test.equal(sndOrFst.sql(), 'z = ? OR ((x = ?) AND (y = ?))');
      test.deepEqual(sndOrFst.params(), [true, 7, 'foo']);

      return test.done();
    },

    not(test) {
      const c = criterion({x: 7, y: 'foo'});

      test.equal(c.not().sql(), 'NOT ((x = ?) AND (y = ?))');
      test.deepEqual(c.not().params(), [7, 'foo']);

      return test.done();
    },

    'double negation is removed'(test) {
      const c = criterion({x: 7, y: 'foo'});

      test.equal(c.not().not().sql(), '(x = ?) AND (y = ?)');
      test.deepEqual(c.not().not().params(), [7, 'foo']);

      test.equal(c.not().not().not().sql(), 'NOT ((x = ?) AND (y = ?))');
      test.deepEqual(c.not().not().not().params(), [7, 'foo']);

      return test.done();
    },
  },

  'errors when making criteria': {
    'not string or object'(test) {
      try {
        return criterion(6);
      } catch (e) {
        test.equal(
          e.message,
          'string or object expected as first argument but number given',
        );
        return test.done();
      }
    },

    'empty object'(test) {
      let e;
      try {
        criterion({});
      } catch (error) {
        e = error;
        test.equal(e.message, 'empty condition-object');
      }

      try {
        return criterion([{}]);
      } catch (error1) {
        e = error1;
        test.equal(e.message, 'empty condition-object');

        return test.done();
      }
    },

    'empty array param'(test) {
      try {
        return criterion('b < ? AND a IN(?) AND c < ?', 6, [], 7);
      } catch (e) {
        test.equal(e.message, 'params[1] is an empty array');
        return test.done();
      }
    },

    'null value with modifier'(test) {
      try {
        return criterion({x: {$lt: null}});
      } catch (e) {
        test.equal(
          e.message,
          'value undefined or null for key x and modifier key $lt',
        );
        return test.done();
      }
    },

    'null value without modifier'(test) {
      try {
        return criterion({x: null});
      } catch (e) {
        test.equal(e.message, 'value undefined or null for key x');
        return test.done();
      }
    },

    'in with empty array'(test) {
      try {
        return criterion({x: []});
      } catch (e) {
        test.equal(e.message, '`in` with empty array as right operand');
        return test.done();
      }
    },

    '$nin with empty array'(test) {
      try {
        return criterion({x: {$nin: []}});
      } catch (e) {
        test.equal(e.message, '`nin` with empty array as right operand');
        return test.done();
      }
    },

    '$any with array'(test) {
      try {
        return criterion({x: {$any: [1]}});
      } catch (e) {
        test.equal(
          e.message,
          '`any` doesn\'t support array as right operand. only `in` and `nin` do!',
        );
        return test.done();
      }
    },

    '$any with number'(test) {
      try {
        return criterion({x: {$any: 6}});
      } catch (e) {
        test.equal(
          e.message,
          '`any` requires right operand that implements sql-fragment interface',
        );
        return test.done();
      }
    },

    'unknown modifier'(test) {
      let e;
      try {
        criterion({x: {$not: 6}});
      } catch (error) {
        e = error;
        test.equal(e.message, 'unknown modifier key $not');
      }

      try {
        return criterion({x: {$foo: 6}});
      } catch (error1) {
        e = error1;
        test.equal(e.message, 'unknown modifier key $foo');

        return test.done();
      }
    },

    '$exists without sql-fragment'(test) {
      try {
        return criterion({$exists: 6});
      } catch (e) {
        test.equal(
          e.message,
          '`exists` operand must implement sql-fragment interface',
        );
        return test.done();
      }
    },

    '$in without array or sql-fragment'(test) {
      try {
        return criterion({x: {$in: 6}});
      } catch (e) {
        test.equal(
          e.message,
          '`in` requires right operand that is an array or implements sql-fragment interface',
        );
        return test.done();
      }
    },

    '$nin without array or sql-fragment'(test) {
      try {
        return criterion({x: {$nin: 6}});
      } catch (e) {
        test.equal(
          e.message,
          '`nin` requires right operand that is an array or implements sql-fragment interface',
        );
        return test.done();
      }
    },
  },
};
