/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash');

const {setup, mesa} = require('./src/common');

// mesa = mesa.debug((args...) -> console.log args[...3]...)

const movieTable = mesa.table('movie');
const personTable = mesa.table('person');
const starringTable = mesa.table('starring');

const idWhereName = (array, name) => _.find(array, {name}).id;

const names = (array) => _.map(array, 'name');

const {normalizeLink, normalizeIncludeArguments} = mesa.helpers;

module.exports = {
  unit: {
    normalizeLink: {
      'original link is not modified'(test) {
        const link = {};
        const actual = normalizeLink(movieTable, personTable, {});
        test.notEqual(link, actual);
        return test.done();
      },

      'no autocomplete'(test) {
        const complete = {
          left: 'left',
          right: 'right',
          forward: 'forward',
          first: 'first',
          as: 'as',
        };
        const actual = normalizeLink(movieTable, personTable, complete);
        test.deepEqual(_.clone(complete), actual);
        return test.done();
      },

      'autocomplete (full)'(test) {
        const expected = {
          left: 'id',
          right: 'movie_id',
          forward: true,
          first: false,
        };
        const actual = normalizeLink(movieTable, personTable);
        test.deepEqual(expected, actual);
        return test.done();
      },

      'autocomplete with custom primary keys'(test) {
        const expected = {
          left: 'foo',
          right: 'movie_foo',
          forward: true,
          first: false,
        };
        const actual = normalizeLink(
          movieTable.primaryKey('foo'),
          personTable.primaryKey('bar'),
        );
        test.deepEqual(expected, actual);
        return test.done();
      },

      'autocomplete {forward: false}'(test) {
        const expected = {
          left: 'person_id',
          right: 'id',
          forward: false,
          first: false,
        };
        const actual = normalizeLink(movieTable, personTable, {
          forward: false,
        });
        test.deepEqual(expected, actual);
        return test.done();
      },

      'autocomplete {forward: false} with custom primary keys'(test) {
        const expected = {
          left: 'person_bar',
          right: 'bar',
          forward: false,
          first: false,
        };
        const actual = normalizeLink(
          movieTable.primaryKey('foo'),
          personTable.primaryKey('bar'),
          {forward: false},
        );
        test.deepEqual(expected, actual);
        return test.done();
      },

      'autocomplete {as: true}'(test) {
        const expected = {
          left: 'id',
          right: 'movie_id',
          forward: true,
          first: false,
          as: 'persons',
        };
        const actual = normalizeLink(movieTable, personTable, {as: true});
        test.deepEqual(expected, actual);
        return test.done();
      },

      'autocomplete {as: true, first: true}'(test) {
        const expected = {
          left: 'id',
          right: 'movie_id',
          forward: true,
          first: true,
          as: 'person',
        };
        const actual = normalizeLink(movieTable, personTable, {
          as: true,
          first: true,
        });
        test.deepEqual(expected, actual);
        return test.done();
      },
    },

    normalizeIncludeArguments: {
      'zero arguments'(test) {
        const actual = normalizeIncludeArguments();
        test.deepEqual(actual, []);
        return test.done();
      },

      // TODO throw an error in the future
      'single table is ignored'(test) {
        const actual = normalizeIncludeArguments(movieTable);
        test.deepEqual(actual, []);
        return test.done();
      },

      'two tables'(test) {
        const actual = normalizeIncludeArguments(movieTable, starringTable);
        test.deepEqual(actual, [
          {
            left: 'id',
            right: 'movie_id',
            forward: true,
            first: false,
            as: 'starrings',
            table: starringTable,
          },
        ]);
        return test.done();
      },

      'two tables with empty link'(test) {
        const actual = normalizeIncludeArguments(movieTable, {}, starringTable);
        test.deepEqual(actual, [
          {
            left: 'id',
            right: 'movie_id',
            forward: true,
            first: false,
            as: 'starrings',
            table: starringTable,
          },
        ]);
        return test.done();
      },

      'two tables with {forward: false}'(test) {
        const actual = normalizeIncludeArguments(
          movieTable,
          {as: 'cast', forward: false},
          starringTable,
        );
        test.deepEqual(actual, [
          {
            left: 'starring_id',
            right: 'id',
            forward: false,
            first: false,
            as: 'cast',
            table: starringTable,
          },
        ]);
        return test.done();
      },

      'three tables'(test) {
        const actual = normalizeIncludeArguments(
          movieTable,
          starringTable,
          personTable,
        );
        test.deepEqual(actual, [
          {
            left: 'id',
            right: 'movie_id',
            forward: true,
            first: false,
            table: starringTable,
          },
          {
            left: 'id',
            right: 'starring_id',
            forward: true,
            first: false,
            as: 'persons',
            table: personTable,
          },
        ]);
        return test.done();
      },

      'three tables with {forward: false}'(test) {
        const actual = normalizeIncludeArguments(
          movieTable,
          starringTable,
          {forward: false, as: 'cast'},
          personTable,
        );
        test.deepEqual(actual, [
          {
            left: 'id',
            right: 'movie_id',
            forward: true,
            first: false,
            table: starringTable,
          },
          {
            left: 'person_id',
            right: 'id',
            forward: false,
            first: false,
            as: 'cast',
            table: personTable,
          },
        ]);
        return test.done();
      },
    },
  },

  integration: {
    setUp(done) {
      return setup().then(function() {
        const people = [
          {name: 'Dennis Hopper'},
          {name: 'Keanu Reeves'},
          {name: 'Michael Mann'},
          {name: 'Tony Scott'},
          {name: 'Quentin Tarantino'},
          {name: 'Robert De Niro'},
          {name: 'Al Pacino'},
          {name: 'Val Kilmer'},
        ];

        return personTable
          .unsafe()
          .insert(people)
          .then(function(insertedPeople) {
            const personId = idWhereName.bind(null, insertedPeople);

            const movies = [
              {
                name: 'Heat',
                year: 1995,
                director_id: personId('Michael Mann'),
                writer_id: personId('Michael Mann'),
              },
              {
                name: 'True Romance',
                year: 1993,
                director_id: personId('Tony Scott'),
                writer_id: personId('Quentin Tarantino'),
              },
              {
                name: 'Easy Rider',
                year: 1969,
                director_id: personId('Dennis Hopper'),
                writer_id: personId('Dennis Hopper'),
              },
              // {name: 'Brazil'}
              // {name: 'Interstellar'}
            ];

            return movieTable
              .unsafe()
              .insert(movies)
              .then(function(insertedMovies) {
                const movieId = idWhereName.bind(null, insertedMovies);

                const starring = [
                  {
                    movie_id: movieId('Heat'),
                    person_id: personId('Robert De Niro'),
                  },
                  {
                    movie_id: movieId('Heat'),
                    person_id: personId('Al Pacino'),
                  },
                  {
                    movie_id: movieId('True Romance'),
                    person_id: personId('Val Kilmer'),
                  },
                  {
                    movie_id: movieId('Heat'),
                    person_id: personId('Val Kilmer'),
                  },
                  {
                    movie_id: movieId('True Romance'),
                    person_id: personId('Dennis Hopper'),
                  },
                  {
                    movie_id: movieId('Easy Rider'),
                    person_id: personId('Dennis Hopper'),
                  },
                ];

                return starringTable
                  .unsafe()
                  .insert(starring)
                  .then(() => done());
              });
          });
      });
    },

    tearDown: (done) => done(),

    'do not run embed queries if there are no records to embed into'(test) {
      return movieTable
        .include(
          {forward: false, left: 'director_id', first: true, as: 'director'},
          personTable,
        )
        .where({name: 'Mad Max'})
        .find()
        .then(function(movies) {
          test.deepEqual(movies, []);
          return test.done();
        });
    },

    'belongsTo: embed director in movie'(test) {
      return movieTable
        .include(
          {forward: false, left: 'director_id', first: true, as: 'director'},
          personTable,
        )
        .find()
        .then(function(movies) {
          test.equal(movies[0].name, 'Heat');
          test.equal(movies[0].director.name, 'Michael Mann');
          test.equal(movies[1].name, 'True Romance');
          test.equal(movies[1].director.name, 'Tony Scott');
          test.equal(movies[2].name, 'Easy Rider');
          test.equal(movies[2].director.name, 'Dennis Hopper');
          return test.done();
        });
    },

    'hasMany: embed written and directed movies in person'(test) {
      return personTable
        .include({right: 'writer_id', as: 'written'}, movieTable)
        .include({right: 'director_id', as: 'directed'}, movieTable)
        .find()
        .then(function(people) {
          test.equal(people[0].name, 'Dennis Hopper');
          test.deepEqual(names(people[0].written), ['Easy Rider']);
          test.deepEqual(names(people[0].directed), ['Easy Rider']);

          test.equal(people[2].name, 'Michael Mann');
          test.deepEqual(names(people[2].written), ['Heat']);
          test.deepEqual(names(people[2].directed), ['Heat']);

          test.equal(people[3].name, 'Tony Scott');
          test.deepEqual(names(people[3].written), []);
          test.deepEqual(names(people[3].directed), ['True Romance']);

          test.equal(people[4].name, 'Quentin Tarantino');
          test.deepEqual(names(people[4].written), ['True Romance']);
          test.deepEqual(names(people[4].directed), []);

          return test.done();
        });
    },

    'hasOne: embed first written and first directed'(test) {
      return personTable
        .include(
          {right: 'writer_id', first: true, as: 'firstWritten'},
          movieTable.order('year ASC'),
        )
        .include(
          {right: 'director_id', first: true, as: 'firstDirected'},
          movieTable.order('year ASC'),
        )
        .find()
        .then(function(people) {
          test.equal(people[0].name, 'Dennis Hopper');
          test.equal(people[0].firstWritten.name, 'Easy Rider');
          test.equal(people[0].firstDirected.name, 'Easy Rider');

          test.equal(people[2].name, 'Michael Mann');
          test.equal(people[2].firstWritten.name, 'Heat');
          test.equal(people[2].firstDirected.name, 'Heat');

          test.equal(people[3].name, 'Tony Scott');
          test.ok(people[3].firstWritten == null);
          test.equal(people[3].firstDirected.name, 'True Romance');

          test.equal(people[4].name, 'Quentin Tarantino');
          test.equal(people[4].firstWritten.name, 'True Romance');
          test.ok(people[4].firstDirected == null);

          return test.done();
        });
    },

    'has many through: movies an actor has starred in'(test) {
      return personTable
        .include(
          {as: 'starring'},
          starringTable,
          {forward: false},
          movieTable,
        )
        .find()
        .then(function(people) {
          test.equal(people[0].name, 'Dennis Hopper');
          test.deepEqual(names(people[0].movies), [
            'True Romance',
            'Easy Rider',
          ]);
          test.equal(people[1].name, 'Keanu Reeves');
          test.deepEqual(names(people[1].movies), []);
          test.equal(people[2].name, 'Michael Mann');
          test.deepEqual(names(people[2].movies), []);
          test.equal(people[3].name, 'Tony Scott');
          test.deepEqual(names(people[3].movies), []);
          test.equal(people[4].name, 'Quentin Tarantino');
          test.deepEqual(names(people[4].movies), []);
          test.equal(people[5].name, 'Robert De Niro');
          test.deepEqual(names(people[5].movies), ['Heat']);
          test.equal(people[6].name, 'Al Pacino');
          test.deepEqual(names(people[6].movies), ['Heat']);
          test.equal(people[7].name, 'Val Kilmer');
          test.deepEqual(names(people[7].movies), ['True Romance', 'Heat']);

          return test.done();
        });
    },

    'the directors an actor has worked with'(test) {
      // TODO test with some actors that have worked with a director multiple
      // times
      return personTable
        .include(
          starringTable,
          {forward: false},
          movieTable,
          {forward: false, left: 'director_id', as: 'directors'},
          personTable,
        )
        .find()
        .then(function(people) {
          test.equal(people[0].name, 'Dennis Hopper');
          test.deepEqual(names(people[0].directors), [
            'Tony Scott',
            'Dennis Hopper',
          ]);
          test.equal(people[1].name, 'Keanu Reeves');
          test.deepEqual(names(people[1].directors), []);
          test.equal(people[2].name, 'Michael Mann');
          test.deepEqual(names(people[2].directors), []);
          test.equal(people[3].name, 'Tony Scott');
          test.deepEqual(names(people[3].directors), []);
          test.equal(people[4].name, 'Quentin Tarantino');
          test.deepEqual(names(people[4].directors), []);
          test.equal(people[5].name, 'Robert De Niro');
          test.deepEqual(names(people[5].directors), ['Michael Mann']);
          test.equal(people[6].name, 'Al Pacino');
          test.deepEqual(names(people[6].directors), ['Michael Mann']);
          test.equal(people[7].name, 'Val Kilmer');
          test.deepEqual(names(people[7].directors), [
            'Tony Scott',
            'Michael Mann',
          ]);
          return test.done();
        });
    },

    'nested: fetch all actors with all their movies and director and actors for every movie'(
      test,
    ) {
      const starringPeople = personTable
        .distinct('ON (id)')
        .join('JOIN starring ON person.id = starring.person_id');

      return starringPeople
        .include(
          starringTable,
          {forward: false},
          movieTable
            .include(
              {
                forward: false,
                left: 'director_id',
                first: true,
                as: 'director',
              },
              personTable,
            )
            .include(
              starringTable,
              {forward: false, as: 'actors'},
              personTable,
            ),
        )
        .find()
        .then(function(actors) {
          console.log(actors);
          return test.done();
        });
    },
  },
};

// TODO test with filtered
// just movies in a certain time range

// TODO include some things along the way

// TODO has many through with join

//   TODO the directors an actor had to do with
//
//   'hasOne fetch with join': (test) ->
//     test.done()
//
//   'belongsTo fetch with join': (test) ->
//     test.done()
//
//   'from subquery': (test) ->
//     # TODO directory and writer
//     test.done()
