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


