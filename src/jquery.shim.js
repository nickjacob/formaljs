//
// These are utility functions put on a fictional '$' object to be used 
// throughout the rest of the program in place of jQuery; if jQuery is used, 
// we use the jQuery functions...so you can remove this
//
// while this uses a *similar* API to jQuery --in that everything will work the same for the common case
// jQuery handles a lot of edge cases and extra functionality not supported here.
//
// @author - nickjacob

(function formal_jquery_shim(window, undefined) {

  var slice = Array.prototype.slice,
      toString = Object.prototype.toString,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      ARRAY_STRING = '[object Array]',
      FUNCTION_STRING = '[object Function]',
      OBJECT_STRING = '[object Object]';

  // define this as global and back-link it to everything else
  // super-simple. No selection supported. Nothing rly supported.
  var _jq_instances = {};
  var jq_shim = window.$ = window.$ || window.jQuery || function ( el ) {

    if (window === this) {
      return new jq_shim(el);
    } else {

      this.el = el;
      return this;

    }

  };

  // simple helper to make sure we don't overwrite jQuery functions
  // this is in case someone forgets to *not* include this when they use jQuery!
  function $_define(name, fn, _static){

    if (jq_shim[name] && typeof jq_shim[name] === 'function') return;
    if (_static) {
      jq_shim[name] = fn;
    } else {
      jq_shim.prototype[name] = fn;
    }

  }

  $_define('isArray', function (obj) {
    return (toString.call(obj) === ARRAY_STRING);
  }, true);

  $_define('isFunction', function (obj) {
    return (toString.call(obj) === FUNCTION_STRING);
  }, true);

  $_define('isPlainObject', function (obj) {
    return (toString.call(obj) === OBJECT_STRING);
  }, true);

  $_define('isNumeric', function (obj) {
    return !isNan(parseFloat(obj)) && isFinite(obj);
  }, true);

  // An instant classic. Uses a closure so you
  // get the nice effect of having stuff work
  $_define('each', function(collection, cb, ctx) {
    var out = {}, i = 0, len = collection.length;
    ctx = ctx || collection;

    if (!collection || collection.length === 0) return {};
    if (collection.forEach){

      collection.forEach(function(val,index){
        out[index] = cb.call(ctx, val, index); 
      }, ctx);
      return out;

    }

    function _callCB(index, val) {
      return out[index] = cb.call(ctx, index, val);
    }

    if (len) {
      for (; i < len; i++) {
        if (_callCB(i,collection[i]) === false)
          return out;
      }
    } else {
      for(var k in collection) {
        if (hasOwnProperty.call(collection,k)) {
          if (_callCB(k, collection[k]) === false)
            return out;
        }
      }
    }

    return out;
  }, true);

  // Lol...
  $_define('map', function(collection, cb, ctx) {
    if (!collection) return;
    if (collection.map) return collection.map(cb, ctx);

    var out = [];
    jq_shim.each(collection, function(index, val) {
      out = cb.call((ctx || null), val, index, collection);
    });

    return out;
  }, true);

  $_define('extend', function(dest, src) {
    if (!(src && dest)) return dest;

    $.each(src, function(k,v) {
      if (hasOwnProperty.call(src,k)) {
        dest[k] = src[k];
      }
    });

    return dest;
  }, true);

  $_define('noop', function(){
    return arguments;
  }, true);

  $_define('proxy', function(fn,ctx) {
    if(jq_shim.isFunction(fn)) {
      return function(){ fn.apply(ctx || null, arguments); };
    }
  }, true);

  $_define('inArray', function(value, array) {
    if (array.indexOf !== undefined) return array.indexOf(value);
    var i = 0, l = array.length;
    for (; i < l; i++) {
      if (array[i] === value) return i;
    }

    return -1;
  }, true);

  $_define('trim', function(str) {
    var i = 0, l = str.length;
    str = str.replace(/^\s+/, '');
    for(; i < l; i++){
      if (/\s+/.test(str.charAt(i))) {
        str = str.substring(0,i);
        break;
      }
    }
    return str;
  }, true);


  // === 
  // More DOM related stuff here
  // ===

  // helper functions
  var _classCache = {};
  function classRegex(className) {
    return _classCache[className] || (_classCache[className] = new RegExp("\\s+" + className));
  }

  $_define('addClass', function (className, el) {
    var _el = this.el || el;
    if (!_el) return this;

    if (!classRegex(className).test(_el.className)) {
      _el.className += ' ' + className;
    }

    return this;
  });

  $_define('removeClass', function (className, el) {
    var _el = this.el || el;

    if (!_el) return this;

    _el.className = _el.className.replace(classRegex(className), '');
    return this;
  });

  $_define('toggleClass', function (className, el) {
    var _el = this.el || el, regx = classRegex(className);

    if (!_el) return this;

    if (!regx.test(_el.className)) {
      _el.className += ' ' + className;
    } else {
      _el.className = _el.className.replace(regx, '');
    }

    return this;
  });

  $_define('hasClass', function (className, el) {
    var _el = this.el || el;
    if (!_el) return this;
    return classRegex(className).test(_el.className);
  });

  // serialize a form..but only a form
  $_define('serialize', function() {

    if (!toString.call(this.el)=== '[object HTMLFormElement]') return;

    var elems = this.el.elements, i = 0, l = elems.length, out = '?';

    for (; i < l; i++) {
      out += encodeURIComponent(elems[i].name || elems[i].getAttribute('name')) + '=';
      out += encodeURIComponent(elems[i].value);
      out += (i<(l-1)) ? '&' : '';
    }

    return out;

  });

  // it's a jQuery *inside* formal, so in the formal
  // closure we're going to open this up into our scope
  jq_shim.isShim = true;
  window.jq_shim = jq_shim;

}(window));
