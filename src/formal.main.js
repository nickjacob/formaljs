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








