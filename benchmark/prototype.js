/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// prototype chain length: number of chained method calls
// property count of every object in chain = 1
// cost of
// supports extension of fluent interface: true
// number of objects in memory: number of chained method calls = every object in prototype chain

const mesa = {
  clone() {
    return Object.create(this);
  },
  fluent(key, value) {
    const next = this.clone();
    next[key] = value;
    return next;
  },

  alpha(arg) {
    return this.fluent('_alpha', arg);
  },
  bravo(arg) {
    return this.fluent('_bravo', arg);
  },
  charlie(arg) {
    return this.fluent('_charlie', arg);
  },
  delta(arg) {
    return this.fluent('_delta', arg);
  },
  echo(arg) {
    return this.fluent('_echo', arg);
  },
};

const benchmark = function(n) {
  console.log('# n = ' + n + '\n');
  console.time(`n = ${n}`);

  let object = mesa;

  console.time('object.alpha(i)');
  __range__(0, n, true).forEach(() => (object = object.alpha(n)));
  console.timeEnd('object.alpha(i)');
  console.log('process.memoryUsage()', process.memoryUsage());

  console.time('object.bravo(i)');
  __range__(0, n, true).forEach((i) => (object = object.bravo(i)));
  console.timeEnd('object.bravo(i)');
  console.log('process.memoryUsage()', process.memoryUsage());

  console.time('object.charlie(i)');
  __range__(0, n, true).forEach((i) => (object = object.charlie(i)));
  console.timeEnd('object.charlie(i)');
  console.log('process.memoryUsage()', process.memoryUsage());

  console.time('object.delta(i)');
  __range__(0, n, true).forEach((i) => (object = object.delta(i)));
  console.timeEnd('object.delta(i)');
  console.log('process.memoryUsage()', process.memoryUsage());

  console.time('object.echo(i)');
  __range__(0, n, true).forEach((i) => (object = object.echo(i)));
  console.timeEnd('object.echo(i)');
  console.log('process.memoryUsage()', process.memoryUsage());

  console.time('object._alpha');
  console.log(object._alpha);
  console.timeEnd('object._alpha');

  console.time('object._bravo');
  console.log(object._bravo);
  console.timeEnd('object._bravo');

  console.time('object._charlie');
  console.log(object._charlie);
  console.timeEnd('object._charlie');

  console.time('object._delta');
  console.log(object._delta);
  console.timeEnd('object._delta');

  console.time('object._echo');
  console.log(object._echo);
  console.timeEnd('object._echo');

  console.timeEnd(`n = ${n}`);
  return console.log('\n');
};

benchmark(10);
benchmark(100);
benchmark(1000);
benchmark(10000);
benchmark(100000);
benchmark(1000000);

function __range__(left, right, inclusive) {
  const range = [];
  const ascending = left < right;
  const end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
