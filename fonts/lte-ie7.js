/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-checkmark' : '&#xe001;',
			'icon-cancel' : '&#xe002;',
			'icon-cancel-2' : '&#xe003;',
			'icon-help' : '&#xe004;',
			'icon-eye' : '&#xe006;',
			'icon-new-tab' : '&#xe005;',
			'icon-fullscreen' : '&#xe007;',
			'icon-checkmark-2' : '&#xe008;',
			'icon-check-alt' : '&#xe009;',
			'icon-x' : '&#xe00a;',
			'icon-x-altx-alt' : '&#xe00b;',
			'icon-denied' : '&#xe00c;',
			'icon-minus' : '&#xe00d;',
			'icon-minus-alt' : '&#xe00e;',
			'icon-arrow-left' : '&#xe00f;',
			'icon-arrow-right' : '&#xe010;',
			'icon-pen-alt2' : '&#xe011;',
			'icon-pen-alt-fill' : '&#xe012;',
			'icon-tab' : '&#xe013;',
			'icon-enter' : '&#xe014;',
			'icon-pencil' : '&#xe015;',
			'icon-pencil-2' : '&#xe000;',
			'icon-reply' : '&#xe016;',
			'icon-cog' : '&#xe017;',
			'icon-zoom-in' : '&#xe018;',
			'icon-forward' : '&#xe019;',
			'icon-backspace' : '&#xe01a;',
			'icon-new-tab-2' : '&#xe01b;',
			'icon-checkmark-3' : '&#xe01c;',
			'icon-cancel-3' : '&#xe01d;',
			'icon-eye-2' : '&#xe01e;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; i < els.length; i += 1) {
		el = els[i];
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};