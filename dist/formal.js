//------------------------------------------------------
// Formal - v0.0.1 @ 11-12-12
// Copyright (c) 2012 Nick Jacob;
//------------------------------------------------------
;(function __formal__(window,undefined){
"use strict";
var __VERSION__ = __VERSION__ || "0.0.1";
$ = window.$ || window.jQuery || window.jq_shim;

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

//
// Formal Timeline
//  this is the controller code for the "timeline" feature
//


// UI Element 'class' that stuff from should inherit from
// creates this notion of having a prefix & module to template with
function FormalUIObject(el, module) {
  this.instances++;
  this.module = 'formal-' + module + '-';
  this.el = el;
  this._dom = {}; // each instance needs its own dom.. duh

  this.prefix = this.module + this.instances + this.PREFIX_DELIM;
  this.processTemplates();

};

FormalUIObject.prototype = {
  // class variables
  PREFIX_DELIM: '__',
  instances: 0,

  // reverse lookup
  getElName: function(id) {
    var name = id.split(this.PREFIX_DELIM);
    if (name.length === 2) {
      return name[1];
    }

    return null;

  },
  getEl: function(id) {

    if ((id = this.getElName(id))) {
      return this.dom(id);
    }

  },

  getId: function(elName) {
    return this.prefix + elName;
  },

  getById: function(elName) {
    return window.document.getElementById(this.getId(elName));
  },

  append: function(html) {
    var frag;

    if (!html) return;

    if (typeof html === 'string') {
      frag = document.createDocumentFragment();
      frag.innerHTML += html;

    } else  {
      frag = html;
    }

    this.el.appendChild(frag);



  },

  fire: function(name, payload) {
    return this.el.dispatchEvent(util.customEvent(name, payload));
  },

  templ: function(tpl) {
    return util.templ(tpl, { prefix: this.prefix, module: this.module });
  },

  processTemplates: function() {

    for(var k in this.templates) {
      if (typeof this.templates[k] !== 'function' ) {
        this.templates[k] = this.templ(this.templates[k]);
      }
    }

  },


  // find an element in it's own dom and 
  // caches the node in ._dom
  // loose comparison is if it's null at one point you can get it later
  // returns it if it found it
  dom: function(elName) {
    if (this._dom[elName] != null) return this._dom[elName];
    return (this._dom[elName] = this.getById(elName));
  },

  // nice :)
  on : function(evt, cb) {
    this.el.addEventListener(evt, $.proxy(cb, this), false);
  }


};




//================================================================================
// Class Timeline < FormalUIObject
// @param:
//  el - the element to be appended to
//  form - must be our Formal (need the b
//================================================================================
util.inherits(FormalUIObject, Timeline);
function Timeline(el, form) {
  FormalUIObject.call(this, el, 'timeline');
  this.ACTIVE_CLASS = this.module + 'active';

  var self = this;


  if (!el || !form) {
    throw 'element and form required';
  }

  this.form = form;
  this.elems = {};



  this.current = {
    el: null,
    name: ''
  };

  this.elemsArray = [];
  this.elemIndexes = {}; // "reverse" map of name => index in this.elemsArray

  this.rendered = {};

  var c = 0;
  $.map(form.elements, function(val, i) {

    val.name = val.name || val.id || val.type;

    if (val && !self.elems[val.name] && val.type !== 'submit' ){

      if (val.hasAttribute('hidden')) {
        var tmp = val;
        val = val.parentNode;
        val.setAttribute('name', tmp.name);
        val.name = tmp.name;
        val.type = tmp.type;
      }

      self.elems[val.name] = val;
      self.elemIndexes[val.name] = c;
      self.elemsArray[c] = val;

      c++; // lol
    } else if (val.type === 'submit' ) {
      self.submitButton = val;
    }

  });

  this.stats = {
    total: self.elemsArray.length,
    complete: 0,
    completed: false
  };

  window.document.addEventListener('focusin', $.proxy(this.focusListener, this), false);
  this.on(WRAPPER_CONSTANTS.CHANGE_EVT, this.changeListener);
  this.on('submit', this.submitListener);
  this.on('click', this.clickListener);
  this.on('keyup', function(e) {
    var k = e.which || e.keyCode;

    if (k === WRAPPER_CONSTANTS.LEFT_KEY) {
      this.prev(e);
    } else if (k === WRAPPER_CONSTANTS.RIGHT_KEY) {
      this.next(e);
    } else if (e.ctrlKey && e.shiftKey && e === 191) {
      this.modal(e);
    } else if (self.rendered[e.target.name] !== undefined) {
      self.rendered[e.target.name].style.width = ( e.target.offsetWidth + (e.target.value || e.target.getAttribute('value')).length*self.LENGTH_MUL) + 'px';
    }

  });

  this.render();
  this.select(this.rendered[0]);
  this.elemsArray[0].focus();

}

$.extend(Timeline.prototype, {

  BASE_WIDTH: 100,
  LENGTH_MUL: 10,
  templates: {
    element: "<li class='[[module]][[type]]' type='[[type]]' name='[[name]]' id='[[prefix]][[name]]'>[[displayName]]</li>",
    list: "<ul class='[[module]]list' id='[[prefix]]list'>[[inner]]</ul>",
    container: "<div class='[[module]]timeline' id='[[prefix]]container'><div class='[[module]]timeline-inner' id='[[prefix]]inner'>"
                + "<div class='[[module]]closebtn' id='[[prefix]]closebtn'>hide</div>"
                + "[[inner]]</div>[[controls]]</div>",
    controls: "<div class='[[module]]controls id='[[prefix]]controls'>"
                        + "<div class='btngrp reset' id='[[prefix]]reset'><a id='[[prefix]]reset'>reset</a></div>"
                        + "<div class='btngrp dir' ><a class='prev' id='[[prefix]]prev'></a><a class='next' id='[[prefix]]next'></a></div>"
                        + "<div class='[[module]]progressbar' id='[[prefix]]progressbar-outer'><div class='[[module]]progress-inner' id='[[prefix]]progress-inner'></div>"
                        + "<span id='[[prefix]]progressbar-label'></span></div>"
                        + "<div class='btngrp submit' id='[[prefix]]submit'><a id='[[prefix]]submit'>submit</a></div>",
    modal: "<div class='[[module]]modal' id='[[prefix]]modal'><div class='[[module]]modal-inner' id='[[prefix]]modal-inner'></div></div>"

  },


  dispatchTable: {
    'reset' : 'reset',
    'prev' : 'prev',
    'next' : 'next',
    'closebtn' : 'closeview',
    'submit' : 'submitForm'
  },

  render: function() {
    var inner = '', name;

    for(name in this.elems) {
      var type = /select/i.test(this.elems[name].tagName) ? 'select' : /textarea/i.test(this.elems[name].tagName) ? 'textarea' : this.elems[name].type;
      inner += this.templates.element({ type: type, name: name, displayName: util.camelToSentance(name) });
    }

    var el = document.createElement('div'), modal = document.createElement('div');
    el.id = 'outer-container'; el.innerHTML = this.templates.container({ inner: this.templates.list( { inner: inner }), controls: this.templates.controls() });
    modal.innerHTML = this.templates.modal();

    this.append(el);
    this.append(modal);

    // still useful
    var i = 0;
    for(name in this.elems) {
      this.rendered[i]= this.rendered[name] = this.getById(name);
      this.rendered[i].setAttribute('state', WRAPPER_CONSTANTS.STATES.INCOMPLETE);
      //this.rendered[i].style.width = this.BASE_WIDTH + 'px';
      i++;
    }

  },

  dispatch: function(target) {
    var method = this.getElName(target.id);

    if (method) {
      (this[this.dispatchTable[method]] || $.noop).call(this, target);
    }

    return method || target.getAttribute('name') || target.getAttribute('value');

  },

  select: function(el) {
    var name = el.name || el.getAttribute('name');

    if (!el){ return console.log('Warning: attempting trying to select invalid element'); }
    
    $(this.current.el).removeClass(this.ACTIVE_CLASS, this.current.el);

    this.current.el = el;
    this.current.name = name;
    this.current.index = this.elemIndexes[name];

    $(el).addClass(this.ACTIVE_CLASS, el);

  },

  // triggered when an input changes
  // just use this information to update the classes in the dom
  // & the progress bar
  changeListener : function(evt) {
    if (util.toString.call(evt) === '[object CustomEvent]' && evt.detail) {
      var data = evt.detail,
          el = this.rendered[data.name],
          currState = el.getAttribute('state');


      // update the progress data
      if (currState && currState !== data.state) {

        if (currState === WRAPPER_CONSTANTS.STATES.INCOMPLETE && data.state !== WRAPPER_CONSTANTS.STATES.VALID) {

        } else if (data.state === WRAPPER_CONSTANTS.STATES.INVALID) {
          this.completed(-1);
        } else if (data.state === WRAPPER_CONSTANTS.STATES.INCOMPLETE &&
                   currState === WRAPPER_CONSTANTS.STATES.VALID) {
          this.completed(-1);
        } else if (data.state === WRAPPER_CONSTANTS.STATES.VALID) {
          this.completed(1);
        }

      }

      // CSS should act on attributes (I know... not super fast)
      el.setAttribute('valid', data.valid);
      el.setAttribute('state', data.state);
      //el.setAttribute('input-value', data.value); // unecessary

    }
  },

  // when an element gains focus,
  // set it as the current element
  focusListener: function(evt) {
    var name = evt.target.name, el;

    if ((el = this.rendered[name])) {
      this.select(el);
    }

  },

  clickListener : function(evt) {
    var name = this.dispatch(evt.target);

    console.log(name);
    if (name && this.elems[name]) {

      this.elems[name].focus();

    }

  },

  submitListener: function(evt) {

    if (!this.stats.completed) {
      evt.preventDefault();
      evt.stopPropagation();
    }

  },

  // called when we change the state
  // of a field to valid (decremented when invalid)
  // would let us have a progressbar or a 'complete' state
  completed: function(direction) {

    this.stats.complete += direction;
    console.log(this.stats.complete);

    if (this.stats.complete === this.stats.total) {

      console.log('done');
      this.stats.completed = true;
      this.submitButton.removeAttribute('disabled');

    } else {
      this.stats.completed = false;
      this.submitButton.setAttribute('disabled',true);
    }

    this.dom('progress-inner').style.width = ((this.stats.complete / this.stats.total)*100) + '%';
    this.dom('progressbar-label').innerHTML = this.stats.complete + '/' + this.stats.total + ' complete';
  },

  // resets the form
  reset: function(event, target) {
    this.form.reset();
    this.elemsArray[0].focus(); // so the inspector moves there

    this.stats.complete = 0;
    this.stats.completed = false;

    // let other people know
    this.fire('form-reset', { form: this.form });
  },

  move: function(direction) {
    var toMove = this.current.index + direction;

    if (toMove >= 0 && toMove < this.elemsArray.length) {

      var el = this.elemsArray[toMove];

      el.focus(direction);

      this.select(this.rendered[el.getAttribute('name')]);

      return el;
    }

  },

  prev: function(event, target) {
    this.move(-1);
  },

  next: function(event, target) {
    this.move(+1);
  },

  closeview : function(e) {
    var height;
    if ((height = e.getAttribute('oldheight'))) {
      this.dom('inner').style.height = height;
      e.innerHTML = 'hide';
      e.removeAttribute('oldheight');
    } else {
      e.setAttribute('oldheight', (this.dom('inner').style.height || this.dom('inner').offsetHeight + 'px'));
      e.innerHTML = 'show';
      this.dom('inner').style.height = '35px';
    }

  },


  submitForm: function(event, target) {

    this.form.submit();

  }

});



//
// Wrappers
//  split this off of DOM
//  these are classes that wrap various input elements
//  -- the main/highest level is InputWrapper
//
var WRAPPER_CONSTANTS = {
  SELECT_CLASS : 'formal-selected',
  ACTIVE_CLASS : 'formal-active',
  HIDDEN_CLASS : 'formal-hidden-support',
  INPUT_ELS : /input|select|textarea/i,
  CHANGE_EVT : 'input-change',
  SELECTABLE_ELEM : 'a',
  VALUE_DELIM  : ',',
  PREFIX_DELIM : '___',
  LEFT_KEY: 37,
  RIGHT_KEY: 39,
  ENTER_KEY: 13,
  LEFT: -1,
  RIGHT: 1,
  STATES: {
    INCOMPLETE : 'incomplete',
    VALID: 'valid',
    INVALID: 'invalid'
  }
};

// helper function
function createHiddenInput(name, inputs) {
  var el = document.createElement('input');
  el.type = 'text'; // el.style.display = 'none';
  el.name = name;
  el.setAttribute('name', name);
  el.setAttribute('hidden', true);
  el.className = WRAPPER_CONSTANTS.HIDDEN_CLASS;
  el.id = inputs[0].value;

  var value = $.map(inputs, function(val, index) {
    if (val.checked || val.getAttribute('checked')) {
      return val.value;
    }
  });

  el.value = value.join(',');
  inputs[0].parentNode.appendChild(el);
  return el;

}

// ================================================================================
// Factory
//  'wraps' an individual field element so you don't have to worry about it.
// ================================================================================
function WrapperFactory() {
  this.wrapped = {};
}

WrapperFactory.prototype = {

  cnst: {
    ATTR: 'type',
    TAG: 'div'
  },

  wrappers: {
    'checkbox' : CheckboxWrapper,
    'radio' : RadioWrapper,
    '_' : GenericWrapper
  },


  check: function(el, name) {
    return (el && !this.wrapped[name] && el.tagName === this.cnst.TAG && el.hasAttribute(this.cnst.ATTR))
  },

  // search the wrap for its input 
  // to determine the type we want to use
  wrap: function(el) {

    var html = el.innerHTML,
        type = /checkbox/i.test(html) ? 'checkbox' : (/radio/i.test(html) ? 'radio' : '_');

    return this.wrappers[this.wrappers.length] = new this.wrappers[type](el);

  }


};


// ================================================================================
// Class InputWrapper
//  the highest-level superclass. Doesn't do a whole lot,
//  but provides a common interface
//
//  @param:
//    dom - root DOM element of the input
//    label - an associated <label>
//    input - the actual html input
// ================================================================================
util.inherits(FormalUIObject, InputWrapper);
function InputWrapper(dom, label, input, opt) {

  this.label = label;

  this.el = dom;

  $.each(this.el.children, function(i, val) {
  });

  this.input = input;
  this.type = this.input.type;
  this.name = this.input.name || this.input.getAttribute('name');

  if ($.isPlainObject(opt) && opt.validation) {
    this.validation = $.proxy(opt.validation, this);
  } else {
    this.validation = function(val){ return !!val.length };
  }


  util.defineProperty(this, '_value', {
    get: function() {
      return this.input.value;
    },
    set: function(val) {
      this.input.value = $.isArray(val) ? val.join(this.cnst.VALUE_DELIM) : val;
    },
    enumerable: true,
    configurable: true, // subclasses can set it
  });

  var self = this;
  this.el.addEventListener('keyup', function(e) {

    var key = e.which || e.keyCode;

    if (key !== WRAPPER_CONSTANTS.LEFT_KEY && key !== WRAPPER_CONSTANTS.RIGHT_KEY && key !== WRAPPER_CONSTANTS.ENTER_KEY) return;
    
    if (/radio|checkbox/i.test(self.type) || /select/i.test(self.input.tagName) || 

       self.input.selectionStart === 0 || self.input.selectionStart === self.input.value.length) {
      // nothing
    } else {

      self.keyEvent.call(self, e, key);
      e.stopPropagation();

    }

  }, false);

  this.el.addEventListener('change', function(e) {

    var target = e.target;
    if (target === self.input) {
      self.fireEvent(WRAPPER_CONSTANTS.CHANGE_EVT);
    }

  }, false);


}

$.extend(InputWrapper.prototype,{

  // you should have value too
  val: function(val) {
    if (val!==undefined) {
      this.input.value = val;
    }

    return this.input.value;
  },

  fireEvent: function(name, extend) {
    return this.el.dispatchEvent(util.customEvent(name, $.extend( new WrapperEvent(this.isValid(), this.fieldState(), this.input.value, this.name) , extend)));
  },



  // probably don't need to do anything
  moveout: function(direction) {
    //console.log('should be moving fields');
  },

  cnst: {
    SELECT_CLASS  :  WRAPPER_CONSTANTS.SELECT_CLASS,
    ACTIVE_CLASS  :  WRAPPER_CONSTANTS.ACTIVE_CLASS,
    SELECTABLE_ELEM  :  WRAPPER_CONSTANTS.SELECTABLE_ELEM,
    VALUE_DELIM  : WRAPPER_CONSTANTS.VALUE_DELIM
  },

  isValid: function() {
    return this.validation(this.input.value);
  },

  fieldState: function() {
    var state = '', field = this.input;
    console.log(field);

    if (!field.value || !field.value.length) {
      state = WRAPPER_CONSTANTS.STATES.INCOMPLETE;
    } else if (field.validity) {
      state = field.validity.valid ? WRAPPER_CONSTANTS.STATES.VALID : WRAPPER_CONSTANTS.STATES.INVALID;
    } else {
      state = WRAPPER_CONSTANTS.STATES.INVALID;
    }

    return state;
  },

  keyEvent: function(e, key) {
    e.preventDefault();
    e.stopPropagation();

  }


});

// ================================================================================
// Class WrapperEvent
//  just to make it consistent & E-Z
// ================================================================================
function WrapperEvent( valid, state, value, name ) {
  this.valid = valid;
  this.state = state;
  this.value = value;
  this.name = name;
};

// ductype our way through know it's the right thing
// @static
WrapperEvent.valid = function(obj) {
  return !(obj && obj.valid === undefined || obj.state === undefined || obj.value === undefined
      || obj.name === undefined);
};

// ================================================================================
// Class GenericWrapper < InputWrapper
//  this provides an constructor common to the other wrappers but
//  does not really exctend InputWrapper.
//
//  @param: el - whatever the containing element is
// ================================================================================
util.inherits(InputWrapper, GenericWrapper);
function GenericWrapper(el) {
  var qry = el.getAttribute('type') || el.getAttribute('tag'),
      label = el.getElementsByTagName('label')[0];

  var input = el.getElementsByTagName('input')[0] || el.getElementsByTagName('textarea')[0] || el.getElementsByTagName('select')[0];
  InputWrapper.call(this, el, label, input);


}

GenericWrapper.prototype.onfocus = function(e,direction) {
  direction = direction || e.direction;
  var len = this.input.value.length;

  if (direction === WRAPPER_CONSTANTS.LEFT) {
    this.input.setSelectionRange(len, len);
  } else {
    this.input.setSelectionRange(0,0);
  }

};


// ================================================================================
// Class SelectableWrapper < InputWrapper << FormalUIObject
//  this supports an element which has a finite number
//  of potential values (radio & checkbox types).
//
//  @param: el - whatever the containing element is
// ================================================================================
util.inherits(InputWrapper, SelectableWrapper);
function SelectableWrapper(el) {

  var self = this,
      qry = el.hasAttribute('data-selector-type') ? el.getAttribute('data-selector-type') : el.type,
      inputs = util.slice.call(el.getElementsByTagName('input')),
      label = util.slice.call(el.getElementsByTagName('label'));



  el.name = this.name || inputs[0].name;
  el.type = this.type || inputs[0].type;

  this.input = createHiddenInput(el.name, inputs);
  this.el = el;

  FormalUIObject.call(this, el, 'selectable');
  InputWrapper.call(this, el, label[0], this.input);

  
  // sad but real. going to create a new 'div' of a elements to 
  // hack around the DOM
  var i = 0, l = inputs.length, html = '';
  for(; i < l; i++) {
    html += this.templates.item({ name: inputs[i].name, value: inputs[i].getAttribute('value'), displayValue: util.camelToSentance(inputs[i].getAttribute('value')) });
  }


  var wrap = document.createElement('div');
  wrap.className = this.module + 'grp btngrp';
  wrap.innerHTML = html;
  wrap.id = this.prefix + this.name;

  this.el.appendChild(wrap);
  this.el.setAttribute('contenteditable', true);

  this.elements = {};
  this.count = 0;
  this.reverseElements = {};

  for(i = 0; i < l; i++) {
    this.elements[i] = this.getById(inputs[i].value);
    this.elements[i].setAttribute('contenteditable', false);
    this.reverseElements[this.elements[i].getAttribute('value')] = i;
    this.el.removeChild(inputs[i]);
  }

  this.count = i - 1;
  this.active = 0; // index into selectable


  this.el.addEventListener('focus', $.proxy(this.onfocus, this));
  this.el.addEventListener('click', function(e) {
    var index = self.reverseElements[e.target.getAttribute('value')];
    self.select.call(self, index);
  });

  this.el.addEventListener('keyup', function(e) {
    var key = e.which || e.keyCode;
    
    if (key === WRAPPER_CONSTANTS.LEFT_KEY || key === WRAPPER_CONSTANTS.RIGHT_KEY || key === WRAPPER_CONSTANTS.ENTER_KEY) {
      self.keyEvent.call(self, e, key);
    }

  }, false);
  // left & right; context will be the target

  this.activate(0);

}

SelectableWrapper.prototype.onfocus = function(evt,direction){
  this.activate(0);
}

SelectableWrapper.prototype.templates = {
  item : '<a class="[[module]]item" id="[[prefix]][[value]]" name="[[name]]" value="[[value]]">[[displayValue]]</a>',
  group : "<div class='[[module]]group' id='[[prefix]][[name]]' name='[[name]]'>[[inner]]</div>"

}

// @override
SelectableWrapper.prototype.keyEvent = function(e, key) {
  var direction = (key === WRAPPER_CONSTANTS.LEFT_KEY) ? WRAPPER_CONSTANTS.LEFT : (key === WRAPPER_CONSTANTS.RIGHT_KEY) ? WRAPPER_CONSTANTS.RIGHT : null;

  if (!direction) {

  } else {

    var sum = direction + this.active;
    if (sum < 0 || sum > this.count) return;

    this.activate(sum);

    e.preventDefault();
    e.stopPropagation();

    return;
  }

  if (key === WRAPPER_CONSTANTS.ENTER_KEY) {

    this.select(this.active);
    e.preventDefault();
    e.stopPropagation();

  }

}
// Activate
// @param: toActivate (index of option to set as active)
SelectableWrapper.prototype.activate = function(toActivate) {

  $(this.elements[this.active]).removeClass(WRAPPER_CONSTANTS.ACTIVE_CLASS);
  $(this.elements[(this.active = toActivate)]).addClass(WRAPPER_CONSTANTS.ACTIVE_CLASS);

};

// called whenever an element is clicked on in our range
SelectableWrapper.prototype.onselection = function(el, $el, isSelected) {
  this.selection = this.selection || [];

  if (!isSelected) {
    this.selection.push(el);
  } else {

    var i = 0 , l = this.selection.length;

    for(; i < l; i++) {
      if (this.selection[i] === el) {
        this.selection[i] = null;
      }
    }
  }

  console.log(this.updateValue());

};

// Update the value of the "input"
// helper this returns & sets the inner input's value
SelectableWrapper.prototype.updateValue = function() {
  var i = 0, l = this.selection.length, val = [];

  for (; i < l; i++) {
    if (this.selection[i] && this.selection[i].hasAttribute('value')) {
      val.push(this.selection[i].getAttribute('value'));
    }
  }
  this.fireEvent(WRAPPER_CONSTANTS.CHANGE_EVT, {});

  return this.input.value = val.join(WRAPPER_CONSTANTS.VALUE_DELIM);
};

// programatically 'select' an input
// @param: index of element (in selectable) to select, or the elem itself
// used in the event handler
SelectableWrapper.prototype.select = function (index) {

  index = (typeof index === 'object' ) ? (index.value || index.getAttribute('value')) : index;
  var el = this.elements[index], $el = $(el), isSelected = $el.hasClass(WRAPPER_CONSTANTS.SELECT_CLASS), i;

  $el.toggleClass(WRAPPER_CONSTANTS.SELECT_CLASS);
  this.onselection(el, $el, isSelected);
};





// ================================================================================
// Class CheckboxWrapper < SelectableWrapper
//  this is barely a subclass. Exists mostly to provide continuity.
//
//  @param: el - the <div> element
// ================================================================================
function CheckboxWrapper(el) {
  el.type = 'checkbox',
  this.selection = [];
  SelectableWrapper.call(this, el);
}

util.inherits(SelectableWrapper, CheckboxWrapper);


// ================================================================================
// Class RadioWrapper < SelectableWrapper
//  the user will have already marked up his radio so it's actually
//  a collection of buttons (he doesn't need to have an associated input)
//  and should be passing us the wrapping div (with a name attr). Need to gather up the children
//  of the div to use for inputs.
//
//  @param: el - top-level div
// ================================================================================
function RadioWrapper(el) {

  el.type = 'radio';
  this.selection = [];
  SelectableWrapper.call(this, el);

}

util.inherits(SelectableWrapper, RadioWrapper);

// @override
RadioWrapper.prototype.onselection = function(el, $el, isSelected) {
  $(this.selection[0]).removeClass(WRAPPER_CONSTANTS.SELECT_CLASS);

  if (!isSelected) {
    this.selection = [el];
  } else {
    this.selection = [];
  }

  this.updateValue();
};







// alias jq_shim to $
var $ = window.jq_shim;

//
// This is the code that defines the "formal" class
// which is responsible for most of the work done here.
//

function wrapForm(el) {
  var elements = el.getElementsByClassName('formal-field'),
      factory = new WrapperFactory(),
      i = 0,
      j = 0,
      l = elements.length,
      c = null, wrapped = [];


  if (!elements || !l) return;

  for(; i < l; i++) {
    if (c = factory.wrap(elements[i])) {
      wrapped[j] = c;
      j++;
    }
  }

  return wrapped;

}


function Formal(sel, opt) {
  if (this === window) {
    return this.instances[el] || new Formal(sel, opt);
  }

  this.el = document.getElementById(sel);
  this.text = this.el.elements.item(0);
  this.elements = this.el.elements;

  var i = 0, l = this.elements.length, curr;
  for (; i < l; i++) {
    curr = this.elements[i];


    if (!/formal\-field/.test(curr.parentNode.className) && curr.type !== 'submit' ) {
      curr.outerHTML = '<div class="formal-field"><label for="' + curr.name + '">' + util.camelToSentance(curr.name) + '</label>'  + curr.outerHTML + '</div>';
    }

  }

  this.wrapped = wrapForm(this.el);
  this.timeline = new Timeline(this.el.parentNode, this.el);

  // instantiate a new timeline; pass it the el's parent

}

Formal.prototype = {

  current: function(el) {

    if (el && WRAPPER_CONSTANTS.INPUT_ELS.test(el.tagName)) {
      this.timeline.select(el);
      el.focus();
    }

    return this.timeline.current.el;

  },

  next: function() {
    return this.timeline.next();
  },

  prev: function() {
    return this.timeline.next();
  },

  isComplete: function() {
    return this.timeline.stats.completed;
  },
  // complete: give a format string where ~d is the number you want to represent
  complete: function(fmt) {
    var self = this;
    return (fmt || '~d%').replace(/~d/, function(all, v) { 
      return self.timeline.stats.complete / self.timeline.stats.total;
    });
  }

};


// ==============================
// expose Formal to the window here
// ==============================
window.Formal = Formal;

if (!$.isShim) {

  $.fn.Formal = function(opt) {
    var el = this.get(0);

    if (!/form/i.test(el.tagName)) {
      el = this.find('form').get(0);
    }

    this.Formal = new Formal(el, opt);
    return this;

  };

}









})(window);
