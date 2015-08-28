//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

/*
 * to-markdown - an HTML to Markdown converter
 *
 * Copyright 2011, Dom Christie
 * Licenced under the MIT licence
 *
 */

if (typeof he !== 'object' && typeof require === 'function') {
  var he = require('he');
}

var toMarkdown = function(string) {

  var ELEMENTS = [
    {
      patterns: 'p',
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '\n\n' + innerHTML + '\n' : '';
      }
    },
    {
      patterns: 'br',
      type: 'void',
      replacement: '\n'
    },
    {
      patterns: 'h([1-6])',
      replacement: function(str, hLevel, attrs, innerHTML) {
        var hPrefix = '';
        for(var i = 0; i < hLevel; i++) {
          hPrefix += '#';
        }
        return '\n\n' + hPrefix + ' ' + innerHTML + '\n';
      }
    },
    {
      patterns: 'hr',
      type: 'void',
      replacement: '\n\n* * *\n'
    },
    {
      patterns: 'a',
      replacement: function(str, attrs, innerHTML) {
        var href = attrs.match(attrRegExp('href')),
            title = attrs.match(attrRegExp('title'));
        return href ? '[' + innerHTML + ']' + '(' + href[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')' : str;
      }
    },
    {
      patterns: ['b', 'strong'],
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '**' + innerHTML + '**' : '';
      }
    },
    {
      patterns: ['i', 'em'],
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '_' + innerHTML + '_' : '';
      }
    },
    {
      patterns: 'code',
      replacement: function(str, attrs, innerHTML) {
        return innerHTML ? '`' + he.decode(innerHTML) + '`' : '';
      }
    },
    {
      patterns: 'img',
      type: 'void',
      replacement: function(str, attrs, innerHTML) {
        var src = attrs.match(attrRegExp('src')),
            alt = attrs.match(attrRegExp('alt')),
            title = attrs.match(attrRegExp('title'));
        return '![' + (alt && alt[1] ? alt[1] : '') + ']' + '(' + src[1] + (title && title[1] ? ' "' + title[1] + '"' : '') + ')';
      }
    }
  ];

  for(var i = 0, len = ELEMENTS.length; i < len; i++) {
    if(typeof ELEMENTS[i].patterns === 'string') {
      string = replaceEls(string, { tag: ELEMENTS[i].patterns, replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
    }
    else {
      for(var j = 0, pLen = ELEMENTS[i].patterns.length; j < pLen; j++) {
        string = replaceEls(string, { tag: ELEMENTS[i].patterns[j], replacement: ELEMENTS[i].replacement, type:  ELEMENTS[i].type });
      }
    }
  }

  function replaceEls(html, elProperties) {
    var pattern = elProperties.type === 'void' ? '<' + elProperties.tag + '\\b([^>]*)\\/?>' : '<' + elProperties.tag + '\\b([^>]*)>([\\s\\S]*?)<\\/' + elProperties.tag + '>',
        regex = new RegExp(pattern, 'gi'),
        markdown = '';
    if(typeof elProperties.replacement === 'string') {
      markdown = html.replace(regex, elProperties.replacement);
    }
    else {
      markdown = html.replace(regex, function(str, p1, p2, p3) {
        return elProperties.replacement.call(this, str, p1, p2, p3);
      });
    }
    return markdown;
  }

  function attrRegExp(attr) {
    return new RegExp(attr + '\\s*=\\s*["\']?([^"\']*)["\']?', 'i');
  }

  // Pre code blocks

  string = string.replace(/<pre\b[^>]*>`([\s\S]*?)`<\/pre>/gi, function(str, innerHTML) {
    var text = he.decode(innerHTML);
    text = text.replace(/^\t+/g, '  '); // convert tabs to spaces (you know it makes sense)
    text = text.replace(/\n/g, '\n    ');
    return '\n\n    ' + text + '\n';
  });

  // Lists

  // Escape numbers that could trigger an ol
  // If there are more than three spaces before the code, it would be in a pre tag
  // Make sure we are escaping the period not matching any character
  string = string.replace(/^(\s{0,3}\d+)\. /g, '$1\\. ');

  // Converts lists that have no child lists (of same type) first, then works its way up
  var noChildrenRegex = /<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;
  while(string.match(noChildrenRegex)) {
    string = string.replace(noChildrenRegex, function(str) {
      return replaceLists(str);
    });
  }

  function replaceLists(html) {

    html = html.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi, function(str, listType, innerHTML) {
      var lis = innerHTML.split('</li>');
      lis.splice(lis.length - 1, 1);

      for(i = 0, len = lis.length; i < len; i++) {
        if(lis[i]) {
          var prefix = (listType === 'ol') ? (i + 1) + ".  " : "*   ";
          lis[i] = lis[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function(str, innerHTML) {

            innerHTML = innerHTML.replace(/^\s+/, '');
            innerHTML = innerHTML.replace(/\n\n/g, '\n\n    ');
            // indent nested lists
            innerHTML = innerHTML.replace(/\n([ ]*)+(\*|\d+\.) /g, '\n$1    $2 ');
            return prefix + innerHTML;
          });
        }
      }
      return lis.join('\n');
    });
    return '\n\n' + html.replace(/[ \t]+\n|\s+$/g, '');
  }

  // Blockquotes
  var deepest = /<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;
  while(string.match(deepest)) {
    string = string.replace(deepest, function(str) {
      return replaceBlockquotes(str);
    });
  }

  function replaceBlockquotes(html) {
    html = html.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, function(str, inner) {
      inner = inner.replace(/^\s+|\s+$/g, '');
      inner = cleanUp(inner);
      inner = inner.replace(/^/gm, '> ');
      inner = inner.replace(/^(>([ \t]{2,}>)+)/gm, '> >');
      return inner;
    });
    return html;
  }

  function cleanUp(string) {
    string = string.replace(/^[\t\r\n]+|[\t\r\n]+$/g, ''); // trim leading/trailing whitespace
    string = string.replace(/\n\s+\n/g, '\n\n');
    string = string.replace(/\n{3,}/g, '\n\n'); // limit consecutive linebreaks to 2
    return string;
  }

  return cleanUp(string);
};

if (typeof exports === 'object') {
  exports.toMarkdown = toMarkdown;
}

!function(a){function b(){return"Markdown.mk_block( "+uneval(this.toString())+", "+uneval(this.trailing)+", "+uneval(this.lineNumber)+" )"}function c(){var a=require("util");return"Markdown.mk_block( "+a.inspect(this.toString())+", "+a.inspect(this.trailing)+", "+a.inspect(this.lineNumber)+" )"}function d(a){for(var b=0,c=-1;-1!==(c=a.indexOf("\n",c+1));)b++;return b}function e(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function f(a){if("string"==typeof a)return e(a);var b=a.shift(),c={},d=[];for(!a.length||"object"!=typeof a[0]||a[0]instanceof Array||(c=a.shift());a.length;)d.push(f(a.shift()));var g="";for(var h in c)g+=" "+h+'="'+e(c[h])+'"';return"img"===b||"br"===b||"hr"===b?"<"+b+g+"/>":"<"+b+g+">"+d.join("")+"</"+b+">"}function g(a,b,c){var d;c=c||{};var e=a.slice(0);"function"==typeof c.preprocessTreeNode&&(e=c.preprocessTreeNode(e,b));var f=o(e);if(f){e[1]={};for(d in f)e[1][d]=f[d];f=e[1]}if("string"==typeof e)return e;switch(e[0]){case"header":e[0]="h"+e[1].level,delete e[1].level;break;case"bulletlist":e[0]="ul";break;case"numberlist":e[0]="ol";break;case"listitem":e[0]="li";break;case"para":e[0]="p";break;case"markdown":e[0]="html",f&&delete f.references;break;case"code_block":e[0]="pre",d=f?2:1;var h=["code"];h.push.apply(h,e.splice(d,e.length-d)),e[d]=h;break;case"inlinecode":e[0]="code";break;case"img":e[1].src=e[1].href,delete e[1].href;break;case"linebreak":e[0]="br";break;case"link":e[0]="a";break;case"link_ref":e[0]="a";var i=b[f.ref];if(!i)return f.original;delete f.ref,f.href=i.href,i.title&&(f.title=i.title),delete f.original;break;case"img_ref":e[0]="img";var i=b[f.ref];if(!i)return f.original;delete f.ref,f.src=i.href,i.title&&(f.title=i.title),delete f.original}if(d=1,f){for(var j in e[1]){d=2;break}1===d&&e.splice(d,1)}for(;d<e.length;++d)e[d]=g(e[d],b,c);return e}function h(a){for(var b=o(a)?2:1;b<a.length;)"string"==typeof a[b]?b+1<a.length&&"string"==typeof a[b+1]?a[b]+=a.splice(b+1,1)[0]:++b:(h(a[b]),++b)}function i(a,b){function c(a){this.len_after=a,this.name="close_"+b}var d=a+"_state",e="strong"===a?"em_state":"strong_state";return function(f){if(this[d][0]===b)return this[d].shift(),[f.length,new c(f.length-b.length)];var g=this[e].slice(),h=this[d].slice();this[d].unshift(b);var i=this.processInline(f.substr(b.length)),j=i[i.length-1];if(this[d].shift(),j instanceof c){i.pop();var k=f.length-j.len_after;return[k,[a].concat(i)]}return this[e]=g,this[d]=h,[b.length,b]}}function j(a){for(var b=a.split(""),c=[""],d=!1;b.length;){var e=b.shift();switch(e){case" ":d?c[c.length-1]+=e:c.push("");break;case"'":case'"':d=!d;break;case"\\":e=b.shift();default:c[c.length-1]+=e}}return c}var k={};k.mk_block=function(a,d,e){1===arguments.length&&(d="\n\n");var f=new String(a);return f.trailing=d,f.inspect=c,f.toSource=b,void 0!==e&&(f.lineNumber=e),f};var l=k.isArray=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)};k.forEach=Array.prototype.forEach?function(a,b,c){return a.forEach(b,c)}:function(a,b,c){for(var d=0;d<a.length;d++)b.call(c||a,a[d],d,a)},k.isEmpty=function(a){for(var b in a)if(hasOwnProperty.call(a,b))return!1;return!0},k.extract_attr=function(a){return l(a)&&a.length>1&&"object"==typeof a[1]&&!l(a[1])?a[1]:void 0};var m=function(a){switch(typeof a){case"undefined":this.dialect=m.dialects.Gruber;break;case"object":this.dialect=a;break;default:if(!(a in m.dialects))throw new Error("Unknown Markdown dialect '"+String(a)+"'");this.dialect=m.dialects[a]}this.em_state=[],this.strong_state=[],this.debug_indent=""};m.dialects={};var n=m.mk_block=k.mk_block,l=k.isArray;m.parse=function(a,b){var c=new m(b);return c.toTree(a)},m.prototype.split_blocks=function(a){a=a.replace(/(\r\n|\n|\r)/g,"\n");var b,c=/([\s\S]+?)($|\n#|\n(?:\s*\n|$)+)/g,e=[],f=1;for(null!==(b=/^(\s*\n)/.exec(a))&&(f+=d(b[0]),c.lastIndex=b[0].length);null!==(b=c.exec(a));)"\n#"===b[2]&&(b[2]="\n",c.lastIndex--),e.push(n(b[1],b[2],f)),f+=d(b[0]);return e},m.prototype.processBlock=function(a,b){var c=this.dialect.block,d=c.__order__;if("__call__"in c)return c.__call__.call(this,a,b);for(var e=0;e<d.length;e++){var f=c[d[e]].call(this,a,b);if(f)return(!l(f)||f.length>0&&!l(f[0]))&&this.debug(d[e],"didn't return a proper array"),f}return[]},m.prototype.processInline=function(a){return this.dialect.inline.__call__.call(this,String(a))},m.prototype.toTree=function(a,b){var c=a instanceof Array?a:this.split_blocks(a),d=this.tree;try{for(this.tree=b||this.tree||["markdown"];c.length;){var e=this.processBlock(c.shift(),c);e.length&&this.tree.push.apply(this.tree,e)}return this.tree}finally{b&&(this.tree=d)}},m.prototype.debug=function(){var a=Array.prototype.slice.call(arguments);a.unshift(this.debug_indent),"undefined"!=typeof print&&print.apply(print,a),"undefined"!=typeof console&&"undefined"!=typeof console.log&&console.log.apply(null,a)},m.prototype.loop_re_over_block=function(a,b,c){for(var d,e=b.valueOf();e.length&&null!==(d=a.exec(e));)e=e.substr(d[0].length),c.call(this,d);return e},m.buildBlockOrder=function(a){var b=[];for(var c in a)"__order__"!==c&&"__call__"!==c&&b.push(c);a.__order__=b},m.buildInlinePatterns=function(a){var b=[];for(var c in a)if(!c.match(/^__.*__$/)){var d=c.replace(/([\\.*+?|()\[\]{}])/g,"\\$1").replace(/\n/,"\\n");b.push(1===c.length?d:"(?:"+d+")")}b=b.join("|"),a.__patterns__=b;var e=a.__call__;a.__call__=function(a,c){return void 0!==c?e.call(this,a,c):e.call(this,a,b)}};var o=k.extract_attr;m.renderJsonML=function(a,b){b=b||{},b.root=b.root||!1;var c=[];if(b.root)c.push(f(a));else for(a.shift(),!a.length||"object"!=typeof a[0]||a[0]instanceof Array||a.shift();a.length;)c.push(f(a.shift()));return c.join("\n\n")},m.toHTMLTree=function(a,b,c){"string"==typeof a&&(a=this.parse(a,b));var d=o(a),e={};d&&d.references&&(e=d.references);var f=g(a,e,c);return h(f),f},m.toHTML=function(a,b,c){var d=this.toHTMLTree(a,b,c);return this.renderJsonML(d)};var p={};p.inline_until_char=function(a,b){for(var c=0,d=[];;){if(a.charAt(c)===b)return c++,[c,d];if(c>=a.length)return null;var e=this.dialect.inline.__oneElement__.call(this,a.substr(c));c+=e[0],d.push.apply(d,e.slice(1))}},p.subclassDialect=function(a){function b(){}function c(){}return b.prototype=a.block,c.prototype=a.inline,{block:new b,inline:new c}};var q=k.forEach,o=k.extract_attr,n=k.mk_block,r=k.isEmpty,s=p.inline_until_char,t={block:{atxHeader:function(a,b){var c=a.match(/^(#{1,6})\s*(.*?)\s*#*\s*(?:\n|$)/);if(!c)return void 0;var d=["header",{level:c[1].length}];return Array.prototype.push.apply(d,this.processInline(c[2])),c[0].length<a.length&&b.unshift(n(a.substr(c[0].length),a.trailing,a.lineNumber+2)),[d]},setextHeader:function(a,b){var c=a.match(/^(.*)\n([-=])\2\2+(?:\n|$)/);if(!c)return void 0;var d="="===c[2]?1:2,e=["header",{level:d},c[1]];return c[0].length<a.length&&b.unshift(n(a.substr(c[0].length),a.trailing,a.lineNumber+2)),[e]},code:function(a,b){var c=[],d=/^(?: {0,3}\t| {4})(.*)\n?/;if(!a.match(d))return void 0;a:for(;;){var e=this.loop_re_over_block(d,a.valueOf(),function(a){c.push(a[1])});if(e.length){b.unshift(n(e,a.trailing));break a}if(!b.length)break a;if(!b[0].match(d))break a;c.push(a.trailing.replace(/[^\n]/g,"").substring(2)),a=b.shift()}return[["code_block",c.join("\n")]]},horizRule:function(a,b){var c=a.match(/^(?:([\s\S]*?)\n)?[ \t]*([-_*])(?:[ \t]*\2){2,}[ \t]*(?:\n([\s\S]*))?$/);if(!c)return void 0;var d=[["hr"]];if(c[1]){var e=n(c[1],"",a.lineNumber);d.unshift.apply(d,this.toTree(e,[]))}return c[3]&&b.unshift(n(c[3],a.trailing,a.lineNumber+1)),d},lists:function(){function a(a){return new RegExp("(?:^("+i+"{0,"+a+"} {0,3})("+f+")\\s+)|"+"(^"+i+"{0,"+(a-1)+"}[ ]{0,4})")}function b(a){return a.replace(/ {0,3}\t/g,"    ")}function c(a,b,c,d){if(b)return a.push(["para"].concat(c)),void 0;var e=a[a.length-1]instanceof Array&&"para"===a[a.length-1][0]?a[a.length-1]:a;d&&a.length>1&&c.unshift(d);for(var f=0;f<c.length;f++){var g=c[f],h="string"==typeof g;h&&e.length>1&&"string"==typeof e[e.length-1]?e[e.length-1]+=g:e.push(g)}}function d(a,b){for(var c=new RegExp("^("+i+"{"+a+"}.*?\\n?)*$"),d=new RegExp("^"+i+"{"+a+"}","gm"),e=[];b.length>0&&c.exec(b[0]);){var f=b.shift(),g=f.replace(d,"");e.push(n(g,f.trailing,f.lineNumber))}return e}function e(a,b,c){var d=a.list,e=d[d.length-1];if(!(e[1]instanceof Array&&"para"===e[1][0]))if(b+1===c.length)e.push(["para"].concat(e.splice(1,e.length-1)));else{var f=e.pop();e.push(["para"].concat(e.splice(1,e.length-1)),f)}}var f="[*+-]|\\d+\\.",g=/[*+-]/,h=new RegExp("^( {0,3})("+f+")[ 	]+"),i="(?: {0,3}\\t| {4})";return function(f,i){function j(a){var b=g.exec(a[2])?["bulletlist"]:["numberlist"];return n.push({list:b,indent:a[1]}),b}var k=f.match(h);if(!k)return void 0;for(var l,m,n=[],o=j(k),p=!1,r=[n[0].list];;){for(var s=f.split(/(?=\n)/),t="",u="",v=0;v<s.length;v++){u="";var w=s[v].replace(/^\n/,function(a){return u=a,""}),x=a(n.length);if(k=w.match(x),void 0!==k[1]){t.length&&(c(l,p,this.processInline(t),u),p=!1,t=""),k[1]=b(k[1]);var y=Math.floor(k[1].length/4)+1;if(y>n.length)o=j(k),l.push(o),l=o[1]=["listitem"];else{var z=!1;for(m=0;m<n.length;m++)if(n[m].indent===k[1]){o=n[m].list,n.splice(m+1,n.length-(m+1)),z=!0;break}z||(y++,y<=n.length?(n.splice(y,n.length-y),o=n[y-1].list):(o=j(k),l.push(o))),l=["listitem"],o.push(l)}u=""}w.length>k[0].length&&(t+=u+w.substr(k[0].length))}t.length&&(c(l,p,this.processInline(t),u),p=!1,t="");var A=d(n.length,i);A.length>0&&(q(n,e,this),l.push.apply(l,this.toTree(A,[])));var B=i[0]&&i[0].valueOf()||"";if(!B.match(h)&&!B.match(/^ /))break;f=i.shift();var C=this.dialect.block.horizRule(f,i);if(C){r.push.apply(r,C);break}q(n,e,this),p=!0}return r}}(),blockquote:function(a,b){if(!a.match(/^>/m))return void 0;var c=[];if(">"!==a[0]){for(var d=a.split(/\n/),e=[],f=a.lineNumber;d.length&&">"!==d[0][0];)e.push(d.shift()),f++;var g=n(e.join("\n"),"\n",a.lineNumber);c.push.apply(c,this.processBlock(g,[])),a=n(d.join("\n"),a.trailing,f)}for(;b.length&&">"===b[0][0];){var h=b.shift();a=n(a+a.trailing+h,h.trailing,a.lineNumber)}var i=a.replace(/^> ?/gm,""),j=(this.tree,this.toTree(i,["blockquote"])),k=o(j);return k&&k.references&&(delete k.references,r(k)&&j.splice(1,1)),c.push(j),c},referenceDefn:function(a,b){var c=/^\s*\[(.*?)\]:\s*(\S+)(?:\s+(?:(['"])(.*?)\3|\((.*?)\)))?\n?/;if(!a.match(c))return void 0;o(this.tree)||this.tree.splice(1,0,{});var d=o(this.tree);void 0===d.references&&(d.references={});var e=this.loop_re_over_block(c,a,function(a){a[2]&&"<"===a[2][0]&&">"===a[2][a[2].length-1]&&(a[2]=a[2].substring(1,a[2].length-1));var b=d.references[a[1].toLowerCase()]={href:a[2]};void 0!==a[4]?b.title=a[4]:void 0!==a[5]&&(b.title=a[5])});return e.length&&b.unshift(n(e,a.trailing)),[]},para:function(a){return[["para"].concat(this.processInline(a))]}},inline:{__oneElement__:function(a,b,c){var d,e;b=b||this.dialect.inline.__patterns__;var f=new RegExp("([\\s\\S]*?)("+(b.source||b)+")");if(d=f.exec(a),!d)return[a.length,a];if(d[1])return[d[1].length,d[1]];var e;return d[2]in this.dialect.inline&&(e=this.dialect.inline[d[2]].call(this,a.substr(d.index),d,c||[])),e=e||[d[2].length,d[2]]},__call__:function(a,b){function c(a){"string"==typeof a&&"string"==typeof e[e.length-1]?e[e.length-1]+=a:e.push(a)}for(var d,e=[];a.length>0;)d=this.dialect.inline.__oneElement__.call(this,a,b,e),a=a.substr(d.shift()),q(d,c);return e},"]":function(){},"}":function(){},__escape__:/^\\[\\`\*_{}\[\]()#\+.!\-]/,"\\":function(a){return this.dialect.inline.__escape__.exec(a)?[2,a.charAt(1)]:[1,"\\"]},"![":function(a){var b=a.match(/^!\[(.*?)\][ \t]*\([ \t]*([^")]*?)(?:[ \t]+(["'])(.*?)\3)?[ \t]*\)/);if(b){b[2]&&"<"===b[2][0]&&">"===b[2][b[2].length-1]&&(b[2]=b[2].substring(1,b[2].length-1)),b[2]=this.dialect.inline.__call__.call(this,b[2],/\\/)[0];var c={alt:b[1],href:b[2]||""};return void 0!==b[4]&&(c.title=b[4]),[b[0].length,["img",c]]}return b=a.match(/^!\[(.*?)\][ \t]*\[(.*?)\]/),b?[b[0].length,["img_ref",{alt:b[1],ref:b[2].toLowerCase(),original:b[0]}]]:[2,"!["]},"[":function v(a){var b=String(a),c=s.call(this,a.substr(1),"]");if(!c)return[1,"["];var v,d,e=1+c[0],f=c[1];a=a.substr(e);var g=a.match(/^\s*\([ \t]*([^"']*)(?:[ \t]+(["'])(.*?)\2)?[ \t]*\)/);if(g){var h=g[1];if(e+=g[0].length,h&&"<"===h[0]&&">"===h[h.length-1]&&(h=h.substring(1,h.length-1)),!g[3])for(var i=1,j=0;j<h.length;j++)switch(h[j]){case"(":i++;break;case")":0===--i&&(e-=h.length-j,h=h.substring(0,j))}return h=this.dialect.inline.__call__.call(this,h,/\\/)[0],d={href:h||""},void 0!==g[3]&&(d.title=g[3]),v=["link",d].concat(f),[e,v]}return g=a.match(/^\s*\[(.*?)\]/),g?(e+=g[0].length,d={ref:(g[1]||String(f)).toLowerCase(),original:b.substr(0,e)},v=["link_ref",d].concat(f),[e,v]):1===f.length&&"string"==typeof f[0]?(d={ref:f[0].toLowerCase(),original:b.substr(0,e)},v=["link_ref",d,f[0]],[e,v]):[1,"["]},"<":function(a){var b;return null!==(b=a.match(/^<(?:((https?|ftp|mailto):[^>]+)|(.*?@.*?\.[a-zA-Z]+))>/))?b[3]?[b[0].length,["link",{href:"mailto:"+b[3]},b[3]]]:"mailto"===b[2]?[b[0].length,["link",{href:b[1]},b[1].substr("mailto:".length)]]:[b[0].length,["link",{href:b[1]},b[1]]]:[1,"<"]},"`":function(a){var b=a.match(/(`+)(([\s\S]*?)\1)/);return b&&b[2]?[b[1].length+b[2].length,["inlinecode",b[3]]]:[1,"`"]},"  \n":function(){return[3,["linebreak"]]}}};t.inline["**"]=i("strong","**"),t.inline.__=i("strong","__"),t.inline["*"]=i("em","*"),t.inline._=i("em","_"),m.dialects.Gruber=t,m.buildBlockOrder(m.dialects.Gruber.block),m.buildInlinePatterns(m.dialects.Gruber.inline);var u=p.subclassDialect(t),o=k.extract_attr,q=k.forEach;u.processMetaHash=function(a){for(var b=j(a),c={},d=0;d<b.length;++d)if(/^#/.test(b[d]))c.id=b[d].substring(1);else if(/^\./.test(b[d]))c["class"]=c["class"]?c["class"]+b[d].replace(/./," "):b[d].substring(1);else if(/\=/.test(b[d])){var e=b[d].split(/\=/);c[e[0]]=e[1]}return c},u.block.document_meta=function(a){if(a.lineNumber>1)return void 0;if(!a.match(/^(?:\w+:.*\n)*\w+:.*$/))return void 0;o(this.tree)||this.tree.splice(1,0,{});var b=a.split(/\n/);for(var c in b){var d=b[c].match(/(\w+):\s*(.*)$/),e=d[1].toLowerCase(),f=d[2];this.tree[1][e]=f}return[]},u.block.block_meta=function(a){var b=a.match(/(^|\n) {0,3}\{:\s*((?:\\\}|[^\}])*)\s*\}$/);if(!b)return void 0;var c,d=this.dialect.processMetaHash(b[2]);if(""===b[1]){var e=this.tree[this.tree.length-1];if(c=o(e),"string"==typeof e)return void 0;c||(c={},e.splice(1,0,c));for(var f in d)c[f]=d[f];return[]}var g=a.replace(/\n.*$/,""),h=this.processBlock(g,[]);c=o(h[0]),c||(c={},h[0].splice(1,0,c));for(var f in d)c[f]=d[f];return h},u.block.definition_list=function(a,b){var c,d,e=/^((?:[^\s:].*\n)+):\s+([\s\S]+)$/,f=["dl"];if(!(d=a.match(e)))return void 0;for(var g=[a];b.length&&e.exec(b[0]);)g.push(b.shift());for(var h=0;h<g.length;++h){var d=g[h].match(e),i=d[1].replace(/\n$/,"").split(/\n/),j=d[2].split(/\n:\s+/);for(c=0;c<i.length;++c)f.push(["dt",i[c]]);for(c=0;c<j.length;++c)f.push(["dd"].concat(this.processInline(j[c].replace(/(\n)\s+/,"$1"))))}return[f]},u.block.table=function w(a){var b,c,d=function(a,b){b=b||"\\s",b.match(/^[\\|\[\]{}?*.+^$]$/)&&(b="\\"+b);for(var c,d=[],e=new RegExp("^((?:\\\\.|[^\\\\"+b+"])*)"+b+"(.*)");c=a.match(e);)d.push(c[1]),a=c[2];return d.push(a),d},e=/^ {0,3}\|(.+)\n {0,3}\|\s*([\-:]+[\-| :]*)\n((?:\s*\|.*(?:\n|$))*)(?=\n|$)/,f=/^ {0,3}(\S(?:\\.|[^\\|])*\|.*)\n {0,3}([\-:]+\s*\|[\-| :]*)\n((?:(?:\\.|[^\\|])*\|.*(?:\n|$))*)(?=\n|$)/;if(c=a.match(e))c[3]=c[3].replace(/^\s*\|/gm,"");else if(!(c=a.match(f)))return void 0;var w=["table",["thead",["tr"]],["tbody"]];c[2]=c[2].replace(/\|\s*$/,"").split("|");var g=[];for(q(c[2],function(a){a.match(/^\s*-+:\s*$/)?g.push({align:"right"}):a.match(/^\s*:-+\s*$/)?g.push({align:"left"}):a.match(/^\s*:-+:\s*$/)?g.push({align:"center"}):g.push({})}),c[1]=d(c[1].replace(/\|\s*$/,""),"|"),b=0;b<c[1].length;b++)w[1][1].push(["th",g[b]||{}].concat(this.processInline(c[1][b].trim())));return q(c[3].replace(/\|\s*$/gm,"").split("\n"),function(a){var c=["tr"];for(a=d(a,"|"),b=0;b<a.length;b++)c.push(["td",g[b]||{}].concat(this.processInline(a[b].trim())));w[2].push(c)},this),[w]},u.inline["{:"]=function(a,b,c){if(!c.length)return[2,"{:"];var d=c[c.length-1];if("string"==typeof d)return[2,"{:"];var e=a.match(/^\{:\s*((?:\\\}|[^\}])*)\s*\}/);if(!e)return[2,"{:"];var f=this.dialect.processMetaHash(e[1]),g=o(d);g||(g={},d.splice(1,0,g));for(var h in f)g[h]=f[h];return[e[0].length,""]},m.dialects.Maruku=u,m.dialects.Maruku.inline.__escape__=/^\\[\\`\*_{}\[\]()#\+.!\-|:]/,m.buildBlockOrder(m.dialects.Maruku.block),m.buildInlinePatterns(m.dialects.Maruku.inline),a.Markdown=m,a.parse=m.parse,a.toHTML=m.toHTML,a.toHTMLTree=m.toHTMLTree,a.renderJsonML=m.renderJsonML}(function(){return window.markdown={},window.markdown}());
(function($, _) {
    var that = this,
               Villain;
    Villain = that.Villain = {};
    Villain.EventBus = Villain.EventBus || _.extend({}, Backbone.Events);
    Villain.Blocks = Villain.Blocks || {};
    Villain.Editor = Villain.Editor || {};
    Villain.options = Villain.options || [];

    Villain.defaults = {
        textArea: '#textarea',
        browseURL: 'villain/browse/',
        uploadURL: 'villain/upload/',
        imageseriesURL: 'villain/imageseries/'
    };

    function $element(el) {
        return el instanceof $ ? el : $(el);
    }

    /* Mixins */
    var url_regex = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    
    _.mixin({
        isURI : function(string) {
            return (url_regex.test(string));
        },
    
        titleize: function(str) {
            if (str === null) {
                return '';
            }
            str  = String(str).toLowerCase();
            return str.replace(/(?:^|\s|-)\S/g, function(c) { return c.toUpperCase(); });
        },
    
        classify: function(str) {
            return _.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
        },
    
        classifyList: function(a) {
            return _.map(a, function(i) { return _.classify(i); });
        },
    
        capitalize : function(string) {
            return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
        },
    
        underscored: function(str) {
            return _.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
            .replace(/[-\s]+/g, '_').toLowerCase();
        },
    
        trim : function(string) {
            return string.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        },
    
        reverse: function(str) {
            return str.split('').reverse().join('');
        },
    
        flattern: function(obj) {
            var x = {};
            _.each(obj, function(a,b) {
              x[(_.isArray(obj)) ? a : b] = true;
          });
            return x;
        },
    
        to_slug: function(str) {
            return str
            .toLowerCase()
            .replace(/[^\w ]+/g,'')
            .replace(/ +/g,'-');
        }
    });
    
    $.fn.visible = function() {
        return this.css('visibility', 'visible');
    };
    
    $.fn.invisible = function() {
        return this.css('visibility', 'hidden');
    };
    
    $.fn.visibilityToggle = function() {
        return this.css('visibility', function(i, visibility) {
            return (visibility == 'visible') ? 'hidden' : 'visible';
        });
    };
    
    $.fn.caretToEnd = function() {
        var range, selection;
    
        range = document.createRange();
        range.selectNodeContents(this[0]);
        range.collapse(false);
    
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    
        return this;
    };
    
    // Extend jquery with flashing for elements
    $.fn.flash = function(duration, iterations) {
        duration = duration || 1000; // Default to 1 second
        iterations = iterations || 2; // Default to 1 iteration
        var iterationDuration = Math.floor(duration / iterations);
    
        originalColor = this.css('background-color');
        this.css('background-color','#ffffdd');
        for (var i = 0; i < iterations; i++) {
            this.fadeOut(iterationDuration).fadeIn(iterationDuration, function() {
                this.css('background-color', '#ffffff');
            });
        }
        //this.css('background-color',originalColor);
        return this;
    };
    
    $.fn.shake = function(shakes, distance, duration) {
        shakes = shakes || 3;
        distance = distance || 10;
        duration = duration || 300;
        this.each(function() {
            $(this).css('position', 'relative');
            for (var x = 1; x <= shakes; x++) {
                $(this).animate({left: (distance * -1)}, (((duration / shakes) / 4)))
                       .animate({left: distance}, ((duration / shakes) / 2))
                       .animate({left: 0}, (((duration / shakes) / 4)));
            }
        });
        return this;
    };
    
    /*! Loading Overlay - v1.0.2 - 2014-02-19
    * http://jgerigmeyer.github.io/jquery-loading-overlay/
    * Copyright (c) 2014 Jonny Gerig Meyer; Licensed MIT */
    (function($) {
    
      'use strict';
    
      var methods = {
        init: function(options) {
          var opts = $.extend({}, $.fn.loadingOverlay.defaults, options),
              target = $(this).addClass(opts.loadingClass),
              overlay = '<div class="' + opts.overlayClass + '">' +
            '<p class="' + opts.spinnerClass + '">' +
            '<span class="' + opts.iconClass + '"></span>' +
            '<span class="' + opts.textClass + '">' + opts.loadingText + '</span>' +
            '</p></div>';
          // Don't add duplicate loading-overlay
          if (!target.data('loading-overlay')) {
            target.prepend($(overlay)).data('loading-overlay', true);
          }
          return target;
        },
    
        remove: function(options) {
          var opts = $.extend({}, $.fn.loadingOverlay.defaults, options),
              target = $(this).data('loading-overlay', false);
          target.find('.' + opts.overlayClass).detach();
          if (target.hasClass(opts.loadingClass)) {
            target.removeClass(opts.loadingClass);
          } else {
            target.find('.' + opts.loadingClass).removeClass(opts.loadingClass);
          }
          return target;
        },
    
        // Expose internal methods to allow stubbing in tests
        exposeMethods: function() {
          return methods;
        }
      };
    
      $.fn.loadingOverlay = function(method) {
        if (methods[method]) {
          return methods[method].apply(
            this,
            Array.prototype.slice.call(arguments, 1)
          );
        } else if (typeof method === 'object' || !method) {
          return methods.init.apply(this, arguments);
        } else {
          $.error('Method ' + method + ' does not exist on jQuery.loadingOverlay');
        }
      };
    
      /* Setup plugin defaults */
      $.fn.loadingOverlay.defaults = {
        loadingClass: 'loading',          // Class added to target while loading
        overlayClass: 'loading-overlay',  // Class added to overlay (style with CSS)
        spinnerClass: 'loading-spinner',  // Class added to loading overlay spinner
        iconClass: 'loading-icon fa fa-circle-o-notch fa-spin',        // Class added to loading overlay spinner
        textClass: 'loading-text',        // Class added to loading overlay spinner
        loadingText: ''            // Text within loading overlay
      };
    }(jQuery));

    /* Plus */
    Villain.Plus = Backbone.View.extend({
        tagName: 'div',
        className: 'villain-add-block villain-droppable',
        blockSelectionTemplate: _.template(
            '<div class="villain-block-selection"><%= content %></div>'
        ),
        events: {
            'click .villain-add-block-button': 'onClickAddBlock',
            'click .villain-block-button': 'onClickBlockButton'
        },
    
        initialize: function(store) {
            this.store = store;
            this.$el.attr('data-blockstore', store);
            this.$el.attr('id', _.uniqueId('villain-plus-'));
            this.render();
        },
    
        render: function() {
            this.$el.append('<button class="villain-add-block-button">+</button>');
            return this;
        },
    
        onClickBlockButton: function(e) {
            /* clicked a button in the add new block container */
            e.preventDefault();
    
            $button = $(e.currentTarget);
    
            blockType = $button.data('type');
            blockStore = this.store;
            BlockClass = Villain.BlockRegistry.getBlockClassByType(blockType);
    
            // get a new block with no data, and the specified blockStore
            block = new BlockClass(false, blockStore);
            block.$el.insertAfter($button.parent().parent());
            block.$el.after(block.renderPlus().$el);
            // if the block has a textblock, set the caret to the end
            if (block.hasTextBlock()) {
                block.setCaret();
            }
            // scroll to element position
            block.scrollTo();
            // show the plus
            $button.parent().prev().show();
            // hide the buttons
            $button.parent().remove();
        },
    
        onClickAddBlock: function(e) {
            // in case it tries to submit.
            e.preventDefault();
            $addBlockButton = $(e.currentTarget);
            $addBlockButton.hide();
            blockId = $addBlockButton.parent().data('after-block-id');
            blockSelection = this.blockSelectionTemplate({content: this.getButtons(blockId)});
            $addBlockButton.parent().append(blockSelection);
        },
    
        getButtons: function(id) {
            // iterate through block types in the block registry
            // and get buttons for each type.
            html = '';
            for (i = 0; i < Villain.BlockRegistry.Map.length; ++i) {
                blockName = Villain.BlockRegistry.Map[i];
                b = Villain.BlockRegistry.getBlockClassByType(blockName);
                if (_.isUndefined(b)) {
                    console.error("Villain: Undefined block ", blockName);
                    continue;
                }
                if (b.hasOwnProperty('getButton')) {
                    html += b.getButton(id);
                } else {
                    console.log("// No button found for " + blockName);
                }
            }
            return html;
        }
    });

    /* Blocks */
    /**
     * blockstore.js
     * This is where we store the blocks. There are multiple stores to deal
     * with columns/superblocks. The columns blocks have their own store
     * named after their id.
     */
    
    Villain.BlockStore = [];
    Villain.BlockStore.stores = [];
    Villain.BlockStore.count = 1;
    
    // Don't need storeName here, since we never want two equal ids
    Villain.BlockStore.getId = function() {
        id = Villain.BlockStore.count;
        Villain.BlockStore.count++;
        return id;
    };
    
    Villain.BlockStore.getBlockById = function(storeName, id) {
        block = _.find(Villain.BlockStore[storeName], function(b) {
            return b.id == id;
        });
        if (!block) {
            return false;
        }
        if (!block.hasOwnProperty('object')) {
            return false;
        }
        return block.object;
    };
    
    Villain.BlockStore.add = function(store, id, blockObject) {
        Villain.BlockStore[store].push({
            id: id,
            object: blockObject
        });
    };
    
    Villain.BlockStore.del = function(store, id) {
        Villain.BlockStore[store] = _.filter(Villain.BlockStore[store], function(block) {
            return parseInt(block.id) !== parseInt(id);
        });
    };
    
    Villain.BlockStore.delStore = function(store) {
        // iterate all blocks
        _.each(Villain.BlockStore[store], function(element, index) {
            element.object.destroy();
        });
        Villain.BlockStore[store] = [];
        var index = Villain.BlockStore.stores.indexOf(store);
        Villain.BlockStore.stores.splice(index, 1);
    };
    
    Villain.BlockStore.create = function(name) {
        Villain.BlockStore[name] = [];
        Villain.BlockStore.stores.push(name);
    };
    
    Villain.BlockStore.listAll = function() {
        for (var i = 0; i < Villain.BlockStore.stores.length; i++) {
            console.log(Villain.BlockStore.stores[i]);
            console.log(Villain.BlockStore[Villain.BlockStore.stores[i]]);
        }
    };
    Villain.Block = Backbone.View.extend({
        tagName: 'div',
        className: 'villain-block-wrapper',
        type: 'base',
        template: _.template('base'),
        store: 'main',
    
        wrapperTemplate: _.template([
            '<div class="villain-block-inner"><%= content %><%= actions %></div>'
        ].join('\n')),
    
        actionsTemplate: _.template([
            '<div class="villain-actions">',
            '  <div class="villain-action-button villain-action-button-setup">',
            '    <i class="fa fa-cogs"></i>',
            '  </div>',
            '  <div class="villain-action-button villain-action-button-del">',
            '    <i class="fa fa-trash"></i>',
            '  </div>',
            '  <div class="villain-action-button villain-action-button-move" draggable="true">',
            '    <i class="fa fa-arrows-alt"></i>',
            '  </div>',
            '</div>'
        ].join('\n')),
    
        setupTemplate: _.template(
            '<div class="villain-setup-block" />'
        ),
    
        events: {
            'dragstart .villain-action-button-move': 'onDragStart',
            'click .villain-action-button-move': 'onClickMove',
            'click .villain-action-button-del': 'onClickDelete',
            'mouseover .villain-block-inner': 'onMouseOver',
            'mouseout .villain-block-inner': 'onMouseOut',
            'paste .villain-text-block': 'onPaste',
            'mouseup .villain-text-block': 'onMouseUp',
            'click .villain-text-block': 'onClick',
            'click .villain-action-button-setup': 'onSetupClick'
        },
    
        initialize: function(json, store) {
            this.data = json || null;
            this.dataId = this.getIdFromBlockStore();
            this.$el.attr('data-block-id', this.dataId);
            this.$el.attr('data-block-type', this.type);
            this.$el.attr('id', 'villain-block-' + this.dataId);
            if (store) {
                this.store = store;
            }
            this.$el.attr('data-blockstore', this.store);
            this.id = 'villain-block-' + this.dataId;
            this.addToBlockStore(store);
            this.render();
        },
    
        render: function() {
            if (this.hasData()) {
                // we got passed data. render editorhtm
                html = this.renderEditorHtml();
            } else {
                // no data, probably want a blank block
                html = this.renderEmpty();
            }
            this.el.innerHTML = html;
            this.setSections();
            this.addSetup();
            return this;
        },
    
        onClick: function(e) {
            var text = this.getSelectedText();
            if (text === '') {
                Villain.EventBus.trigger('formatpopup:hide');
            }
        },
    
        onSetupClick: function(e) {
            e.stopPropagation();
            // is it active now?
            $button = this.$('.villain-action-button-setup');
            if ($button.hasClass('active')) {
                // hide the setup
                $button.removeClass('active');
                this.hideSetup();
            } else {
                $button.addClass('active');
                this.showSetup();
            }
        },
    
        onMouseUp: function(e) {
            // check if there's text selected
            var text = this.getSelectedText();
    
            if (text !== '') {
                Villain.EventBus.trigger('formatpopup:show', this);
            } else {
                Villain.EventBus.trigger('formatpopup:hide');
            }
        },
    
        getSelectedText: function() {
            var text = '';
    
            if (window.getSelection) {
              text = window.getSelection();
            } else if (document.getSelection) {
              text = document.getSelection();
            } else if (document.selection) {
              text = document.selection.createRange().text;
            }
            return text.toString();
        },
    
        deleteBlock: function() {
            Villain.BlockStore.del(this.store, this.dataId);
            this.destroy();
        },
    
        loading: function() {
            this.$el.loadingOverlay();
        },
    
        done: function() {
            this.$el.loadingOverlay('remove');
        },
    
        addToPathName: function(relativeUrl) {
            if (relativeUrl.charAt(0) === "/") {
                return relativeUrl;
            } else {
                var divider = (window.location.pathname.slice(-1) == "/") ? "" : "/";
                var fullPath = window.location.pathname + divider + relativeUrl;
            }
            return fullPath;
        },
    
        destroy: function() {
            // delete the plus after
            this.$el.next('.villain-add-block').remove();
            // TODO: find the plus object and delete it...
            // COMPLETELY UNBIND THE VIEW
            this.undelegateEvents();
            this.$el.removeData().unbind();
            // Remove view from DOM
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
    
        onClickDelete: function(e) {
            this.deleteBlock();
            e.stopPropagation();
        },
    
        onClickMove: function(e) {
            e.stopPropagation();
        },
    
        onDragStart: function(e) {
            e.originalEvent.dataTransfer.setDragImage(this.$el.get(0), this.$el.width(), this.$el.height());
            e.originalEvent.dataTransfer.setData('Text', this.dataId);
            e.stopPropagation();
        },
    
        onMouseOver: function(e) {
            event.stopPropagation();
            this.$inner.addClass('hover');
            this.$inner.children('.villain-actions').visible();
        },
    
        onMouseOut: function(e) {
            this.$inner.removeClass('hover');
            this.$inner.children('.villain-actions').invisible();
        },
    
        onPaste: function(e) {
            var clipboard = false;
            if (e && e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
                var types = '',
                    clipboard_types = e.originalEvent.clipboardData.types;
    
                if ($.isArray(clipboard_types)) {
                    for (var i = 0 ; i < clipboard_types.length; i++) {
                        types += clipboard_types[i] + ';';
                    }
                } else {
                    types = clipboard_types;
                }
    
                if (/text\/html/.test(types)) {
                    // HTML.
                    clipboardHTML = e.originalEvent.clipboardData.getData('text/html');
                } else if (/text\/rtf/.test(types) && Villain.browser.safari) {
                    // Safari HTML.
                    clipboardHTML = e.originalEvent.clipboardData.getData('text/rtf');
                } else if (/text\/plain/.test(types) && !Villain.browser.mozilla) {
                    clipboardHTML = e.originalEvent.clipboardData.getData('text/plain').replace(/\n/g, '<br/>');
                }
    
                if (this.clipboardHTML !== '') {
                    clipboard = true;
                } else {
                    this.clipboardHTML = null;
                }
    
                if (clipboard) {
                    cleanHtml = Villain.Editor.processPaste(clipboardHTML);
                    e.stopPropagation();
                    e.preventDefault();
                    Villain.Editor.pasteHtmlAtCaret(cleanHtml);
                    return false;
                }
            }
        },
    
        getIdFromBlockStore: function() {
            return Villain.BlockStore.getId();
        },
    
        doRenderCallback: function() {
    
        },
    
        hasTextBlock: function() {
            // check if the block has its own textblock
            return this.$('.villain-text-block').length === 0 ? false : true;
        },
    
        setCaret: function() {
            var range, selection;
    
            range = document.createRange();
            range.selectNodeContents(this.getTextBlock()[0]);
            range.collapse(false);
    
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },
    
        scrollTo: function() {
            $('html, body').animate({
                scrollTop: this.$el.offset().top - 75
            }, 300, 'linear');
        },
    
        flash: function(color, duration) {
    
        },
    
        getJSON: function() {
            return [];
        },
    
        addToBlockStore: function(store) {
            Villain.BlockStore.add(store ? store : 'main', this.dataId, this);
        },
    
        setData: function(json) {
            this.data = json;
        },
    
        getData: function() {
            return this.data;
        },
    
        setDataProperty: function(prop, value) {
            data = this.getData();
            data[prop] = value;
            this.setData(data);
        },
    
        hasData: function() {
            return this.data ? !_.isEmpty(this.data) : false;
        },
    
        refreshBlock: function() {
            html = this.renderEditorHtml();
            this.el.innerHTML = html;
            this.addSetup();
            return this;
        },
    
        refreshContentBlock: function(hidden) {
            block = this.renderContentBlockHtml();
            this.$content.html($(block).html());
            return this.$content;
        },
    
        setSections: function() {
            this.$inner = this.$('.villain-block-inner');
            this.$content = this.$('.villain-content');
        },
    
        addSetup: function() {
            if (this.setup) {
                // the block has a setup method - add the setupTemplate
                // and call setup()
                this.$inner.prepend(this.setupTemplate());
                this.$setup = this.$('.villain-setup-block');
                // show the setup button
                this.$('.villain-action-button-setup').show();
                this.setup();
            } else {
                this.$('.villain-action-button-setup').hide();
            }
        },
    
        clearSetup: function() {
            this.$setup.empty();
        },
    
        getTextBlock: function() {
            this.$textBlock = this.$('.villain-text-block');
            return this.$textBlock;
        },
    
        getTextBlockInner: function() {
            tb = this.getTextBlock();
            return tb.html();
        },
    
        clearInsertedStyles: function(e) {
            var target = e.target;
            target.removeAttribute('style'); // Hacky fix for Chrome.
        },
    
        renderEditorHtml: function() {},
    
        renderEmpty: function() {},
    
        renderPlus: function() {
            addblock = new Villain.Plus(this.store);
            return addblock;
        },
    
        showSetup: function() {
            innerHeight = this.$inner.height();
            this.$content.hide();
            $button = this.$('.villain-action-button-setup');
            $button.addClass('active');
            this.$setup.show();
            if (this.$setup.height() < innerHeight) {
                this.$setup.height(innerHeight);
            }
        },
    
        hideSetup: function() {
            this.$setup.hide();
            this.$setup.height("");
            $button = this.$('.villain-action-button-setup');
            $button.removeClass('active');
            this.$content.show();
        }
    });

    /* Blocktypes */
    Villain.Blocks.Text = Villain.Block.extend({
        type: 'text',
        template: _.template(
            '<div class="villain-text-block villain-content" contenteditable="true" data-text-type="<%= type %>"><%= content %></div>'
        ),
    
        renderEditorHtml: function() {
            blockTemplate = this.renderContentBlockHtml();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderContentBlockHtml: function() {
            text = this.getTextBlockInner() ? this.getTextBlockInner() : this.data.text;
            return this.template({content: Villain.toHTML(text), type: this.data.type});
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: 'Text', type: "paragraph"});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getJSON: function() {
            textNode = Villain.toMD(this.getTextBlockInner());
            data = this.getData();
            json = {
                type: this.type,
                data: {
                    text: textNode,
                    type: data.type
                }
            };
            return json;
        },
    
        getHTML: function() {
            textNode = this.getTextBlock().html();
            return markdown.toHTML(textNode);
        },
    
        setup: function() {
            data = this.getData();
            if (!data.hasOwnProperty('type')) {
                this.setDataProperty('type', 'paragraph');
            }
            type = this.data.type;
            this.$setup.hide();
            var radios = "";
            types = ['paragraph', 'lead'];
            for (i in types) {
                selected = "";
                if (type === types[i]) {
                    selected = ' checked="checked"';
                }
                radios += '<label><input type="radio" name="text-type" value="'
                        + types[i] + '"' + selected + '>' + types[i] + '</label>';
            }
    
            this.$setup.append($([
                '<label>Type</label>',
                radios
            ].join('\n')));
    
            this.$setup.find('input[type=radio]').on('change', $.proxy(function(e) {
                this.setDataProperty('type', $(e.target).val());
                this.refreshContentBlock();
                this.$content.attr('data-text-type', $(e.target).val());
            }, this));
        },
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'text';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-paragraph"></i>',
                '<p>text</p>',
                '</button>'].join('\n'));
            return t({id: afterId, type: blockType});
        }
    });
    Villain.Blocks.Blockquote = Villain.Block.extend({
        type: 'blockquote',
        template: _.template(
            '<div class="villain-quote-block villain-content"><blockquote contenteditable="true"><%= content %></blockquote><cite contenteditable="true"><%= cite %></cite></div>'
        ),
    
        renderEditorHtml: function() {
            blockTemplate = this.renderContentBlockHtml();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderContentBlockHtml: function() {
            text = this.getTextBlockInner() ? this.getTextBlockInner() : this.data.text;
            return this.template({content: Villain.toHTML(text), cite: this.data.cite});
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: 'quote', cite: 'author'});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getJSON: function() {
            quote = this.$content.find('blockquote')[0].outerHTML;
            cite = $('cite', this.$content).html();
            textNode = Villain.toMD(quote);
            data = this.getData();
            json = {
                type: this.type,
                data: {
                    text: textNode,
                    cite: cite
                }
            };
            return json;
        },
    
        getHTML: function() {
            textNode = this.getTextBlock().html();
            return markdown.toHTML(textNode);
        }
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'blockquote';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-quote-right"></i>',
                '<p>quote</p>',
                '</button>'].join('\n'));
            return t({id: afterId, type: blockType});
        }
    });

    Villain.Blocks.Divider = Villain.Block.extend({
        type: 'divider',
        template: _.template('<div class="villain-divider-block villain-content"><hr></div>'),
    
        renderEditorHtml: function() {
            blockTemplate = this.template();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderEmpty: function() {
            blockTemplate = this.template();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getJSON: function() {
            json = {
                type: this.type,
                data: {
                    text: '--------------------'
                }
            };
            return json;
        },
    
        getHTML: function() {
            return '<hr>';
        }
    }, {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'divider';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-minus"></i>',
                '<p>hr</p>',
                '</button>'].join('\n'));
            return t({id: afterId, type: blockType});
        }
    });
    Villain.Blocks.Header = Villain.Block.extend({
        type: 'header',
        template: _.template([
            '<div class="villain-text-block villain-text-block-header villain-content" data-header-level="<%= level %>" contenteditable="true">',
              '<%= content %>',
            '</div>'
        ].join('\n')),
    
        renderEditorHtml: function() {
            blockTemplate = this.renderContentBlockHtml();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderContentBlockHtml: function() {
            return this.template({content: this.data.text, level: this.data.level});
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: 'Header', level: 1});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        setup: function() {
            data = this.getData();
            if (!data.hasOwnProperty('level')) {
                this.setDataProperty('level', 1);
            }
            level = data['level'];
            this.$setup.hide();
            var radios = "";
            levels = [1, 2, 3, 4, 5];
            for (i in levels) {
                selected = "";
                if (parseInt(level) === parseInt(levels[i])) {
                    selected = ' checked="checked"';
                }
                radios += '<label><input type="radio" name="header-size" value="' + levels[i] + '"' + selected + '>H' + levels[i] + '</label>';
            }
            this.$setup.append($([
                '<label>Størrelse</label>',
                radios
            ].join('\n')));
    
            this.$setup.find('input[type=radio]').on('change', $.proxy(function(e) {
                this.setDataProperty('level', $(e.target).val());
                this.refreshContentBlock();
                this.$content.attr('data-header-level', $(e.target).val());
            }, this));
        },
    
        getData: function() {
            data = this.data;
            data.text = Villain.toMD(this.getTextBlock().html()).trim();
            return data;
        },
    
        getJSON: function() {
            // strip newlines
            json = {
                type: this.type,
                data: this.getData()
            };
            return json;
        },
    
        getHTML: function() {
            textNode = this.getTextBlock().html();
            return '<h3>' + markdown.toHTML(textNode) + '</h3>';
        }
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'header';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-header"></i>',
                '<p>h1-6</p>',
                '</button>'].join('\n'));
            return t({
                id: afterId,
                type: blockType
            });
        }
    });
    Villain.Blocks.List = Villain.Block.extend({
        type: 'list',
        template: _.template([
            '<div class="villain-text-block villain-text-block-list villain-content" contenteditable="true">',
              '<%= content %>',
            '</div>'].join('\n')
        ),
    
        events: {
            'keyup .villain-content': 'onKeyUp'
        },
    
        onKeyUp: function(e) {
            console.log(e.currentTarget.innerHTML);
            if (e.currentTarget.innerText == "" || e.currentTarget.innerText == "\n") {
                console.log("empty!");
                e.currentTarget.innerHTML = "<ul><li><br></li></ul>";
            }
        },
    
        renderEditorHtml: function() {
            blockTemplate = this.template({content: markdown.toHTML(this.data.text)});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: '<ul><li>list</li></ul>'});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getJSON: function() {
            textNode = this.getTextBlock().html().replace(/<\/li>/mg,'\n')
                                                 .replace(/<\/?[^>]+(>|$)/g, '')
                                                 .replace(/^(.+)$/mg,' - $1');
            json = {
                type: this.type,
                data: {
                    text: textNode
                }
            };
            return json;
        },
    
        getHTML: function() {
            textNode = this.getTextBlock().html();
            return '<h3>' + markdown.toHTML(textNode) + '</h3>';
        },
    
        toMarkdown: function(markdown) {
          return markdown.replace(/<\/li>/mg,'\n')
                         .replace(/<\/?[^>]+(>|$)/g, '')
                         .replace(/^(.+)$/mg,' - $1');
        }
        /*
        onBlockRender: function() {
          this.checkForList = _.bind(this.checkForList, this);
          this.getTextBlock().on('click keyup', this.checkForList);
        },
        */
    
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'list';
            t = _.template([
                '<button class="villain-block-button" ',
                '        data-type="<%= type %>" ',
                '        data-after-block-id="<%= id %>"',
                '>',
                '   <i class="fa fa-list-ul"></i>',
                '<p>list</p>',
                '</button>'].join('\n'));
            return t({
                id: afterId,
                type: blockType
            });
        }
    });

    Villain.Blocks.Image = Villain.Block.extend({
        type: 'image',
        template: _.template(
            '<div class="villain-image-block villain-content"><img class="img-responsive" src="<%= url %>" /></div>'
        ),
    
        events: {
            'drop .villain-image-dropper i': 'onDropImage',
            'dragenter .villain-image-dropper i': 'onDragEnter',
            'dragleave .villain-image-dropper i': 'onDragLeave',
            'dragover .villain-image-dropper i': 'onDragOver',
            'click .villain-image-dropper-upload': 'onUploadClickAfterDrop'
        },
    
        initialize: function(json, store) {
            Villain.Block.prototype.initialize.apply(this, [json, store]);
            _.extend(this.events, Villain.Block.prototype.events);
        },
    
        renderEditorHtml: function() {
            blockTemplate = this.renderContentBlockHtml();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderContentBlockHtml: function() {
            return this.template({url: this.data.url});
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({url: 'http://placehold.it/1150x400'});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        onUploadClickAfterDrop: function(e) {
            var uid  = [this.dataId, (new Date()).getTime(), 'raw'].join('-');
            var data = new FormData();
    
            e.preventDefault();
            this.loading();
            img = this.$setup.find('.villain-image-dropper img');
            if (!this.file) {
                this.done();
                return false;
            }
            data.append('name', this.file.name);
            data.append('image', this.file);
            data.append('uid', uid);
    
            that = this;
    
            $.ajax({
                type: 'post',
                dataType: 'json',
                accepts: {
                    json: 'text/json'
                },
                url: this.addToPathName(Villain.options['uploadURL']),
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                // Custom XMLHttpRequest
                xhr: function() {
                    var customXhr = $.ajaxSettings.xhr();
                    // Check if upload property exists
                    if (customXhr.upload) {
                        customXhr.upload.addEventListener('progress', that.progressHandlingFunction, false);
                    }
                    return customXhr;
                }
            }).done($.proxy(function(data) {
                /**
                 * Callback after confirming upload
                 */
                if (data.status == '200') {
                    // image uploaded successfully
                    this.$setup.append('<div class="villain-message success">Bildet er lastet opp</div>');
                    // remove upload button
                    this.$setup.find('.villain-image-dropper-upload').remove();
                    this.$setup.find('.villain-image-dropper').remove();
    
                    if (data.hasOwnProperty('image')) {
                        imageData = data.image;
                        $image = $('<img src="' + imageData.src + '" />');
                        this.$setup.append($image);
    
                        // set the image src as data
                        json = {
                            url: imageData.src,
                            sizes: imageData.sizes
                        };
                        this.setData(json);
                    }
    
                    if (data.hasOwnProperty('uid')) {
                        uid = data.uid;
                    }
    
                    if (data.hasOwnProperty('form')) {
                        var inputsHtml = '';
                        inputTemplate = _.template([
                            '<label><%= label %></label>',
                            '<input type="<%= type %>" ',
                            '       value="<%= value %>" ',
                            '       name="<%= name %>"',
                            '/>'
                        ].join('\n'));
                        for (var i = 0; i < data.form.fields.length; i++) {
                            field = data.form.fields[i];
                            inputsHtml += inputTemplate({
                                label: field.label,
                                type: field.type,
                                value: field.value,
                                name: field.name
                            });
                        }
                        formTemplate = _.template([
                            '<form method="<%= method %>" ',
                            '      action="<%= action %>" ',
                            '      class="villain-form" ',
                            '      name="<%= name %>"',
                            '>',
                            '<%= inputs %>',
                            '</form>'
                        ].join('\n'));
                        form = formTemplate({
                            method: data.form.method,
                            action: that.addToPathName(data.form.action),
                            name: data.form.name,
                            inputs: inputsHtml
                        });
                        $form = $(form);
                        $submitButton = $('<input type="submit" name="' + data.form.name + '-submit" value="Lagre" />');
    
                        $submitButton.on('click', function(e) {
                            e.preventDefault();
    
                            serializedForm = $form.serialize();
                            imagedata = new FormData();
                            imagedata.append('form', serializedForm);
                            imagedata.append('uid', uid);
    
                            $.ajax({
                                type: 'post',
                                url: that.addToPathName(data.form.action),
                                data: imagedata,
                                cache: false,
                                contentType: false,
                                processData: false,
                                dataType: 'json'
                            }).done($.proxy(function(data) {
                                if (data.status == 200) {
                                    // set the image title and credits as data
                                    json = that.getData();
                                    json.title = data.title;
                                    json.credits = data.credits;
                                    json.link = "";
                                    that.setData(json);
                                    that.refreshContentBlock();
                                    that.hideSetup();
                                    that.setup();
                                }
                            }, this));
                        });
                        $form.append($submitButton);
                        this.$setup.append($form);
                    }
                }
            }, this)).fail($.proxy(function() {
                // Failed during upload.
                alert('Feil fra server under opplasting.');
            }, this)).always($.proxy(function() {
                // block.removeQueuedItem, block, uid
            }));
            // block.addQueuedItem(uid, xhr); ?
            this.done();
        },
    
        progressHandlingFunction: function(e) {
            if (e.lengthComputable) {
                // value
                //$('progress').attr({value:e.loaded, max:e.total});
            }
        },
    
        onDragEnter: function(e) {
            this.$('.villain-image-dropper i').addClass('drop-hover');
            e.preventDefault();
        },
    
        onDragLeave: function(e) {
            this.$('.villain-image-dropper i').removeClass('drop-hover');
            e.preventDefault();
        },
    
        onDragOver: function(e) {
            e.preventDefault();
        },
    
        onDropImage: function(e) {
            e.preventDefault();
            this.$('.villain-image-dropper i').removeClass('drop-hover');
            dataTransfer = e.originalEvent.dataTransfer;
            var file = dataTransfer.files[0],
                urlAPI = (typeof URL !== 'undefined') ? URL : (typeof webkitURL !== 'undefined') ? webkitURL : null;
    
            // Handle one upload at a time
            if (/image/.test(file.type)) {
                // Show this image on here
                this.$('.villain-image-dropper').html($('<img>', {src: urlAPI.createObjectURL(file)}));
                $form = $([
                    '<form enctype="multipart/form-data" ',
                          'encoding="multipart/form-data" action="upload/image" ',
                          'method="post" id="villain-upload-form-' + this.dataId + '">',
                        '<input id="villain-upload-file-' + this.dataId + '" ',
                               'type="file" ',
                               'name="villain-upload-file-' + this.dataId + '" ',
                               'accept="image/*">',
                    '</form>'].join('\n'));
    
                this.$setup.append('<hr>');
                this.$setup.append(
                    '<button class="villain-image-dropper-upload">Last opp og lagre</button>'
                );
                this.file = file;
            }
        },
    
        getJSON: function() {
            data = this.getData();
            json = {
                type: this.type,
                data: {
                    url: data.url,
                    sizes: data.sizes,
                    title: data.title || "",
                    credits: data.credits || "",
                    link: data.link || ""
                }
            };
            return json;
        },
    
        getHTML: function() {
            url = this.$('img').attr('src');
            return this.template({url: url});
        },
    
        setup: function() {
            // check if this block has data. if not, show the setup div
            that = this;
            if (!this.hasData()) {
                this.$('.villain-image-block').hide();
                $imageDropper = $([
                    '<div class="villain-image-dropper"><i class="fa fa-image"></i>',
                        '<div>Dra bildet du vil laste opp hit</div>',
                        '<div><hr></div>',
                        '<div>',
                            '<button class="villain-image-browse-button">Hent bilde fra server</button>',
                        '</div>',
                    '</div>'
                ].join('\n'));
                $imageDropper.find('.villain-image-browse-button').on('click', $.proxy(this.onImageBrowseButton, this));
                this.$setup.append($imageDropper);
                this.$setup.show();
            } else {
                this.clearSetup();
                data = this.getData();
                $meta = $([
                    '<label for="title">Tittel</label><input value="' + data.title + '" type="text" name="title" />',
                    '<label for="credits">Kreditering</label><input value="' + data.credits + '" type="text" name="credits" />',
                    '<label for="link">URL</label><input value="' + data.link + '" type="text" name="link" />'
                ].join('\n'));
                this.$setup.append($meta);
                this.$setup.find('input[name="title"]').on('keyup', _.debounce(function (e) {
                    that.setDataProperty('title', $(this).val());
                }, 700, false));
                this.$setup.find('input[name="credits"]').on('keyup', _.debounce(function (e) {
                    that.setDataProperty('credits', $(this).val());
                }, 700, false));
                this.$setup.find('input[name="link"]').on('keyup', _.debounce(function (e) {
                    that.setDataProperty('link', $(this).val());
                }, 700, false));
    
                this.$setup.append($('<label>Størrelse</label>'));
    
                /* create sizes overview */
                for (var key in data.sizes) {
                    if (data.sizes.hasOwnProperty(key)) {
                        checked = '';
                        if (data.sizes[key] == data.url) {
                            checked = ' checked="checked"';
                        }
                        $radio = $('<label for="' + key +'">'
                               + '<input type="radio" name="' + 'imagesize'
                               + '" value="' + data.sizes[key] + '"'
                               + checked + ' />' + key + '</label>');
                        this.$setup.append($radio);
                    }
                }
                this.$setup.find('input[type=radio]').on('change', $.proxy(function(e) {
                    this.setUrl($(e.target).val());
                }, this));
                this.hideSetup();
            }
        },
    
        setUrl: function(url) {
            this.setDataProperty('url', url);
            this.refreshContentBlock();
        },
    
        onImageBrowseButton: function(e) {
            e.preventDefault();
            this.loading();
            $.ajax({
                type: 'get',
                url: this.addToPathName(Villain.options['browseURL']),
                cache: false,
                contentType: false,
                processData: false,
                dataType: 'json'
            }).done($.proxy(function(data) {
                /**
                 * Data returned from image browse.
                 */
                if (data.status != 200) {
                    alert('Ingen bilder fantes.');
                    this.done();
                    return false;
                }
                if (!data.hasOwnProperty('images')) {
                    return false;
                }
                $images = $('<div />');
                for (var i = 0; i < data.images.length; i++) {
                    img = data.images[i];
                    $store_img = $('<img src="' + img.thumb + '" />');
                    $store_img.data('sizes', img.sizes)
                              .data('large', img.src)
                              .data('title', img.title)
                              .data('credits', img.credits);
                    $images.append($store_img);
                }
                $images.on('click', 'img', $.proxy(function(e) {
                    this.setData({
                        url: $(e.target).data('large'),
                        title: $(e.target).data('title'),
                        credits: $(e.target).data('credits'),
                        sizes: $(e.target).data('sizes')
                    });
                    data = this.getData();
                    this.refreshContentBlock();
                    this.hideSetup();
                    this.setup();
                }, this));
    
                this.$setup.html('');
                this.$setup.append('<div class="villain-message success">Klikk på bildet du vil sette inn</div>');
                this.$setup.append($images);
                this.done();
            }, this));
        },
    
        onUploadImagesButton: function(e) {
            var files = e.target.files,
                urlAPI = (typeof URL !== 'undefined') ? URL : (typeof webkitURL !== 'undefined') ? webkitURL : null;
            fileList = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                fileList.push([
                    '<div class="three">',
                    '<div class="center-cropped" style="background-image: url(', urlAPI.createObjectURL(f), ');"></div>',
                    '</div>'].join('\n')
                );
            }
            listHTML = '<div style="margin-top: 10px;" class="wrapper"><div class="row">';
            for (var x = 0; x < fileList.length; x++) {
                if (x && (x  % 4) === 0) {
                    // add row
                    listHTML += '</div><div style="margin-top: 15px" class="row">' + fileList[x];
                } else {
                    listHTML += fileList[x];
                }
            }
            listHTML += '</div></div>';
            this.$setup.append(listHTML);
        }
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'image';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-file-image-o"></i>',
                '<p>img</p>',
                '</button>'].join('\n'));
            return t({id: afterId, type: blockType});
        }
    });
    Villain.Blocks.Slideshow = Villain.Block.extend({
        type: 'slideshow',
        template: _.template([
            '<div class="villain-slideshow-block villain-content" contenteditable="false">',
              '<h4>Slideshow</h4>',
              '<%= content %>',
            '</div>'
        ].join('\n')),
    
        renderEditorHtml: function() {
            blockTemplate = this.renderContentBlockHtml();
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderContentBlockHtml: function() {
            images = this.renderDataImages();
            return this.template({content: images});
        },
    
        renderDataImages: function() {
            var data = this.getData();
            if (_.isUndefined(data.images)) {
                return "";
            } else {
                var html = "";
                for (var i = 0; i < data.images.length; i++) {
                    img = data.images[i];
                    html += '<img src="' + data.media_url + '/' + img.sizes.thumb + '" />';
                }
                return html;
            }
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: '<i class="fa fa-th"></i>'});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getAllImageseries: function() {
            that = this;
            $select = this.$setup.find('.imageserie-select');
            $.ajax({
                type: 'get',
                dataType: 'json',
                accepts: {
                    json: 'text/json'
                },
                url: this.addToPathName(Villain.options['imageseriesURL']),
                cache: false,
                contentType: false,
                processData: false,
                // Custom XMLHttpRequest
                xhr: function() {
                    var customXhr = $.ajaxSettings.xhr();
                    // Check if upload property exists
                    if (customXhr.upload) {
                        customXhr.upload.addEventListener('progress', that.progressHandlingFunction, false);
                    }
                    return customXhr;
                }
            }).done($.proxy(function(data) {
                /**
                 * Callback after confirming upload
                 */
                if (data.status == '200') {
                    $select.append(that.buildOptions(data.series, true));
                    if (!_.isUndefined(that.data.imageseries)) {
                        $select.val(that.data.imageseries).change();
                    }
                }
            }));
        },
    
        getImageseries: function(series) {
            $.ajax({
                type: 'get',
                dataType: 'json',
                accepts: {json: 'text/json'},
                url: this.addToPathName(Villain.options['imageseriesURL']),
                data: {series: series},
                cache: false,
                contentType: false,
                // Custom XMLHttpRequest
                xhr: function() {
                    var customXhr = $.ajaxSettings.xhr();
                    // Check if upload property exists
                    if (customXhr.upload) {
                        customXhr.upload.addEventListener('progress', that.progressHandlingFunction, false);
                    }
                    return customXhr;
                }
            }).done($.proxy(function(data) {
                /**
                 * Callback after confirming upload
                 */
                if (data.status == '200') {
                    var json = {};
    
                    json.imageseries = data.series;
                    json.media_url = data.media_url;
                    json.images = data.images;
    
                    if (that.$setup.find('.imageserie-size-select').length > 0) {
                        // we already have the size select
                    } else {
                        // add size dropdown
                        var sizeSelect = '<label for="imageserie-size">Str:</label>' +
                                         '<select class="imageserie-size-select" ' +
                                         '        name="imageserie-size"></select>';
                        that.$setup.append(sizeSelect);
                    }
    
                    var $sizeSelect = that.$setup.find('.imageserie-size-select');
                    $sizeSelect.html('');
                    $sizeSelect.append(that.buildOptions(data.sizes, true));
                    if (!_.isUndefined(that.data.size)) {
                        $sizeSelect.val(that.data.size).change();
                        json.size = that.data.size;
                    }
                    $sizeSelect.on('change', function(e) {
                        json.size = $(this).val();
                        that.hideSetup();
                    });
                    that.setData(json);
                    that.refreshContentBlock();
                }
            }));
        },
    
        buildOptions: function(values, placeholder) {
            if (placeholder) {
                html = '<option disabled="disabled" selected="selected">---</option>';
            } else {
                html = '';
            }
            for (var i = 0; i < values.length; i++) {
                val = values[i];
                html += '<option value="' + val + '">' + val + '</option>';
            }
            return html;
        },
    
        setup: function() {
            if (!this.hasData()) {
                this.$content.hide();
    
                that = this;
                data = this.getData();
                //this.$setup.hide();
                var select = '<select class="imageserie-select" name="imageserie"></select>';
                this.$setup.append($([
                    '<label for="imageserie">Bildeserie</label>',
                    select
                ].join('\n')));
    
                $select = this.$setup.find('.imageserie-select');
                $select.on('change', function(e) {
                    that.getImageseries($(this).val());
                });
    
                this.getAllImageseries();
            } else {
                this.$setup.hide();
                var select = '<select class="imageserie-select" name="imageserie"></select>';
                this.$setup.append($([
                    '<label for="imageserie">Bildeserie</label>',
                    select
                ].join('\n')));
    
                $select = this.$setup.find('.imageserie-select');
                $select.on('change', function(e) {
                    that.getImageseries($(this).val());
                });
                this.getAllImageseries();
            }
        },
    
        getData: function() {
            data = this.data;
            return data;
        },
    
        getJSON: function() {
            var data = this.getData();
            // strip out images, we don't need to store them since they are
            // already in the DB.
            delete data.images;
            delete data.media_url;
            json = {
                type: this.type,
                data: data
            };
            return json;
        },
    
        getHTML: function() {
            textNode = this.getTextBlock().html();
            return '<h3>' + markdown.toHTML(textNode) + '</h3>';
        }
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'slideshow';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-th"></i>',
                '<p>slides</p>',
                '</button>'].join('\n'));
            return t({
                id: afterId,
                type: blockType
            });
        }
    });
    Villain.Blocks.Video = Villain.Block.extend({
        type: 'video',
    
        providers: {
            vimeo: {
                regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,
                html: ['<iframe src=\"{{protocol}}//player.vimeo.com/video/{{remote_id}}?title=0&byline=0\" ',
                       'width=\"580\" height=\"320\" frameborder=\"0\"></iframe>'].join('\n')
            },
            youtube: {
                regex: /(?:http[s]?:\/\/)?(?:www.)?(?:(?:youtube.com\/watch\?(?:.*)(?:v=))|(?:youtu.be\/))([^&].+)/,
                html: ['<iframe src=\"{{protocol}}//www.youtube.com/embed/{{remote_id}}\" ',
                       'width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>'].join('\n')
            }
        },
    
        template: _.template(
            '<div class="villain-video-block villain-content"><%= content %></div>'
        ),
    
        events: {
            'click .villain-setup-block button': 'onClick'
        },
    
        onClick: function(e) {
            e.preventDefault();
            videoUrl = this.$('.villain-video-setup-url').val();
            // parse the url
            if (!_.isURI(videoUrl)) {
                return;
            }
    
            embedString = this.buildString(videoUrl);
    
            this.$content.html(embedString);
            this.hideSetup();
        },
    
        buildString: function(videoUrl) {
            var match, data;
    
            _.each(this.providers, function(provider, index) {
                match = provider.regex.exec(videoUrl);
    
                if (match !== null && !_.isUndefined(match[1])) {
                    data = {
                        source: index,
                        remote_id: match[1]
                    };
                    this.setData(data);
                }
            }, this);
    
            if (!this.providers.hasOwnProperty(data.source)) {
                return;
            }
    
            var embedString = this.providers[data.source].html
                .replace('{{protocol}}', window.location.protocol)
                .replace('{{remote_id}}', data.remote_id)
                .replace('{{width}}', '100%'); // for videos that can't resize automatically like vine
    
            return embedString;
        },
    
        initialize: function(json, store) {
            Villain.Block.prototype.initialize.apply(this, [json, store]);
            _.extend(this.events, Villain.Block.prototype.events);
        },
    
        renderEditorHtml: function() {
            if (!this.providers.hasOwnProperty(this.data.source)) {
                return;
            }
    
            var embedString = this.providers[this.data.source].html
                .replace('{{protocol}}', window.location.protocol)
                .replace('{{remote_id}}', this.data.remote_id)
                .replace('{{width}}', '100%'); // for videos that can't resize automatically like vine
    
            blockTemplate = this.template({content: embedString});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: ''});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return wrapperTemplate;
        },
    
        getJSON: function() {
            url = this.$('img').attr('src');
            json = {
                type: this.type,
                data: this.data
            };
            return json;
        },
    
        getHTML: function() {
            url = this.$('img').attr('src');
            return this.template({url: url});
        },
    
        setup: function() {
            // check if this block has data
            // if not, show the setup div
            if (!this.hasData()) {
                this.$('.villain-video-block').hide();
                videoSetup = $([
                    '<div class="villain-video-setup-icon">',
                        '<i class="fa fa-video-camera"></i>',
                        '<div>Lim inn link til youtube eller vimeo, f.eks http://www.youtube.com/watch?v=jlbunmCbTBA</div>',
                    '</div>',
                    '<div class="villain-video-setup-input-wrapper">',
                        '<input type="text" name="villain-video-setup-url" class="villain-video-setup-url" />',
                    '</div>',
                    '<div><hr></div>',
                    '<div style="text-align: center;"><button>Hent video</button></div>',
                ].join('\n'));
                this.$setup.append(videoSetup);
                this.$setup.show();
            }
        }
    },
    {
        /* static methods */
        getButton: function(afterId) {
            var blockType = 'video';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-video-camera"></i>',
                '<p>video</p>',
                '</button>'].join('\n'));
            return t({
                id: afterId,
                type: blockType
            });
        }
    });

    /* Columns */
    
    Villain.Blocks.Columns = Villain.Block.extend({
        type: 'columns',
        template: _.template('<div class="row"></div>'),
        columnTemplate: _.template('<div class="<%= columnClass %>"></div>'),
    
        events: {
            'keyup input[name="villain-columns-number"]': '_updateColumnCount',
            'click button.villain-columns-apply': '_applyColumnCount'
        },
    
        initialize: function(json, store) {
            Villain.Block.prototype.initialize.apply(this, [json, store]);
            _.extend(this.events, Villain.Block.prototype.events);
        },
    
        deleteBlock: function() {
            // delete the store containing all the child blocks
            if (Villain.BlockStore.hasOwnProperty(this.store)) {
                Villain.BlockStore.delStore(this.store);
            }
            // delete the block from mainstore
            Villain.BlockStore.del('main', this.dataId);
            // destroy block
            this.destroy();
        },
    
        renderBlock: function(block) {
            // overrides the editors renderer, since we want the blocks to
            // render inside the column view.
            // But only if we're the parent!
            if (!block.$parent) {
                return false;
            }
            if (block.$parent.attr('id') === this.$el.attr('id')) {
                this.$el.append(block.el);
            }
        },
    
        // override render
        render: function() {
            // create a blockstore for these columns
            Villain.BlockStore.create(this.id);
            this.store = this.id;
            this.$el.attr('data-blockstore', this.store);
    
            blockTemplate = this.template({content: this.data});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            this.el.innerHTML = wrapperTemplate;
    
            this.$inner = this.$('.villain-block-inner');
            this.$content = this.$('.row');
    
            if (this.data) {
                // we got passed data. render editorhtml
                this.renderEditorHtml();
            } else {
                // no data, probably want a blank block
                this.renderEmpty();
            }
    
            if (this.setup) {
                // the block has a setup method - add the setupTemplate
                // and call setup()
                this.$inner.prepend(this.setupTemplate());
                this.$setup = this.$('.villain-setup-block');
                this.setup();
            }
    
            return this;
        },
    
        renderEditorHtml: function() {
            this.parseRow();
            blockTemplate = this.template({content: this.data});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return this;
        },
    
        renderEmpty: function() {
            blockTemplate = this.template({content: this.data});
            actionsTemplate = this.actionsTemplate();
            wrapperTemplate = this.wrapperTemplate({content: blockTemplate, actions: actionsTemplate});
            return this;
        },
    
        getRow: function() {
            if (this.$row) {
                return this.$row;
            }
            this.$row = this.$('.row');
            return this.$row;
        },
    
        getColumns: function(filter) {
          return this.getRow().children(filter);
        },
    
        getColumn: function(index) {
          return this.getRow().children(':eq(' + index + ')');
        },
    
        parseRow: function() {
            // create the columns
            $row = this.getRow();
            for (var i = 0; i <= this.data.length - 1; i++) {
                columnClass = this.data[i].class;
                columnData = this.data[i].data;
                $column = $('<div class="' + columnClass + '"></div>');
                $row.append($column);
                $column = this.getColumn(i);
                addblock = new Villain.Plus(this.store);
                $column.append(addblock.$el);
                for (var j = 0; j < columnData.length; j++) {
                    if ((BlockClass = Villain.BlockRegistry.getBlockClassByType(columnData[j].type)) !== false) {
                        block = new BlockClass(columnData[j].data, this.store);
                        $column.append(block.$el);
                        addblock = new Villain.Plus(this.store);
                        $column.append(addblock.$el);
                    }
                }
            }
        },
    
        getJSON: function() {
            var json = {
                type: this.type,
                data: []
            };
            this.getColumns().each(function(i) {
                var blocksData = [];
                $(this).children('.villain-block-wrapper').each(function() {
                    var block = Villain.BlockStore.getBlockById(
                        $(this).attr('data-blockstore'), $(this).attr('data-block-id'));
                    blocksData.push(block.getJSON());
                });
                json.data.push({'class': $(this).attr('class'), data: blocksData});
            });
    
            return json;
        },
    
        setup: function() {
            // check if this block has data
            // if not, show the setup div
            if (!this.hasData()) {
                this.getRow().hide();
                this.$setup.append([
                    '<label for="villain-columns-number">Antall kolonner</label>',
                    '<input type="text" class="villain-columns-number" name="villain-columns-number" />'
                ].join('\n'));
                this.$setup.show();
                this.$('.villain-columns-number').attr('autofocus', 'autofocus');
            } else {
                this.$setup.hide();
            }
        },
    
        _updateColumnCount: function(e) {
            var columnCount = $(e.target).val();
            this.$('.villain-column-widths').remove();
            columnCountWrapper = $('<div class="villain-column-widths" />');
            for (var i = 1; i < (parseInt(columnCount) + 1); i++) {
                columnCountWrapper.append([
                    '<label for="villain-column-width-' + i + '">' +
                    'Kolonne ' + i + ' klassenavn (one, two, three ...)</label>',
                    '<input type="text" name="villain-column-width-' + i + '" class="villain-column-width" />'
                ].join('\n'));
            }
            columnCountWrapper.append('<button class="villain-columns-apply">Sett opp kolonner</button>');
            this.$setup.append(columnCountWrapper);
    
        },
    
        _applyColumnCount: function(e) {
            e.preventDefault();
            columnCount = this.$('input[name="villain-columns-number"]').val();
            for (var i = 1; i < (parseInt(columnCount) + 1); i++) {
                columnClass = this.$('input[name="villain-column-width-' + i + '"]').val();
                this.getRow().append(this.columnTemplate({columnClass: columnClass}));
                addblock = new Villain.Plus(this.store);
                this.getColumn(i - 1).append(addblock.$el);
            }
            // hide the setup
            this.$setup.hide();
            // show the row
            this.getRow().show();
        },
    
        onSetupClick: function(e) {
            e.stopPropagation();
            // is it active now?
            $button = this.$('.villain-action-button-setup');
            if ($button.hasClass('active')) {
                // hide the setup
                $button.removeClass('active');
                this.hideSetup();
            } else {
                $button.addClass('active');
                this.showSetup();
            }
        },
    
        renderPlus: function() {
            addblock = new Villain.Plus('main');
            return addblock;
        }
    },
    {
        /* Static methods */
        getButton: function(afterId) {
            var blockType = 'columns';
            t = _.template([
                '<button class="villain-block-button" data-type="<%= type %>" data-after-block-id="<%= id %>">',
                '<i class="fa fa-columns"></i>',
                '<p>cols</p>',
                '</button>'
            ].join('\n'));
    
            return t({id: afterId, type: blockType});
        }
    });

    var blocks = [];

    Villain.Editor = Backbone.View.extend({
        el: '#villain',
        textArea: '#id_body',
        data: {},
        blocks: {},
    
        events: {
            'submit form': 'clickSubmit',
            'dragover .villain-droppable': 'onDragOverDroppable',
            'dragenter .villain-droppable': 'onDragEnterDroppable',
            'dragleave .villain-droppable': 'onDragLeaveDroppable',
            'drop .villain-droppable': 'onDropDroppable',
            'drop .villain-text-block': 'onDropTextblock'
        },
    
        initialize: function(options) {
            _this = this;
            this.$textArea = $(options.textArea) || this.textArea;
            $('<div id="villain"></div>').insertAfter(this.$textArea);
            this.el = "#villain";
            this.$el = $(this.el);
    
            this.$textArea.hide();
            this.isDirty = false;
            try {
                this.data = JSON.parse(this.$textArea.val());
            } catch (e) {
                this.data = null;
            }
            // inject json to textarea before submitting.
            $('form').submit(function( event ) {
                _this.$textArea.val(_this.getJSON());
            });
            // create a blockstore
            Villain.BlockStore.create('main');
            Villain.setOptions(options);
            // initialize registry with optional extra blocks
            Villain.BlockRegistry.initialize(options.extraBlocks);
            this.render();
        },
    
        render: function() {
            // add + block
            addblock = new Villain.Plus('main');
            this.$el.append(addblock.$el);
            // add format popup
            formatPopUp = new Villain.FormatPopUp();
            this.$el.append(formatPopUp.$el);
            // parse json
            if (!this.data) {
                return false;
            }
            for (var i = 0; i <= this.data.length - 1; i++) {
                blockJson = this.data[i];
                if ((BlockClass = Villain.BlockRegistry.getBlockClassByType(blockJson.type)) !== false) {
                    block = new BlockClass(blockJson.data);
                    this.$el.append(block.$el);
                    this.$el.append(block.renderPlus().$el);
                } else {
                    console.error('Villain: No class found for type: ' + blockJson.type);
                }
            }
        },
    
        organizeMode: function() {
            $('.villain-block-wrapper').toggleClass('organize');
            $('.villain-block-wrapper[data-block-type="columns"]').removeClass('organize');
            $('.organize .villain-content').hide();
        },
    
        getJSON: function() {
            var json = [];
            this.$('.villain-block-wrapper').each(function() {
                // check the main block store for the id. if it's not there
                // it probably belongs to a superblock
                if ((block = Villain.BlockStore.getBlockById('main', $(this).data('block-id'))) !== false) {
                    blockJson = block.getJSON();
                    json.push(blockJson);
                }
            });
            ret = JSON.stringify(json);
            return ret != "[]" ? ret : "";
        },
    
       onDragEnterDroppable: function(e) {
            $('.villain-add-block-button', e.currentTarget).addClass('drop-hover');
            e.preventDefault();
            e.stopPropagation();
        },
    
        onDragLeaveDroppable: function(e) {
            $('.villain-add-block-button', e.currentTarget).removeClass('drop-hover');
            e.preventDefault();
            e.stopPropagation();
        },
    
        onDragOverDroppable: function(e) {
            e.preventDefault();
            e.stopPropagation();
        },
    
        onDropDroppable: function(e) {
            //do something
            target = e.currentTarget;
            if ($(target).hasClass('villain-droppable') !== true) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            $('.villain-add-block-button', target).removeClass('drop-hover');
            sourceId = e.originalEvent.dataTransfer.getData('text/plain');
            $source = $('[data-block-id=' + sourceId + ']');
            $sourceAdd = $source.next();
            $source.detach();
            $sourceAdd.detach();
    
            // move the block
            // we have to remove it from its current blockstore,
            // and add it to the new blockstore!
            $source.insertAfter($(target));
            oldBlockStore = $source.attr('data-blockstore');
            newBlockStore = $(target).attr('data-blockstore');
            // get the block from old blockstore
            block = Villain.BlockStore.getBlockById(oldBlockStore, sourceId);
            block.store = newBlockStore;
            Villain.BlockStore.del(oldBlockStore, sourceId);
            Villain.BlockStore.add(newBlockStore, sourceId, block);
            $source.attr('data-blockstore', newBlockStore);
            $sourceAdd.insertAfter($source);
            $sourceAdd.attr('data-blockstore', newBlockStore);
            // get the block store
        },
    
        onDropTextblock: function(e) {
            $target = $(e.currentTarget).closest('.villain-block-wrapper').shake();
            e.preventDefault();
            e.stopPropagation();
            return false;
        },
    
        clickSubmit: function(e) {
            Villain.EventBus.trigger('posts:submit', e);
            form = this.checkForm();
            if (form.valid === false) {
                e.preventDefault();
            }
            window.onbeforeunload = $.noop();
        },
    
        checkForm: function() {
            var form = {
                valid: true,
                errors: []
            };
            if ($titleEl.val() === '') {
                form.errors.push('Overskrift kan ikke være blank.');
                form.valid = false;
                $titleEl.parent().parent().addClass('error');
                $titleEl.parent().parent().append(
                    '<span class="help-inline"><strong><i class="icon-hand-up"></i> Feltet er påkrevet.</strong></span>'
                );
                $('html, body').animate({
                    scrollTop: 0
                }, 5);
            }
            // clean body text here?
            return form;
        },
    
        markDirty: function() {
            this.isDirty = true;
        },
    });

    Villain.FormatPopUp = Backbone.View.extend({
        tagName: 'div',
        className: 'villain-format-popup',
    
        events: {
            'click .villain-format-bold': 'onClickBold',
            'click .villain-format-italic': 'onClickItalic',
            'click .villain-format-link': 'onClickLink',
            'click .villain-format-unlink': 'onClickUnlink'
        },
    
        onClickBold: function(e) {
            e.preventDefault();
            document.execCommand('bold', false, false);
            this.activateButton('.villain-format-bold');
        },
    
        onClickItalic: function(e) {
            e.preventDefault();
            document.execCommand('italic', false, false);
            this.activateButton('.villain-format-italic');
        },
    
        onClickLink: function(e) {
            e.preventDefault();
            var link = prompt('Sett inn link:'),
                link_regex = /((ftp|http|https):\/\/.)|mailto(?=\:[-\.\w]+@)/;
    
            if (link && link.length > 0) {
                if (!link_regex.test(link)) {
                    link = 'http://' + link;
                }
                document.execCommand('CreateLink', false, link);
            }
            this.activateButton('.villain-format-link');
        },
    
        onClickUnlink: function(e) {
            e.preventDefault();
            document.execCommand('unlink', false, false);
        },
    
        initialize: function() {
            this.render();
            // listen to events
            Villain.EventBus.on('formatpopup:show', this.showPopUp, this);
            Villain.EventBus.on('formatpopup:hide', this.hidePopUp, this);
        },
    
        render: function() {
            // add buttons
            this.$el.append('<button class="popup-button villain-format-bold"><i class="fa fa-bold"></i></button>');
            this.$el.append('<button class="popup-button villain-format-italic"><i class="fa fa-italic"></i></button>');
            this.$el.append('<button class="popup-button villain-format-link"><i class="fa fa-link"></i></button>');
            this.$el.append('<button class="popup-button villain-format-unlink"><i class="fa fa-unlink"></i></button>');
            return this;
        },
    
        showPopUp: function(view) {
            $el = view.$el;
            var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                boundary = range.getBoundingClientRect(),
                offset = $el.offset(),
                coords = {};
                mainContent = $('section#maincontent');
    
            coords.top = boundary.top + mainContent.scrollTop();
            // 12 is padding for text-block
            coords.left = ((boundary.left + boundary.right) / 2) - (this.$el.width() / 2) - offset.left + 12;
            if (parseInt(coords.left) < 0) {
                coords.left = '0';
            }
            coords.left = coords.left  + 'px';
    
            this.deactivateButtons();
            this.activeButtons();
            this.$el.addClass('show-popup');
            this.$el.css(coords);
        },
    
        hidePopUp: function() {
            this.$el.removeClass('show-popup');
        },
    
        activeButtons: function() {
            var selection = window.getSelection(),
                node;
    
            if (selection.rangeCount > 0) {
                node = selection.getRangeAt(0)
                              .startContainer
                              .parentNode;
            }
    
            // link
            if (node && node.nodeName == 'A') {
                this.activateButton('.villain-format-link');
            }
            if (document.queryCommandState('bold')) {
                this.activateButton('.villain-format-bold');
            }
            if (document.queryCommandState('italic')) {
                this.activateButton('.villain-format-italic');
            }
        },
    
        activateButton: function(className) {
            this.$(className).addClass('active');
        },
    
        deactivateButtons: function() {
            this.$('.popup-button').removeClass('active');
        }
    });

    Villain.Editor.HTML = Villain.Editor.HTML || {};
    Villain.Editor.EditorHTML = Villain.Editor.EditorHTML || {};

    Villain.toMD = function toMD(html) {
        var html = toMarkdown(html);
        html = html.replace(/&nbsp;/g,' ');
        // Divitis style line breaks (handle the first line)
        html = html.replace(/([^<>]+)(<div>)/g,'$1\n$2')
                    // (double opening divs with one close from Chrome)
                    .replace(/<div><div>/g,'\n<div>')
                    .replace(/<div><br \/><\/div>/g, '\n\n')
                    .replace(/(?:<div>)([^<>]+)(?:<div>)/g,'$1\n')
                    // ^ (handle nested divs that start with content)
                    .replace(/(?:<div>)(?:<br>)?([^<>]+)(?:<br>)?(?:<\/div>)/g,'$1\n')
                    // ^ (handle content inside divs)
                    .replace(/<\/p>/g,'\n\n')
                    // P tags as line breaks
                    .replace(/<(.)?br(.)?>/g,'\n')
                    // Convert normal line breaks
                    .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
                    // Encoding

        // strip whatever might be left.
        aggressiveStrip = true;
        if (aggressiveStrip) {
            html = html.replace(/<\/?[^>]+(>|$)/g, '');
        } else {
            // strip rest of the tags
            html = html.replace(/<(?=\S)\/?[^>]+(>|$)/ig, '');
        }
        return html;
    };

    Villain.toHTML = function toHTML(markdown, type) {
        // MD -> HTML
        if (_.isUndefined(markdown)) {
            return "";
        }

        type = _.classify(type);

        var html = markdown,
            shouldWrap = type === 'Text';

        if (_.isUndefined(shouldWrap)) { shouldWrap = false; }

        if (shouldWrap) {
            html = '<div>' + html;
        }

        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gm, function(match, p1, p2) {
            return '<a href="' + p2 + '">' + p1.replace(/\r?\n/g, '') + '</a>';
        });

        // This may seem crazy, but because JS doesn't have a look behind,
        // we reverse the string to regex out the italic items (and bold)
        // and look for something that doesn't start (or end in the reversed strings case)
        // with a slash.
        html = _.reverse(
            _.reverse(html)
            .replace(/_(?!\\)((_\\|[^_])*)_(?=$|[^\\])/gm, function(match, p1) {
                return '>i/<' + p1.replace(/\r?\n/g, '').replace(/[\s]+$/,'') + '>i<';
            })
            .replace(/\*\*(?!\\)((\*\*\\|[^\*\*])*)\*\*(?=$|[^\\])/gm, function(match, p1) {
                return '>b/<' + p1.replace(/\r?\n/g, '').replace(/[\s]+$/,'') + '>b<';
            })
        );

        html =  html.replace(/^\> (.+)$/mg,'$1');

        // Use custom formatters toHTML functions (if any exist)
        var formatName, format;
        for (formatName in Villain.Formatters) {
            if (Villain.Formatters.hasOwnProperty(formatName)) {
                format = Villain.Formatters[formatName];
                // Do we have a toHTML function?
                if (!_.isUndefined(format.toHTML) && _.isFunction(format.toHTML)) {
                    html = format.toHTML(html);
                }
            }
        }

        if (shouldWrap) {
            html = html.replace(/\r?\n\r?\n/gm, '</div><div><br></div><div>')
                       .replace(/\r?\n/gm, '</div><div>');
        }

        html = html.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                   .replace(/\r?\n/g, '<br>')
                   .replace(/\*\*/, '')
                   .replace(/__/, '');  // Cleanup any markdown characters left

        // Replace escaped
        html = html.replace(/\\\*/g, '*')
                   .replace(/\\\[/g, '[')
                   .replace(/\\\]/g, ']')
                   .replace(/\\\_/g, '_')
                   .replace(/\\\(/g, '(')
                   .replace(/\\\)/g, ')')
                   .replace(/\\\-/g, '-');

        if (shouldWrap) {
            html += '</div>';
        }

        return html;
    };

    Villain.setOptions = function setOptions(options) {
        if (_.isUndefined(options.imageSeries) || _.isUndefined(options.baseURL)) {
            console.error("Villain: baseURL and imageSeries MUST be set on initialization.");
        }
        Villain.defaults.browseURL = options.baseURL + Villain.defaults.browseURL + options.imageSeries;
        Villain.defaults.uploadURL = options.baseURL + Villain.defaults.uploadURL + options.imageSeries;
        Villain.defaults.imageseriesURL = options.baseURL + Villain.defaults.imageseriesURL;
        Villain.options = $.extend({}, Villain.defaults, options);
    };

    Villain.browser = function browser() {
        var browser = {};

        if (this.getIEversion() > 0) {
            browser.msie = true;
        } else {
            var ua = navigator.userAgent.toLowerCase(),
            match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
                    /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                    /(msie) ([\w.]+)/.exec(ua) ||
                    ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
                    [],

            matched = {
                browser: match[1] || '',
                version: match[2] || '0'
            };

            if (match[1]) {
                browser[matched.browser] = true;
            }
            if (parseInt(matched.version, 10) < 9 && browser.msie) {
                browser.oldMsie = true;
            }

            // Chrome is Webkit, but Webkit is also Safari.
            if (browser.chrome) {
                browser.webkit = true;
            } else if (browser.webkit) {
                browser.safari = true;
            }
        }
        return browser;
    };

    Villain.Editor.processPaste = function processPaste(pastedFrag) {
        var cleanHtml;
        if (pastedFrag.match(/(class=\"?Mso|style=\"[^\"]*\bmso\-|w:WordDocument)/gi)) {
            cleanHtml = Villain.Editor.wordClean(pastedFrag);
            cleanHtml = Villain.Editor.clean($('<div>').append(cleanHtml).html(), false, true);
            cleanHtml = Villain.Editor.removeEmptyTags(cleanHtml);
        } else {
            // Paste.
            cleanHtml = Villain.Editor.clean(pastedFrag, false, true);
            cleanHtml = Villain.Editor.removeEmptyTags(cleanHtml);
        }

        cleanHtml = Villain.Editor.plainPasteClean(cleanHtml);

        // Check if there is anything to clean.
        if (cleanHtml !== '') {
            // Insert HTML.
            return cleanHtml;
        }
    };

    Villain.Editor.wordClean = function wordClean(html) {
        // Keep only body.
        if (html.indexOf('<body') >= 0) {
            html = html.replace(/[.\s\S\w\W<>]*<body[^>]*>([.\s\S\w\W<>]*)<\/body>[.\s\S\w\W<>]*/g, '$1');
        }

        // Single item list.
        html = html.replace(
            /<p(.*?)class="?'?MsoListParagraph"?'?([\s\S]*?)>([\s\S]*?)<\/p>/gi,
            '<ul><li><p>$3</p></li></ul>'
        );

        // List start.
        html = html.replace(
            /<p(.*?)class="?'?MsoListParagraphCxSpFirst"?'?([\s\S]*?)>([\s\S]*?)<\/p>/gi,
            '<ul><li><p>$3</p></li>'
        );

        // List middle.
        html = html.replace(
            /<p(.*?)class="?'?MsoListParagraphCxSpMiddle"?'?([\s\S]*?)>([\s\S]*?)<\/p>/gi,
            '<li><p>$3</p></li>'
        );

        // List end.
        html = html.replace(/<p(.*?)class="?'?MsoListParagraphCxSpLast"?'?([\s\S]*?)>([\s\S]*?)<\/p>/gi,
                '<li><p>$3</p></li></ul>');

        // Clean list bullets.
        html = html.replace(/<span([^<]*?)style="?'?mso-list:Ignore"?'?([\s\S]*?)>([\s\S]*?)<span/gi, '<span><span');

        // Webkit clean list bullets.
        html = html.replace(/<!--\[if \!supportLists\]-->([\s\S]*?)<!--\[endif\]-->/gi, '');

        // Remove mso classes.
        html = html.replace(/(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/gi, ' ');

        // Remove comments.
        html = html.replace(/<!--[\s\S]*?-->/gi, '');

        // Remove tags but keep content.
        html = html.replace(/<(\/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>/gi, '');

        // Remove no needed tags.
        var word_tags = ['style', 'script', 'applet', 'embed', 'noframes', 'noscript'];
        for (var i = 0; i < word_tags.length; i++) {
            var regex = new RegExp('<' + word_tags[i] + '.*?' + word_tags[i] + '(.*?)>', 'gi');
            html = html.replace(regex, '');
        }

        // Remove attributes.
        html = html.replace(/([\w\-]*)=("[^<>"]*"|'[^<>']*'|\w+)/gi, '');

        // Remove spaces.
        html = html.replace(/&nbsp;/gi, '');

        // Remove empty tags.
        var oldHTML;
        do {
            oldHTML = html;
            html = html.replace(/<[^\/>][^>]*><\/[^>]+>/gi, '');
        } while (html != oldHTML);

        html = Villain.Editor.clean(html);

        return html;
    };

    Villain.Editor.clean = function clean(html, allow_id, clean_style, allowed_tags, allowed_attrs) {
        // List of allowed attributes.
        allowed_attrs = [
            'accept', 'accept-charset', 'accesskey', 'action', 'align',
            'alt', 'async', 'autocomplete', 'autofocus', 'autoplay',
            'autosave', 'background', 'bgcolor', 'border', 'charset',
            'cellpadding', 'cellspacing', 'checked', 'cite', 'class',
            'color', 'cols', 'colspan', 'contenteditable', 'contextmenu',
            'controls', 'coords', 'data', 'data-.*', 'datetime',
            'default', 'defer', 'dir', 'dirname', 'disabled',
            'download', 'draggable', 'dropzone', 'enctype', 'for',
            'form', 'formaction', 'headers', 'height', 'hidden', 'high',
            'href', 'hreflang', 'icon', 'id', 'ismap', 'itemprop',
            'keytype', 'kind', 'label', 'lang', 'language', 'list',
            'loop', 'low', 'max', 'maxlength', 'media', 'method',
            'min', 'multiple', 'name', 'novalidate', 'open', 'optimum',
            'pattern', 'ping', 'placeholder', 'poster', 'preload',
            'pubdate', 'radiogroup', 'readonly', 'rel', 'required',
            'reversed', 'rows', 'rowspan', 'sandbox', 'scope', 'scoped',
            'scrolling', 'seamless', 'selected', 'shape', 'size', 'sizes',
            'span', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step',
            'summary', 'spellcheck', 'style', 'tabindex', 'target', 'title',
            'type', 'translate', 'usemap', 'value', 'valign', 'width', 'wrap'
        ];
        allowed_tags = [
            '!--', 'a', 'abbr', 'address', 'area', 'article', 'aside',
            'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'br',
            'button', 'canvas', 'caption', 'cite', 'code', 'col',
            'colgroup', 'datalist', 'dd', 'del', 'details', 'dfn',
            'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset',
            'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
            'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i',
            'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label',
            'legend', 'li', 'link', 'main', 'map', 'mark', 'menu',
            'menuitem', 'meter', 'nav', 'noscript', 'object', 'ol',
            'optgroup', 'option', 'output', 'p', 'param', 'pre',
            'progress', 'queue', 'rp', 'rt', 'ruby', 's', 'samp',
            'script', 'section', 'select', 'small', 'source',
            'span', 'strong', 'style', 'sub', 'summary', 'sup',
            'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
            'thead', 'time', 'title', 'tr', 'track', 'u', 'ul',
            'var', 'video', 'wbr'
        ];

        // Remove script tag.
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove all tags not in allowed tags.
        var at_reg = new RegExp('<\\/?((?!(?:' + allowed_tags.join('|') + '))\\w+)[^>]*?>', 'gi');
        html = html.replace(at_reg, '');

        // Remove all attributes not in allowed attrs.
        var aa_reg = new RegExp(
            '( (?!(?:' + allowed_attrs.join('|') +
            '))[a-zA-Z0-9-_]+)=((?:.(?!\\s+(?:\\S+)=|[>]|(\\/>)))+.)', 'gi'
        );
        html = html.replace(aa_reg, '');

        // Clean style.
        var style_reg = new RegExp(
            'style=("[a-zA-Z0-9:;\\.\\s\\(\\)\\-\\,!\\/\'%]*"|' +
            '\'[a-zA-Z0-9:;\\.\\s\\(\\)\\-\\,!\\/"%]*\')', 'gi'
        );
        html = html.replace(style_reg, '');

        // Remove the class.
        var $div = $('<div>').append(html);
        $div.find('[class]:not([class^="fr-"])').each(function(index, el) {
            $(el).removeAttr('class');
        });

        html = $div.html();

        return html;
    };

    Villain.Editor.plainPasteClean = function plainPasteClean(html) {
        var $div = $('<div>').html(html);

        $div.find('h1, h2, h3, h4, h5, h6, pre, blockquote').each(function(i, el) {
            $(el).replaceWith('<p>' + $(el).html() + '</p>');
        });

        var replacePlain = function(i, el) {
            $(el).replaceWith($(el).html());
        };

        while ($div.find('strong, em, strike, b, u, i, sup, sub, span, a').length) {
            $div.find('strong, em, strike, b, u, i, sup, sub, span, a').each (replacePlain);
        }

        return $div.html();
    };

    Villain.Editor.removeEmptyTags = function removeEmptyTags(html) {
        var i,
            $div = $('<div>').html(html),
            empty_tags = $div.find('*:empty:not(br, img, td, th)');

        while (empty_tags.length) {
            for (i = 0; i < empty_tags.length; i++) {
                $(empty_tags[i]).remove();
            }

            empty_tags = $div.find('*:empty:not(br, img, td, th)');
        }

        // Workaround for Notepad paste.
        $div.find('> div').each(function(i, div) {
            $(div).replaceWith($(div).html() + '<br/>');
        });

        // Remove divs.
        var divs = $div.find('div');
        while (divs.length) {
            for (i = 0; i < divs.length; i++) {
                var $el = $(divs[i]),
                    text = $el.html().replace(/\u0009/gi, '').trim();

                $el.replaceWith(text);
            }

            divs = $div.find('div');
        }

        return $div.html();
    };

    Villain.Editor.pasteHtmlAtCaret = function pasteHtmlAtCaret(html) {
        var sel, range;
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = document.createElement('div');
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while (node = el.firstChild) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if (document.selection && document.selection.type != 'Control') {
            // IE < 9
            document.selection.createRange().pasteHTML(html);
        }
    };

    /* Block Registry */
    
    Villain.BlockRegistry = {};
    
    Villain.BlockRegistry.initialize = function (extraBlocks) {
        // add defaults
        Villain.BlockRegistry.Map = [
            "Text",
            "Header",
            "Blockquote",
            "List",
            "Image",
            "Slideshow",
            "Video",
            "Divider",
            "Columns",
        ];
        if (!_.isUndefined(extraBlocks)) {
            Villain.BlockRegistry.addExtraBlocks(extraBlocks);
        }
        Villain.BlockRegistry.checkBlocks();
    };
    
    Villain.BlockRegistry.addExtraBlocks = function(extraBlocks) {
        Villain.BlockRegistry.Map = Villain.BlockRegistry.Map.concat(extraBlocks);
    };
    
    Villain.BlockRegistry.add = function(block) {
        Villain.BlockRegistry.Map.push(block);
    };
    
    Villain.BlockRegistry.checkBlocks = function() {
        for (i = 0; i < Villain.BlockRegistry.Map.length; ++i) {
            type = Villain.BlockRegistry.Map[i];
            if (_.isUndefined(Villain.Blocks[_(type).capitalize()])) {
                console.error("Villain: Missing block source for " + type + "! Please ensure it is included.");
            }
        }
    };
    
    Villain.BlockRegistry.getBlockClassByType = function(type) {
        if (Villain.BlockRegistry.Map.indexOf(_(type).capitalize()) !== -1) {
            return Villain.Blocks[_(type).capitalize()];
        }
        return false;
    };

}(jQuery, _));