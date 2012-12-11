// Timeline JS
// this does a few things
//
// 1. builds the HTML
// 2. sizes it correctly
//
// since this is included as just javascript & css,
// need to have the HTML templates defined in here.

(function timeline(window) {
  var doc = window.document, root = 'gf-timeline-'

  SELECTORS = {
    el: root + 'main',
    list: root + 'list',
    listItem: root + 'list-item',
    control: root + 'control',
    reset: root + 'reset',
    submit: root + 'submit',
    marker: root + 'marker',
    label: root + 'label',
    move: root + 'move',
  };

  function __sel(sel) {
    if(/#[a-zA-Z\-]*/.test(sel)){
      return [doc.getElementById(sel)];
    } else if (/\.[a-zA-Z\-]*/.test(sel)){
      return doc.getElementsByClassName(sel);
    }
  }

  function __append(el, html) {
    var frag = doc.createDocumentFragment();
    frag.innerHTML = html;
    return el.appendChild(frag);
  }

  // build the root
  function buildDom(root) {
    root = (typeof root === 'string') ? __sel(root)[0] : root;
    root = root || doc.body;

    return __append(root,
      '<div id="' + SELECTORS.el + '" class="' + SELECTORS.el +
      '" a class="' + SELECTORS.control + '" id="' + SELECTORS.reset +
      '">reset</a><div id="' + SELECTORS.move + '"><div id="' + SELECTORS.label
      + '"></div><div id="' + SELECTORS.marker + '"></div></div><div id="' + SELECTORS.inner
      + '" class="' + SELECTORS.inner + '"><ul class="' + SELECTORS.list + '" id="' + 
      SELECTORS.list + '">');

  }




  function Timeline(el, form, opt) {

    if (typeof opt.prefix === 'string') {
      root = /\-$/.test(opt.prefix) ? opt.prefix : opt.prefix + '-';
    }

    this.el = buildDom(el);

    this._initializeSelectors();
    this._bootstrapForm(form);

  }

  TimeLine.prototype = {

    //
    // PRIVATE METHODS
    //

    // once the dom is loaded, initialize the selectors
    _initializeSelectors: function(){
        this.dom = this.dom || {};
        var self = this;

        for ( var sel in SELECTORS ) {
          (function(k,v){
            self.dom[k] = self.el.getElementById(v) || self.el.getElementsByClassName(v);
          }(sel, SELECTORS[sel]));
        }
    },

    // build the internal representation of the form, the dom for the form, etc
    _bootstrapForm: function(formEl) {

    },



  }



}(window));
