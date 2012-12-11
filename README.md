# Formal.js
## Fixing Forms

### What is Formal?

* A small (15kb js + 25kb CSS) library for improving the UI of form input.
* A way to improve the UX of a long web form, or make validation easier for users.
* A jQuery plugin.
* A standalone library

### What problems does it address?

* `checkbox` and `radio` type inputs are not handled the same way as other inputs (you can't tab between options for example)
* why don't the left and right arrows work for moving between form fields?
* couldn't forms look better? Be more fun?
* validation currently required a large mental load: the user has to maintain a model of the form or go through the whole form to find his mistake.
* nothing is truly cross-browser in DOM land.

### How does it work? What is it?

The library is implemented as a series of components (broken up into files in the `src/` directory. They're modular in the sense that all functionality is encapsulated inside certain functions ("classes"), but not independently operable:

* `formal.core.js`: these are the utility functions; mostly just javascript shim kind of stuff, fixing holes in the language and providing some good helpers. All scoped inside the `util` object.
* `jquery.shim.js`: this is a module designed to be jQuery api-compatible, but should be fore internal use only. It is exposed on the window as `window.jq_shim`, but **should not** be used unless you know exactly what sacrifices it makes (a lot); it covers a tiny subset of jQuery's functionality. The point is that you can leave out this file if you include jQuery, and vice-versa, and the library will work either way. It barely relies on this 'jQuery', mostly for helper functions, not DOM manipulation.
* `formal.wrappers.js`: the wrappers are the objects that encapsulate the actual form inputs. These provide a common interface by which event listeners can delegate and you can encapsulate the code necessary to fix more problematic DOM elements (such as the `checkbox` and `radio` types of the `input` element). Each wrapper handles validation. This interfaces with the rest of the program mostly through events (event/observer model).
* `formal.timeline.js`: this is the interface for the 'timeline' — the element on the bottom of the screen that provides quick access and overview of the progress in the form. Note that this shares its base object (the FormalUIObject) with Wrappers, so you can't separate them in their current form (todo: move out the super-class into a different file). 
* `formal.main.js`: this actually does very litte: establishes a public API, creates the jQuery "plugin", which is just a really simple wrapper function that uses the pre-selected DOM element provided by jQuery. 

What does it do? When you call `$.Formal()` or `Formal(el)`, you'll get your form wrapped by containers (if you have `opt.wrap` set, and you'll have a timeline built that will show you all of the DOM elements in your form and their state). For a demo go to: **//TODO: demo**

### Usage

##### 1. Javascript 

To use Formal, just include the js and the css and call it on your `<form>` element at the end of your `<body>`:

header:

    <link rel='stylesheet' href='css/master.css'/>
    <script type='text/javascript' src='dist/formal.min.js'></script>
    
body:


    <script>
      var formal = new Formal(document.forms[0]);
    </script>
    </body>
    
Or with jQuery:

     <script>
       $(document.forms[0]).Formal();
     </script>
     </body>
     
##### 2. Customization

To customize the css (which is `LESS`!), just take a look at the files in `less/`--you'll probably be most interested in `colors.less` and `base.less`, which defined constants used throughout the application. To use it, just compile the LESS into ./css/.

To customize the actual plugin, the best route would likely be to subclass one of the major classes (e.g. the Timeline). This way, you wouldn't have to worry about backwards compatibility and runnability until you code a significant part of your project.

### Building the Project

This project uses `Grunt.js` as a build tool. It's ocnfiguration is pretty minimal (look at the grunt.js file) -- for the most part it jsut concatenates and minifies the source.

### TODO

* run code through google closure compiler; add more descriptive comments; documentation
* implement client-side caching plugin
* find contributors
* browser history/state API
* websocket form streaming
* AJAX helpers & AJAX form adapter (to automatically convert a form to Ajax).

