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






