(function (window, Handlebars) {
    "use strict";
    var doc = window.document,
        forms = doc.forms,
        control = doc.getElementById('form-control'),
        list = doc.getElementById('update-list'),
        progressInner = doc.getElementById('progress-inner'),
        progressMsg = doc.getElementById('complete-msg'),
        submit = doc.getElementById('submit'),
        fieldLeft = doc.getElementById('field-left'),
        fieldRight = doc.getElementById('field-right'),
        subButton = doc.getElementById('submit-button'),
        itemTemplateRaw = doc.getElementById('legend-form-item-template').innerHTML,
        fsButton = doc.getElementById('inspect-field'),
        itemTempl = Handlebars.compile(itemTemplateRaw),
        hasOwnProp = {}.hasOwnProperty,
        totalFields = 0,
        completedFields = {},
        indexedFields = {},
        finishedFields = 0,
        isComplete = false,
        currentField,
        isFullScreen = false;



    function each(obj, cb) {
        var i = 0, l;
        function caller(item, index) {
            return cb.call(obj, item, index);
        }

        if(obj.length) {
            for(l=obj.length;i<l;i++)
              caller(obj[i],i);
        } else {
            for(i in obj){
                if(hasOwnProp.call(obj,i)){
                  caller(obj[i], i);
                }
            }
        }
    }

    function checkFieldValidity(field) {
        return (field.validity !== undefined) ? field.validity.valid : null;
    }

    // convert a camelcase name to spaced sentance/string
    function camelCaseToSpace(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, function (s) { return s.toUpperCase(); });
    }

    // remove a class
    function removeClass(elem, className) {

        elem.className = elem.className.replace(new RegExp("\s*"+className+"\s*"),"");
        return elem;

    }


    function addToDom(fieldData) {
        var el = doc.createElement('li'), field;
        el.innerHTML = itemTempl(fieldData);
        el.setAttribute('name', fieldData.domName);
        el.onclick = function (event) {

            field = completedFields[el.getAttribute('name')].field;
            field[(typeof field.onfocus === 'function' ? 'onfocus' : 'focus')]();
        };

        list.appendChild(el);

        return el;
    }

    // keeping it simple here; if it doesn't support validity
    // then just assume it's valid
    function getFieldState(field) {
        var state = '';

        if (!field.value || field.value.length === 0) {
            state = 'incomplete';

        } else if (field.validity) {
            state = field.validity.valid ? 'valid' : 'invalid';

        } else {
            state = 'valid';
        }

        return state;
    }

    // update the progress bar to reflect the number of 
    // completed fields
    function updateProgressBar(finished) {
        var percentComplete = (((finished / totalFields) * 100) % 101) + '%';
        progressInner.style.width = percentComplete;
        progressMsg.innerHTML = finished + '/' + totalFields + ' fields completed.';

        if (percentComplete === '100%') {
            submit.className += ' finished';
            subButton.style.width = '200px';
            isComplete = true;
            subButton.removeAttribute('disabled');
        } else {
            removeClass(submit, 'finished');
            subButton.style.width = '100px';
            isComplete = false;
        }
    }

    // when a field changes (triggered in change event)
    function fieldChanged(field) {

        var html = '', stateNode = null, fieldData, oldState, newState;

        // add it to the completed fields map
        if (completedFields[field.name] === undefined) {
            fieldData = { domName: field.name, name: camelCaseToSpace(field.name), state: getFieldState(field) };
            completedFields[field.name] = {
                field: field,
                dom: addToDom(fieldData),
                state: fieldData.state
            };

            if (fieldData.state === 'valid') {
                finishedFields += 1;
            }

        } else { // we need to update the state only
            oldState = completedFields[field.name].state;
            stateNode = completedFields[field.name].dom.getElementsByClassName('legend-form-state')[0];
            removeClass(stateNode, oldState);
            stateNode.className = 'legend-form-state ' + (newState = completedFields[field.name].state = getFieldState(field));

            if (newState !== oldState) {
                if (newState === 'valid') {
                    finishedFields += 1;
                } else if (oldState === 'valid') {
                    finishedFields -= 1;
                }
            }
        }


        // now we can update the bar;
        updateProgressBar(finishedFields);


    }


    // builds a radio element

    function selectRadio(element) {
        if(!element) return;
        addClass(element,'selected');
    }

    function unselectedRadio(element) {
        if(!element) return;
        removeClass(element, 'selected');
    }

    function nextSiblingOfType(el, type) {
        var sib = el;
        while ((sib = sib.nextSibling) && sib.tagName !== type) {
        }
        return sib;
    }

    function prevSiblingOfType(el, type) {
        var sib = el;
        while ((sib = sib.previousSibling) && sib.tagName !== type) {
        
        }
        return sib;
    }

    function map(arr, func) {
        var i = 0,
            l = arr.length,
            out = [];

        if (!arr.length) {
            return [];
        }

        for(; i<l;i++) {
            out.push(func.call(arr,arr[i]));
        }

        return out;
    }

    function classRegex(className) {
        return new RegExp("\s*"+className + "\s*");
    }

    function addClass(elem, className) {
        if (!classRegex(className).test(elem.className)) {
            elem.className += " " + className;
        }

        return elem;
    }

    function hasClass(elem, className) {

        return classRegex(className).test(elem.className);

    }

    function arrayRemove(arr, from, to) {
      var rest = arr.slice((to || from) + 1 || arr.length);
      arr.length = from < 0 ? arr.length + from : from;
      return arr.push.apply(arr, rest);
    };

    function buildRadio(element) {
        
        var realInput = doc.createElement('input');
        realInput.type = 'text';
        realInput.style.display = 'none';
        realInput.name = element.name || element.getAttribute('name');
        realInput.className = ' hiddenInput';

        element.appendChild(realInput);
        // which elements are selected?
        element.selectedElements = [];

        // when you focus, focus on this instead
        realInput.onfocus = function (direction) {
            element.focus();
            var opt = element.getElementsByTagName('a'), len = opt.length -1;
            map(opt, function(el){ removeClass(el, 'choice'); });

            if (direction !== undefined) {
                if (direction === 1) {
                    addClass(opt[0], 'choice');
                } else if (direction === -1) {
                    addClass(opt[len], 'choice');
                }

            } else{

                addClass(opt[0], 'choice');

            }
            currentField = this;
        };

        element.realInput = realInput;

        element.addEventListener('click', function (event) {
            var selection = event.target;

            if(!hasClass(selection,'selected')) {
                if (this.type === 'radio' && this.selectedElements.length) {
                    unselectedRadio(this.selectedElements[0]);
                    this.selectedElements[0] = selection;
                    selectRadio(selection);
                } else {
                    this.selectedElements.push(selection);
                    selectRadio(selection);
                }
            } else {
                arrayRemove(this.selectedElements, this.selectedElements.indexOf(selection));
                unselectedRadio(selection);
            }

            this.realInput.value = (map(this.selectedElements, function(elem){ return elem.value || elem.innerHTML })).join(',');
            fieldChanged(this.realInput);

        }, false);

        element.addEventListener('blur', function() {

            map(this.getElementsByTagName('a'), function(el) { removeClass(el, 'choice'); });

        }, false);
        element.addEventListener('keyup', function (event) {
            var key = event.keyCode || event.which, newSelection = this.getElementsByTagName('a')[0], direction, choice = this.getElementsByClassName('choice')[0];

            if (key === 37 || key === 39 || key === 13) {
                event.cancelBubble = true;

                if (key === 37) { // left
                    newSelection = choice ? prevSiblingOfType(choice, choice.tagName) : newSelection;
                    direction = -1;
                } else if (key === 39) { // right
                    newSelection = choice ? nextSiblingOfType(choice, choice.tagName) : newSelection;
                    direction = 1;
                } else if (key === 13) {

                    if (choice) {

                        if (!hasClass(choice,'selected')) {
                          if (this.type == 'radio' && this.selectedElements.length) {
                                unselectedRadio(this.selectedElements[0]);
                                this.selectedElements[0] = choice;

                          } else {
                                this.selectedElements.push(choice);
                          }

                          selectRadio(this.selectedElements[this.selectedElements.length - 1]);
                        } else {
                                arrayRemove(this.selectedElements, this.selectedElements.indexOf(choice));
                                unselectedRadio(choice);
                        }

                        event.preventDefault();
                        this.realInput.value = (map(this.selectedElements, function(elem){ return elem.value || elem.innerHTML })).join(',');

                        fieldChanged(this.realInput);
                        return;
                    }
                }

                if (newSelection) {
                    if (choice) {
                        removeClass(choice,'choice');
                    }
                    newSelection.className += ' choice';  

                } else {
                    // get the input before
                    forceFocus(indexedFields[indexedFields[this.realInput.name] + direction], direction);
                }
            }
        }, false);

        element.contentEditable = true; // now that's a DOM hack if I ever saw one!
        each(element.getElementsByTagName('a'), function (el, i) {

            el.contentEditable = false;

        });

        element.addEventListener('focus', function (event) {
            element.setAttribute('focused', true);
        }, false);

        element.addEventListener('blur', function (event) {
            element.setAttribute('focused', false);

        }, false);

    }

    function incompleteMessage() {

    }

    function submitOnEnter(form) {
        if (!isComplete) {
            return incompleteMessage();
        }

        if (typeof form.onsubmit === 'function') {
            form.submit();
        } else {
            alert('submit form!');
        }
    }

    function forceFocus(elem, eventData) {
        return elem[(typeof elem.onfocus === 'function' ? 'onfocus' : 'focus')](eventData);
    }

    function focusLastField(form, current) {
        var curr = doc.activeElement,
            next = (indexedFields[indexedFields[curr.name] - 1]);


        if (next) {
            forceFocus(next);
        }
    }

    function clickEffect(field) {

        field.className += ' clicked';
        window.setTimeout(function () {
            removeClass(field, 'click');
        },300);

    }

    function focusNextField(curr) {
        var curr = curr || doc.activeElement,
            next = (indexedFields[indexedFields[curr.name] + 1]);

        if (next) {
            forceFocus(next);
        }
    }


    doc.addEventListener('keyup', function (event) {
        var key = event.keyCode || event.which;

        if (key === 13) {
            if (!doc.activeElement) {
              submitOnEnter();
            } else {
              focusNextField();
            }

        } else if (key === 37) {
            // left or up
            clickEffect(fieldLeft);
            focusLastField();

        } else if (key === 39) {
            // right or down
            clickEffect(fieldRight);
            focusNextField();

        }

    }, false);

    // Go through each form, set up event listeners
    // looking for changes. When you get a change on
    // an element, add the name of the field & increment the total fields counter
    // (which you'll determine by the sum of the elements lengths
    each(forms, function (form, index) {


        form.addEventListener('change', function (event) {
            fieldChanged(event.target);
        }, false);

        // bind click events to all of the popout icons
        each(doc.getElementsByTagName('label'), function (element, index) {

            element.onclick = function (e) {
                var isModal;
                e.stopPropagation();

                if ((isModal = element.parentNode.getAttribute('modal')) === null || isModal === false || isModal === 'false') {
                    // set the modal attr
                    element.parentNode.setAttribute('modal', true);
                    element.parentNode.className += ' modal';

                } else {
                    
                    element.parentNode.setAttribute('modal', false);
                    removeClass(element.parentNode, 'modal');
                }

            };

        });

        // set up/create the radio elements
        each(doc.getElementsByClassName('rang'), function (element, index) {
            if (element.hasAttribute('data-type')) {
                element.type = element.getAttribute('data-type');
                buildRadio(element);
            }

        });

        each(doc.getElementsByClassName('field'), function (element, index) {

            element.onfocus = function (event) {
                var input;

                event.preventDefault();
                input = element.getElementsByTagName('input')[0];

                if (input) {
                    forceFocus(input);
                    currentField = input;
                }
            };

        });
        

        fsButton.onclick = function (event) {
            return false;
            var elem = doc.documentElement;

            if (!isFullScreen) {

              if (elem.requestFullScreen) {
                elem.requestFullScreen();
              } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
              } else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen();
              }

              isFullScreen = true;
              fsButton.innerHTML = "&#xe00a";

            } else {

              if (elem.exitFullscreen) {
                elem.exitFullscreen();
              } else if (elem.mozCancelFullScreen) {
                elem.mozCancelFullScreen();
              } else if (elem.webkitCancelFullScreen) {
                elem.webkitCancelFullScreen();
              }

              isFullScreen = false;
              fsButton.innerHTML = "&#xe007";
            }

        };

        fieldLeft.onclick = function (e) {
            focusLastField(currentField);
        };

        fieldRight.onclick = function(e) {
            focusNextField(currentField);
        };

        each(doc.getElementsByClassName('form-field'), function (element, index) {
            // two-way map
            var input = element.getElementsByTagName('input')[0];
            indexedFields[input.name] = (totalFields += 1);
            indexedFields[totalFields] = input;
            input.setAttribute('tabindex', -1);
            
            input.addEventListener('keyup', function (e) {
                var key = e.keyCode || e.which;

                /*
                 *if (key === 9) {
                 *    if (e.shiftKey) {
                 *        focusLastField();
                 *    } else {
                 *        focusNextField();
                 *    }
                 *}
                 */

            });

            element.setAttribute('tabindex', index+1);
            element.onclick = function (e) {
                

                if (/input|a|button|textarea/i.test(e.target.tagName)) {
                    return false;
                }

                if (element.getAttribute('modal')) {

                    removeClass(element, 'modal');
                    element.setAttribute('modal', false);

                }

            }

        });

        updateProgressBar(finishedFields);
    });






}(window, Handlebars));
