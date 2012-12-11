// ==================================================================================
// Core
// these are helper functions for use throughout,
// but aren't included in /jquery.shim because the
// aren't in jQuery!
// ==================================================================================

var hasOwnProperty = {}.hasOwnProperty,
    toString = {}.toString,
    slice = [].slice,
    formal = formal || {},
    util = formal.util = formal.util || {};

// don't use these in here, but open them up for later
util.toString = toString; util.slice = slice; util.hasOwnProperty = hasOwnProperty;

util.camelToSentance = function (str) {
  if (str) {
    return str.replace(/([A-Z])/g,' $1').replace(/^./,function(s){ return s.toUpperCase(); });
  }
};

util.keys = function(obj) {
  if (!obj) return;
  if (obj.prototype.keys) return obj.keys();

  var out = [], k;

  for(k in obj) {
    if (hasOwnProperty.call(obj,k))
      out.push(k);
  }

  return out;
};

util.values = function(obj) {
  if (!obj) return;
  if (obj.prototype.values) return obj.values();

  var out = [], k;
  for (k in obj){
    if (hasOwnProperty.call(obj))
      out.push(obj[k]);
  }

  return out;
};


util.absolutePosition = function(el) {
  var x = 0, y = 0;

  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      x += el.offsetLeft - el.scrollLeft;
      y += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
  }
  return { x: x, y: y };
};


// a series of tests
// to be conducted on the form element
util.testFormEl = function(el) {

  if (!el) {
    throw "Form element is undefined.";
  } else if (toString.call(el) !== '[object HTMLFormElement]') {
    throw "Element must be an HTMLFormElement";
  } else if (!el.elements || !el.elements.length) {
    throw "Form must contain fields.";
  }

};

util.customEvent = function(name, payload) {
  var evt;
  if (window.CustomEvent){
    evt = new CustomEvent(name);
  } else {
    evt = document.createEvent(name);
    //evt.data = payload;
  }

  evt.initCustomEvent(name, true, true, payload);
  return evt;

};

var _Formal = {};
util.inherits = function(parent, child) {

  _Formal[child] = _Formal[child] || function(){};

  _Formal[child].prototype = parent.prototype;
  child.prototype = new _Formal[child];

  child.prototype.constructor = child;
  child.prototype.parent = parent.prototype;

  return child;
};

// x-browser compatibility for __defineGetter/setter
util.defineProperty = function(obj, name, opt)  {

  if (Object.defineProperty) {
    return Object.defineProperty(obj, name, opt);
  } else {

    (function(o, na, prop) {

      if (prop.get && prop.__defineGetter__) {
        o.__defineGetter__(na, prop.get);
      }

      if (prop.set && o.__defineSetter__) {
        o.__defineSetter__(na, prop.set);
      }

      if (prop.value) {
        o[na] = prop.value;
      }


    }(obj, name, opt));

  }

};

// listen for specific keys
// closurs are the coolest thing ever
util.keysListener = function(el, evt, keys, cb) {

  function forArr(kc, e) {
    if (~$.inArray(keys, kc)) cb.call(e.target, e, keyCode);
  }

  function forNum(kc, e){
    if (kc === keys) cb.call(e.target, e, keyCode);
  }

  var call = ($.isArray(keys)) ? forArr : forNum;

  el.addEventListener(evt, function(e) {
    call((e.which || e.keyCode), e);
  }, false);

};

util.find = function(el, match, deep) {

  deep = (deep === undefined) ? false : deep;
  var out = [];

  function sib_search(par) {
    if (!par) return;

    var sibs = par.children,
        l = sibs.length,
        i = 0;

    if (!sibs || !sibs.length) return;

    for(; i < l; i++) {

      if (sibs[i]) {
        if (deep) sib_search(sibs[i]);
        if (match(sibs[i])) {
          out.push(sibs[i]);
        }
      }

    }

  }

  // begin the search
  sib_search(el);
  return out;

};


var _templR = /\[\[\s*([\w_0-9\$]*)\s*\]\]/ig;
util.templ = function(tpl, def) {
  def = def || {};
  return function(data) {
    return tpl.replace(_templR, function(all, variable) {
      if (def[variable] !== undefined) return def[variable];
      return (data[variable] !== undefined) ? data[variable] : '';
    });

  }
}
