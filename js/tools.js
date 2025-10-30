////
// Joe's Misc JavaScript Tools
// Copyright (c) 2004 - 2026 Joseph Huckaby
// Released under the BSD 3-Clause License
////

var months = [
	[ 1, 'January' ], [ 2, 'February' ], [ 3, 'March' ], [ 4, 'April' ],
	[ 5, 'May' ], [ 6, 'June' ], [ 7, 'July' ], [ 8, 'August' ],
	[ 9, 'September' ], [ 10, 'October' ], [ 11, 'November' ],
	[ 12, 'December' ]
];

function parse_query_string(url) {
	// parse query string into key/value pairs and return as object
	var query = {}; 
	url.replace(/^.*\?/, '').replace(/([^\=]+)\=([^\&]*)\&?/g, function(match, key, value) {
		query[key] = decodeURIComponent(value);
		if (query[key].match(/^\-?\d+$/)) query[key] = parseInt(query[key]);
		else if (query[key].match(/^\-?\d*\.\d+$/)) query[key] = parseFloat(query[key]);
		return ''; 
	} );
	return query; 
};

function compose_query_string(queryObj) {
	// compose key/value pairs into query string
	// supports duplicate keys (i.e. arrays)
	var qs = '';
	for (var key in queryObj) {
		var values = always_array(queryObj[key]);
		for (var idx = 0, len = values.length; idx < len; idx++) {
			qs += (qs.length ? '&' : '?') + encodeURIComponent(key) + '=' + encodeURIComponent(values[idx]);
		}
	}
	return qs;
}

function get_text_from_bytes_dash(bytes) {
	// get super-appreviated bytes-to-text, for dash widgets
	return get_text_from_bytes(bytes, 1).replace(/\s+/g, '').replace(/bytes/, 'b');
};

function get_text_from_bytes(bytes, precision) {
	// convert raw bytes to english-readable format
	// set precision to 1 for ints, 10 for 1 decimal point (default), 100 for 2, etc.
	bytes = Math.floor(bytes);
	if (!precision) precision = 10;
	
	if (bytes >= 1024) {
		bytes = Math.floor( (bytes / 1024) * precision ) / precision;
		if (bytes >= 1024) {
			bytes = Math.floor( (bytes / 1024) * precision ) / precision;
			if (bytes >= 1024) {
				bytes = Math.floor( (bytes / 1024) * precision ) / precision;
				if (bytes >= 1024) {
					bytes = Math.floor( (bytes / 1024) * precision ) / precision;
					return bytes + ' TB';
				} 
				else return bytes + ' GB';
			} 
			else return bytes + ' MB';
		}
		else return bytes + ' K';
	}
	else return bytes + pluralize(' byte', bytes);
};

function get_bytes_from_text(text) {
	// parse text into raw bytes, e.g. "1 K" --> 1024
	if (text.toString().match(/^\d+$/)) return parseInt(text); // already in bytes
	var multipliers = {
		b: 1,
		k: 1024,
		m: 1024 * 1024,
		g: 1024 * 1024 * 1024,
		t: 1024 * 1024 * 1024 * 1024
	};
	var bytes = 0;
	text = text.toString().replace(/([\d\.]+)\s*(\w)\w*\s*/g, function(m_all, m_g1, m_g2) {
		var mult = multipliers[ m_g2.toLowerCase() ] || 0;
		bytes += (parseFloat(m_g1) * mult); 
		return '';
	} );
	return Math.floor(bytes);
};

function ucfirst(text) {
	// capitalize first character only, lower-case rest
	return text.substring(0, 1).toUpperCase() + text.substring(1, text.length).toLowerCase();
}

function commify(number) {
	// add localized commas to integer, e.g. 1,234,567 for US
	return (new Intl.NumberFormat()).format(number || 0);
}

function short_float(value, places) {
	// Shorten floating-point decimal to N places max
	if (!places) places = 2;
	var mult = Math.pow(10, places);
	return( Math.floor(parseFloat(value || 0) * mult) / mult );
}

function pct(count, max, floor) {
	// Return formatted percentage given a number along a sliding scale from 0 to 'max'
	var pct = (count * 100) / (max || 1);
	if (!pct.toString().match(/^\d+(\.\d+)?$/)) { pct = 0; }
	return '' + (floor ? Math.floor(pct) : short_float(pct)) + '%';
};

function crammify(str) {
	// strip non-alpha and lower-case
	return ('' + str).replace(/\W+/g, '').toLowerCase();
};

function get_text_from_seconds(sec, abbrev, no_secondary) {
	// convert raw seconds to human-readable relative time
	var neg = '';
	sec = parseInt(sec, 10);
	if (sec<0) { sec =- sec; neg = '-'; }
	
	var p_text = abbrev ? "sec" : "second";
	var p_amt = sec;
	var s_text = "";
	var s_amt = 0;
	
	if (sec > 59) {
		var min = parseInt(sec / 60, 10);
		sec = sec % 60; 
		s_text = abbrev ? "sec" : "second"; 
		s_amt = sec; 
		p_text = abbrev ? "min" : "minute"; 
		p_amt = min;
		
		if (min > 59) {
			var hour = parseInt(min / 60, 10);
			min = min % 60; 
			s_text = abbrev ? "min" : "minute"; 
			s_amt = min; 
			p_text = abbrev ? "hr" : "hour"; 
			p_amt = hour;
			
			if (hour > 23) {
				var day = parseInt(hour / 24, 10);
				hour = hour % 24; 
				s_text = abbrev ? "hr" : "hour"; 
				s_amt = hour; 
				p_text = "day"; 
				p_amt = day;
				
				if (day > 29) {
					var month = parseInt(day / 30, 10);
					s_text = "day"; 
					s_amt = day % 30; 
					p_text = abbrev ? "mon" : "month"; 
					p_amt = month;
					
					if (day >= 365) {
						var year = parseInt(day / 365, 10);
						month = month % 12; 
						s_text = abbrev ? "mon" : "month"; 
						s_amt = month; 
						p_text = abbrev ? "yr" : "year"; 
						p_amt = year;
					} // day>=365
				} // day>29
			} // hour>23
		} // min>59
	} // sec>59
	
	var text = p_amt + "&nbsp;" + p_text;
	if ((p_amt != 1) && !abbrev) text += "s";
	if (s_amt && !no_secondary) {
		text += ", " + s_amt + "&nbsp;" + s_text;
		if ((s_amt != 1) && !abbrev) text += "s";
	}
	
	return(neg + text);
}

function get_text_from_seconds_round(sec, abbrev) {
	// convert raw seconds to human-readable relative time
	// round to nearest instead of floor
	var neg = '';
	sec = Math.round(sec);
	if (sec < 0) { sec =- sec; neg = '-'; }
	
	var suffix = abbrev ? "sec" : "second";
	var amt = sec;
	
	if (sec > 59) {
		var min = Math.round(sec / 60);
		suffix = abbrev ? "min" : "minute"; 
		amt = min;
		
		if (min > 59) {
			var hour = Math.round(min / 60);
			suffix = abbrev ? "hr" : "hour"; 
			amt = hour;
			
			if (hour > 23) {
				var day = Math.round(hour / 24);
				suffix = "day"; 
				amt = day;
			} // hour>23
		} // min>59
	} // sec>59
	
	if (abbrev === 2) suffix = suffix.substring(0, 1);
	
	var text = "" + amt + " " + suffix;
	if ((amt != 1) && !abbrev) text += "s";
	if (abbrev === 2) text = text.replace(/\s+/g, '');
	
	return(neg + text);
};

function get_text_from_ms_round(ms, abbrev) {
	// convert raw milliseconds to human-readable relative time
	// round to nearest if 1s or above
	if (Math.abs(ms) >= 1000) return get_text_from_seconds_round(ms / 1000, abbrev);
	var neg = '';
	if (ms < 0) { ms =- ms; neg = '-'; }
	var suffix = abbrev ? "ms" : "millisecond";
	var text = "" + ms + " " + suffix;
	if ((ms != 1) && !abbrev) text += "s";
	if (abbrev === 2) text = text.replace(/\s+/g, '');
	return neg + text;
};

function get_seconds_from_text(text) {
	// parse text into raw seconds, e.g. "1 minute" --> 60
	if (text.toString().match(/^\d+$/)) return parseInt(text); // already in seconds
	var multipliers = {
		s: 1,
		m: 60,
		h: 60 * 60,
		d: 60 * 60 * 24,
		w: 60 * 60 * 24 * 7
	};
	var seconds = 0;
	text = text.toString().replace(/([\d\.]+)\s*(\w)\w*\s*/g, function(m_all, m_g1, m_g2) {
		var mult = multipliers[ m_g2.toLowerCase() ] || 0;
		seconds += (parseFloat(m_g1) * mult); 
		return '';
	} );
	return Math.floor(seconds);
};

function get_inner_window_size(dom) {
	// get size of inner window
	if (!dom) dom = window;
	var myWidth = 0, myHeight = 0;
	
	if( typeof( dom.innerWidth ) == 'number' ) {
		// Non-IE
		myWidth = dom.innerWidth;
		myHeight = dom.innerHeight;
	}
	else if( dom.document.documentElement && ( dom.document.documentElement.clientWidth || dom.document.documentElement.clientHeight ) ) {
		// IE 6+ in 'standards compliant mode'
		myWidth = dom.document.documentElement.clientWidth;
		myHeight = dom.document.documentElement.clientHeight;
	}
	else if( dom.document.body && ( dom.document.body.clientWidth || dom.document.body.clientHeight ) ) {
		// IE 4 compatible
		myWidth = dom.document.body.clientWidth;
		myHeight = dom.document.body.clientHeight;
	}
	return { width: myWidth, height: myHeight };
}

function get_scroll_xy(dom) {
	// get page scroll X, Y
	if (!dom) dom = window;
  var scrOfX = 0, scrOfY = 0;
  if( typeof( dom.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrOfY = dom.pageYOffset;
    scrOfX = dom.pageXOffset;
  } else if( dom.document.body && ( dom.document.body.scrollLeft || dom.document.body.scrollTop ) ) {
    //DOM compliant
    scrOfY = dom.document.body.scrollTop;
    scrOfX = dom.document.body.scrollLeft;
  } else if( dom.document.documentElement && ( dom.document.documentElement.scrollLeft || dom.document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrOfY = dom.document.documentElement.scrollTop;
    scrOfX = dom.document.documentElement.scrollLeft;
  }
  return { x: scrOfX, y: scrOfY };
}

function get_scroll_max(dom) {
	// get maximum scroll width/height
	if (!dom) dom = window;
	var myWidth = 0, myHeight = 0;
	if (dom.document.body.scrollHeight) {
		myWidth = dom.document.body.scrollWidth;
		myHeight = dom.document.body.scrollHeight;
	}
	else if (dom.document.documentElement.scrollHeight) {
		myWidth = dom.document.documentElement.scrollWidth;
		myHeight = dom.document.documentElement.scrollHeight;
	}
	return { width: myWidth, height: myHeight };
}

function str_value(str) {
	// Get friendly string value for display purposes.
	if (typeof(str) == 'undefined') str = '';
	else if (str === null) str = '';
	return '' + str;
}

function pluralize(word, num) {
	// Pluralize a word using simplified English language rules.
	if (num != 1) {
		if (word.match(/[^e]y$/)) return word.replace(/y$/, '') + 'ies';
		else if (word.match(/s$/)) return word + 'es'; // processes
		else return word + 's';
	}
	else return word;
}

function render_menu_options(items, sel_value, auto_add) {
	// return HTML for menu options
	var html = '';
	var found = false;
	
	for (var idx = 0, len = items.length; idx < len; idx++) {
		var item = items[idx];
		var item_name = '';
		var item_value = '';
		var attribs = {};
		
		if (isa_hash(item)) {
			if (('label' in item) && ('items' in item)) {
				// optgroup, recurse for items within
				html += '<optgroup label="' + item.label + '">';
				html += render_menu_options( item.items, sel_value, false );
				html += '</optgroup>';
				continue;
			}
			if (('label' in item) && ('data' in item)) {
				item_name = item.label;
				item_value = item.data;
			}
			else {
				item_name = item.title;
				item_value = item.id;
			}
			if (item.icon) attribs['data-icon'] = item.icon;
			if (item.class) attribs['data-class'] = item.class;
			if (item.group) attribs['data-group'] = item.group;
		}
		else if (isa_array(item)) {
			item_value = item[0];
			item_name = item[1];
		}
		else {
			item_name = item_value = item;
		}
		
		attribs.value = item_value;
		if (item_value == sel_value) attribs.selected = 'selected';
		html += '<option ' + compose_attribs(attribs) + '>' + item_name + '</option>';
		
		if (item_value == sel_value) found = true;
	}
	
	if (!found && (str_value(sel_value) != '') && auto_add) {
		html += '<option value="'+sel_value+'" selected="selected">'+sel_value+'</option>';
	}
	
	return html;
}

function populate_menu(menu, items, sel_values, auto_add) {
	// repopulate menu, supports multi-select
	if (!sel_values) sel_values = [];
	if (typeof(sel_values) == 'string') sel_values = [sel_values];
	if (!auto_add) auto_add = false;
	
	menu.options.length = 0;
	
	items.forEach( function(item, idx) {
		var item_name = '';
		var item_value = '';
		
		if (isa_hash(item)) {
			if (('label' in item) && ('data' in item)) {
				item_name = item.label;
				item_value = item.data;
			}
			else {
				item_name = item.title;
				item_value = item.id;
			}
		}
		else if (isa_array(item)) {
			item_value = item[0];
			item_name = item[1];
		}
		else {
			item_name = item_value = item;
		}
		
		var opt = new Option( item_name, item_value );
		if (sel_values.includes(item_value)) {
			opt.selected = true;
			sel_values.splice( sel_values.indexOf(item_value), 1 );
		}
		menu.options[ menu.options.length ] = opt;
		
		if (isa_hash(item) && item.icon && opt.setAttribute) opt.setAttribute('data-icon', item.icon);
		if (isa_hash(item) && item.class && opt.setAttribute) opt.setAttribute('data-class', item.class);
	}); // foreach item
	
	if (sel_values.length && auto_add) {
		sel_values.forEach( function(sel_value) {
			var opt = new Option( sel_value, sel_value );
			opt.selected = true;
			menu.options[ menu.options.length ] = opt;
		} ); // foreach selected value
	} // yes add
};

function zeroPad(value, len) {
	// Pad a number with zeroes to achieve a desired total length (max 10)
	return ('0000000000' + value).slice(0 - len);
};

function dirname(path) {
	// return path excluding file at end (same as POSIX function of same name)
	return path.toString().replace(/\/+$/, "").replace(/\/[^\/]+$/, "");
}

function basename(path) {
	// return filename, strip path (same as POSIX function of same name)
	return path.toString().replace(/\/+$/, "").replace(/^(.*)\/([^\/]+)$/, "$2");
}

function strip_ext(path) {
	// strip extension from filename
	return path.toString().replace(/\.\w+$/, "");
}

function load_script(url) {
	// Dynamically load script into DOM.
	Debug.trace( "Loading script: " + url );
	var scr = document.createElement('SCRIPT');
	scr.type = 'text/javascript';
	scr.src = url;
	document.getElementsByTagName('HEAD')[0].appendChild(scr);
}

function compose_attribs(attribs) {
	// compose Key="Value" style attributes for HTML elements
	var html = '';
	var value = '';
	
	if (attribs) {
		for (var key in attribs) {
			value = attribs[key];
			if (typeof(value) != 'undefined') {
				if (value === null) value = '';
				html += " " + key + "=\"" + encode_attrib_entities(''+value) + "\"";
			}
		}
	}

	return html;
}

function compose_style(attribs) {
	// compose key:value; pairs for style (CSS) elements
	var html = '';
	
	if (attribs) {
		for (var key in attribs) {
			html += " " + key + ":" + attribs[key] + ";";
		}
	}

	return html;
}

function trim(text) {
	// strip whitespace from beginning and end of string
	if (text == null) return '';
	
	if (text && text.replace) {
		text = text.replace(/^\s+/, "");
		text = text.replace(/\s+$/, "");
	}
	
	return text;
}

function encode_entities(text) {
	// Simple entitize function for composing XML
	if (text == null) return '';

	if (text && text.replace) {
		text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
	}

	return text;
}

function encode_attrib_entities(text) {
	// Simple entitize function for composing XML attributes
	if (text == null) return '';

	if (text && text.replace) {
		text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
		text = text.replace(/</g, "&lt;");
		text = text.replace(/>/g, "&gt;");
		text = text.replace(/\"/g, "&quot;");
		text = text.replace(/\'/g, "&apos;");
	}

	return text;
}

function strip_html(text) {
	if (text == null) return '';
	
	if (text && text.replace) {
		text = text.replace(/<[^>]*>/g, '');
	}
	
	return text;
}

function truncate_ellipsis(str, len) {
	// simple truncate string with ellipsis if too long
	str = str_value(str);
	if (str.length > len) {
		str = str.substring(0, len - 3) + '...';
	}
	return str;
}

function escape_text_field_value(text) {
	// escape text field value, with stupid IE support
	return encode_attrib_entities( str_value(text) );
}

function expando_text(text, max, link) {
	// if text is longer than max chars, chop with ellipsis and include link to show all
	if (!link) link = 'More';
	text = str_value(text);
	if (text.length <= max) return text;
	
	var before = text.substring(0, max);
	var after = text.substring(max);
	
	return before + 
		'<span>... <a href="javascript:void(0)" onClick="$(this).parent().hide().next().show()">'+link+'</a></span>' + 
		'<span style="display:none">' + after + '</span>';
};

function get_int_version(str, pad) {
	// Joe's Fun Multi-Decimal Comparision Trick
	// Example: convert 2.5.1 to 2005001 for numerical comparison against other similar "numbers".
	if (!pad) pad = 3;
	str = str_value(str).replace(/[^\d\.]+/g, '');
	if (!str.match(/\./)) return parseInt(str, 10);
	
	var parts = str.split(/\./);
	var output = '';
	for (var idx = 0, len = parts.length; idx < len; idx++) {
		var part = '' + parts[idx];
		while (part.length < pad) part = '0' + part;
		output += part;
	}
	return parseInt( output.replace(/^0+/, '') || "0", 10 );
};

function get_unique_id(len) {
	// Get unique ID using crypto
	if (!len) len = 16;
	var id = '';
	var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	while (id.length < len) {
		id += chars[ crypto.getRandomValues(new Uint32Array(1))[0] % chars.length ];
	}
	return id;
};

function get_short_id(prefix = '', len = 10) {
	// Get unique ID using crypto, lower-case only
	var id = '';
	var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	while (id.length < len) {
		id += chars[ crypto.getRandomValues(new Uint32Array(1))[0] % chars.length ];
	}
	return prefix + id;
};

function escape_regexp(text) {
	// Escape text for use in a regular expression.
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

function set_path(target, path, value) {
	// set path using dir/slash/syntax or dot.path.syntax
	// preserve dots and slashes if escaped
	var parts = path.replace(/\\\./g, '__PXDOT__').replace(/\\\//g, '__PXSLASH__').split(/[\.\/]/).map( function(elem) {
		return elem.replace(/__PXDOT__/g, '.').replace(/__PXSLASH__/g, '/');
	} );
	
	var key = parts.pop();
	
	// traverse path
	while (parts.length) {
		var part = parts.shift();
		if (part) {
			if (!(part in target)) {
				// auto-create nodes
				target[part] = {};
			}
			if (typeof(target[part]) != 'object') {
				// path runs into non-object
				return false;
			}
			target = target[part];
		}
	}
	
	target[key] = value;
	return true;
};

function get_path(target, path) {
	// get path using dir/slash/syntax or dot.path.syntax
	// preserve dots and slashes if escaped
	var parts = path.replace(/\\\./g, '__PXDOT__').replace(/\\\//g, '__PXSLASH__').split(/[\.\/]/).map( function(elem) {
		return elem.replace(/__PXDOT__/g, '.').replace(/__PXSLASH__/g, '/');
	} );
	
	var key = parts.pop();
	
	// traverse path
	while (parts.length) {
		var part = parts.shift();
		if (part) {
			if (typeof(target[part]) != 'object') {
				// path runs into non-object
				return undefined;
			}
			target = target[part];
		}
	}
	
	return target[key];
};

function delete_path(target, path) {
	// delete path using dir/slash/syntax or dot.path.syntax
	// preserve dots and slashes if escaped
	var parts = path.replace(/\\\./g, '__PXDOT__').replace(/\\\//g, '__PXSLASH__').split(/[\.\/]/).map( function(elem) {
		return elem.replace(/__PXDOT__/g, '.').replace(/__PXSLASH__/g, '/');
	} );
	
	var key = parts.pop();
	
	// traverse path
	while (parts.length) {
		var part = parts.shift();
		if (part) {
			if (!(part in target)) {
				// auto-create nodes
				target[part] = {};
			}
			if (typeof(target[part]) != 'object') {
				// path runs into non-object
				return false;
			}
			target = target[part];
		}
	}
	
	delete target[key];
	return true;
};

function substitute(text, args, fatal) {
	// perform simple [placeholder] substitution using supplied
	// args object and return transformed text
	var self = this;
	var result = true;
	var value = '';
	if (typeof(text) == 'undefined') text = '';
	text = '' + text;
	if (!args) args = {};
	
	text = text.replace(/\[([^\]]+)\]/g, function(m_all, name) {
		value = get_path(args, name);
		if (value === undefined) {
			result = false;
			return m_all;
		}
		else return value;
	} );
	
	if (!result && fatal) return null;
	else return text;
};

function find_objects_idx(arr, crit, max) {
	// find idx of all objects that match crit keys/values
	var idxs = [];
	var num_crit = 0;
	for (var a in crit) num_crit++;
	
	if (isa_hash(arr)) arr = hash_values_to_array(arr);
	
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		var matches = 0;
		for (var key in crit) {
			if (arr[idx][key] == crit[key]) matches++;
		}
		if (matches == num_crit) {
			idxs.push(idx);
			if (max && (idxs.length >= max)) return idxs;
		}
	} // foreach elem
	
	return idxs;
};

function find_object_idx(arr, crit) {
	// find idx of first matched object, or -1 if not found
	if (isa_hash(arr)) arr = hash_values_to_array(arr);
	var idxs = find_objects_idx(arr, crit, 1);
	return idxs.length ? idxs[0] : -1;
};

function find_object(arr, crit) {
	// return first found object matching crit keys/values, or null if not found
	if (isa_hash(arr)) arr = hash_values_to_array(arr);
	var idx = find_object_idx(arr, crit);
	return (idx > -1) ? arr[idx] : null;
};

function find_objects(arr, crit) {
	// find and return all objects that match crit keys/values
	if (isa_hash(arr)) arr = hash_values_to_array(arr);
	var idxs = find_objects_idx(arr, crit);
	var objs = [];
	for (var idx = 0, len = idxs.length; idx < len; idx++) {
		objs.push( arr[idxs[idx]] );
	}
	return objs;
};

function delete_object(arr, crit) {
	var idx = find_object_idx(arr, crit);
	if (idx > -1) {
		arr.splice( idx, 1 );
		return true;
	}
	return false;
};

function always_array(obj, key) {
	// if object is not array, return array containing object
	// if key is passed, work like XMLalwaysarray() instead
	// apparently MSIE has weird issues with obj = always_array(obj);
	
	if (key) {
		if ((typeof(obj[key]) != 'object') || (typeof(obj[key].length) == 'undefined')) {
			var temp = obj[key];
			delete obj[key];
			obj[key] = new Array();
			obj[key][0] = temp;
		}
		return null;
	}
	else {
		if ((typeof(obj) != 'object') || (typeof(obj.length) == 'undefined')) { return [ obj ]; }
		else return obj;
	}
};

function hash_keys_to_array(hash) {
	// convert hash keys to array (discard values)
	var arr = [];
	for (var key in hash) arr.push( key );
	return arr;
};

function hash_values_to_array(hash) {
	// convert hash values to array (discard keys)
	var arr = [];
	for (var key in hash) arr.push( hash[key] );
	return arr;
};

function obj_array_to_hash(arr, key) {
	// convert array of objects to hash, keyed by specific key
	var hash = {};
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		var item = arr[idx];
		if (key in item) hash[ item[key] ] = item;
	}
	return hash;
}

function merge_objects(a, b) {
	// merge keys from a and b into c and return c
	// b has precedence over a
	if (!a) a = {};
	if (!b) b = {};
	var c = {};
	
	for (var key in a) c[key] = a[key];
	for (var key in b) c[key] = b[key];
	
	return c;
};

function merge_hash_into(a, b) {
	// shallow-merge keys from b into a
	for (var key in b) a[key] = b[key];
};

function copy_object(obj) {
	// return copy of object (NOT DEEP)
	var new_obj = {};
	for (var key in obj) new_obj[key] = obj[key];
	return new_obj;
};

function deep_copy_object(obj) {
	// recursively copy object and nested objects
	// return new object
	return JSON.parse( JSON.stringify(obj) );
};

function num_keys(hash) {
	// count the number of keys in a hash
	var count = 0;
	for (var a in hash) count++;
	return count;
};

function reverse_hash(a) {
	// reverse hash keys/values
	var c = {};
	for (var key in a) {
		c[ a[key] ] = key;
	}
	return c;
};

function isa_hash(arg) {
	// determine if arg is a hash
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) == 'undefined') );
};

function isa_array(arg) {
	// determine if arg is an array or is array-like
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) != 'undefined') );
};

function first_key(hash) {
	// return first key from hash (unordered)
	for (var key in hash) return key;
	return null; // no keys in hash
};

function rand_array(arr) {
	// return random element from array
	return arr[ parseInt(Math.random() * arr.length, 10) ];
};

function find_in_array(arr, elem) {
	// return true if elem is found in arr, false otherwise
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		if (arr[idx] == elem) return true;
	}
	return false;
};

function array_to_hash_keys(arr, value) {
	// convert array to hash keys, all with the same value
	var hash = {};
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		hash[ arr[idx] ] = value;
	}
	return hash;
};

function short_float_str(num) {
	// force a float (add suffix if int)
	num = '' + short_float(num);
	if (num.match(/^\-?\d+$/)) num += ".0";
	return num;
};

function toTitleCase(str) {
	return str.toLowerCase().replace(/\b\w/g, function (txt) { return txt.toUpperCase(); });
};

function sort_by(orig, key, opts) {
	// sort array of objects by key, asc or desc, and optionally return NEW array
	// opts: { dir, type, copy }
	if (!opts) opts = {};
	if (!opts.dir) opts.dir = 1;
	if (!opts.type) opts.type = 'string';
	
	var arr = opts.copy ? Array.from(orig) : orig;
	
	arr.sort( function(a, b) {
		switch(opts.type) {
			case 'string':
				return( (''+a[key]).localeCompare(b[key]) * opts.dir );
			break;
			
			case 'number':
				return (a[key] - b[key]) * opts.dir;
			break;
		}
	} );
	
	return arr;
};

function stableSerialize(node) {
	// deep-serialize JSON with sorted keys, for comparison purposes
	if (node === null) return 'null';
	if (isa_hash(node)) {
		var json = '{';
		Object.keys(node).sort().forEach( function(key, idx) {
			if (idx) json += ',';
			json += JSON.stringify(key) + ":" + stableSerialize(node[key]);
		} );
		json += '}';
		return json;
	}
	else if (isa_array(node)) {
		var json = '[';
		node.forEach( function(item, idx) {
			if (idx) json += ',';
			json += stableSerialize(item);
		} );
		json += ']';
		return json;
	}
	else return JSON.stringify(node);
};

function stablePrettyStringify(node) {
	// generate stable (alphabetized keys) pretty-printed json
	return JSON.stringify( JSON.parse( stableSerialize(node) ), null, "\t" );
};

function inline_marked(md) {
	// render text to markdown, trimming and stripping outer <p> tag
	return marked.parseInline(md, config.ui.marked_config);
};

// Debounce Function Generator
// Fires once immediately, then never again until freq ms
function debounce(func, freq) {
	var timeout = null;
	var requestFire = false;
	
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (requestFire) {
				func.apply(context, args);
				requestFire = false;
			}
		};
		if (!timeout) {
			func.apply(context, args);
			timeout = setTimeout(later, freq);
			requestFire = false;
		}
		else {
			requestFire = true;
		}
	};
};

// Copy text to clipboard
// borrowed from: https://github.com/feross/clipboard-copy (MIT License)
function copyToClipboard(text) {
	// Put the text to copy into a <span>
	var span = document.createElement('span');
	span.textContent = text;
	
	// Preserve consecutive spaces and newlines
	span.style.whiteSpace = 'pre';
	
	// Add the <span> to the page
	document.body.appendChild(span);
	
	// Make a selection object representing the range of text selected by the user
	var selection = window.getSelection();
	var range = window.document.createRange();
	selection.removeAllRanges();
	range.selectNode(span);
	selection.addRange(range);
	
	// Copy text to the clipboard
	var success = false;
	try {
		success = window.document.execCommand('copy');
	} 
	catch (err) {
		console.log('error', err);
	}
	
	// Cleanup
	selection.removeAllRanges();
	window.document.body.removeChild(span);
};

// Support typing tabs in textarea
function captureTabs(input, event) {
	if (event.keyCode == 9) {
		event.preventDefault();
		input.setRangeText("\t", input.selectionStart, input.selectionEnd, "end");
		return false;
	}
};

// Relative Bytes Component
// create via getFormRelativeBytes()

var RelativeBytes = {
	
	mults: {
		b: 1,
		kb: 1024,
		mb: 1048576,
		gb: 1073741824,
		tb: 1099511627776
	},
	
	init: function(sel) {
		// initialize all based on selector
		var self = this;
		
		$(sel).each( function() {
			var $this = $(this);
			var $text = $this.next().find("input");
			var $menu = $this.next().find("select");
			var $both = $this.next().find("input, select");
			
			$both.on('change', function() {
				var adj_value = parseInt( $text.val() );
				if (isNaN(adj_value) || (adj_value < 0)) return;
				var unit = $menu.val();
				var mult = self.mults[ unit ];
				var value = adj_value * mult;
				$this.val( value );
			});
		});
	}
	
}; // RelativeBytes

// Simple Color Utility
// Copyright (c) 2025 Joseph Huckaby

class Color {
	
	r = 0;
	g = 0;
	b = 0;
	a = 0;
	
	constructor(color) {
		// string or object
		if (color) this.import(color);
	}
	
	clone() {
		// make a copy
		return new Color(this);
	}
	
	import(color) {
		// import color into class
		if (typeof(color) == 'string') {
			color = this.parse(color);
			if (!color) throw new Error("Failed to parse color: " + str);
		}
		for (var key in color) this[key] = color[key];
	}
	
	parse(str) {
		// parse rgb(), rgba() or #hex
		str = ('' + str).toLowerCase();
		var color = null;
		
		if (str.match(/^\#?([0-9a-f]{8})$/)) {
			// 8-color hex with alpha, e.g. AABBCCFF
			var hex = RegExp.$1;
			color = {
				r: parseInt(hex.substring(0, 2), 16),
				g: parseInt(hex.substring(2, 4), 16),
				b: parseInt(hex.substring(4, 6), 16),
				a: parseInt(hex.substring(6, 8), 16),
			};
		}
		else if (str.match(/^\#?([0-9a-f]{6})$/)) {
			// 6-color hex standard, e.g. AABBCC
			var hex = RegExp.$1;
			color = {
				r: parseInt(hex.substring(0, 2), 16),
				g: parseInt(hex.substring(2, 4), 16),
				b: parseInt(hex.substring(4, 6), 16),
				a: 255
			};
		}
		else if (str.match(/^\#?([0-9a-f]{3})$/)) {
			// 3-color hex shorthand, e.g. ABC
			var hex = RegExp.$1;
			color = {
				r: parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16),
				g: parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16),
				b: parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16),
				a: 255
			};
		}
		else if (str.match(/^rgba\(([\d\,\.\s]+)\)$/)) {
			// CSS rgba syntax, with alpha
			var csv = RegExp.$1;
			var parts = csv.split(/\,\s*/);
			color = {
				r: Math.min(255, parseInt( parts[0] || 0 )),
				g: Math.min(255, parseInt( parts[1] || 0 )),
				b: Math.min(255, parseInt( parts[2] || 0 )),
				a: Math.min(255, Math.floor( parseFloat( parts[3] || 0 ) * 255 ))
			};
		}
		else if (str.match(/^rgb\(([\d\,\.\s]+)\)$/)) {
			// CSS rgb syntax, opaque
			var csv = RegExp.$1;
			var parts = csv.split(/\,\s*/);
			color = {
				r: Math.min(255, parseInt( parts[0] || 0 )),
				g: Math.min(255, parseInt( parts[1] || 0 )),
				b: Math.min(255, parseInt( parts[2] || 0 )),
				a: 255
			};
		}
		else {
			return null;
		}
		
		return color;
	}
	
	mix(dest, amount) {
		// mix our colors with a destination color
		if (typeof(dest) == 'string') dest = new Color(dest);
		
		this.r = Math.round( this.r + ((dest.r - this.r) * amount) );
		this.g = Math.round( this.g + ((dest.g - this.g) * amount) );
		this.b = Math.round( this.b + ((dest.b - this.b) * amount) );
		this.a = Math.round( this.a + ((dest.a - this.a) * amount) );
		
		return this; // for chaining
	}
	
	hex() {
		// output color has 6-char hex string
		var rr = zeroPad( this.r.toString(16), 2 );
		var gg = zeroPad( this.g.toString(16), 2 );
		var bb = zeroPad( this.b.toString(16), 2 );
		return `#${rr}${gg}${bb}`;
	}
	
	hexa() {
		// output color as 8-char hex with alpha
		var rr = zeroPad( this.r.toString(16), 2 );
		var gg = zeroPad( this.g.toString(16), 2 );
		var bb = zeroPad( this.b.toString(16), 2 );
		var aa = zeroPad( this.a.toString(16), 2 );
		return `#${rr}${gg}${bb}${aa}`;
	}
	
	rgb() {
		// output color as CSS rgb syntax
		return `rgb(${this.r},${this.g},${this.b})`;
	}
	
	rgba() {
		// output color as CSS rgba syntax
		return `rgba(${this.r},${this.g},${this.b},${short_float(this.a / 255, 3)})`;
	}
	
}
