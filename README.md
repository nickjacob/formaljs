# Good Forms
# a library for fixing HTML forms

## Features

`GoodForm(formElement);` wraps a form element in the GoodForm interface. Provides the following:

  * `.validate()` -- validates the form, returns HTML for a validation error output
  * `.isValid()` -- by the form, or on a GoodField, returns `true` or `false`
  * `.submit()` -- serialized form & creates an AJAX request to the action specified or to a URL passed in.

Also modifies the form's action in these ways:

  * `<tab>/shift-tab` moves between form fields, as well as left and right arrows, up/down arrows. 
  * double-space goes to the next field (if you're in a text input)
  * backspace past the left goes to the last field
  * left/right arrows
  * form monitor interface
