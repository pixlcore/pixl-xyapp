/**
 * WebApp 1.0 Page Manager
 * Author: Joseph Huckaby
 **/

//
// Page Base Class
//

window.Page = class Page {
	// 'Page' class is the abstract base class for all pages
	// Each web component calls this class daddy
	
	// methods
	constructor(config, div) {
		if (!config) return;
		
		this.ID = '';
		this.data = null;
		this.active = false;
		
		// class constructor, import config into self
		this.data = {};
		if (!config) config = {};
		for (var key in config) this[key] = config[key];
		
		this.div = div || $('#page_' + this.ID);
		assert(this.div, "Cannot find page div: page_" + this.ID);
		
		this.tab = $('#tab_' + this.ID);
	}
	
	onInit() {
		// called with the page is initialized
	}
	
	onActivate() {
		// called when page is activated
		return true;
	}
	
	onDeactivate() {
		// called when page is deactivated
		return true;
	}
	
	show() {
		// show page
		this.div.show();
	}
	
	hide() {
		this.div.hide();
	}
	
	gosub(anchor) {
		// go to sub-anchor (article section link)
	}
	
	getFormRow(args) {
		// render form row using CSS grid elements
		// add localized strings and markdown captions
		var html = '';
		
		// pull in args from localized ui config (for label, caption, etc.)
		if (args.id && config.ui.dom[args.id]) {
			for (var key in config.ui.dom[args.id]) {
				if (!args[key]) args[key] = config.ui.dom[args.id][key];
			}
		}
		else if (args.id && config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) {
			for (var key in config.ui.pages[this.ID][args.id]) {
				if (!args[key]) args[key] = config.ui.pages[this.ID][args.id][key];
			}
		}
		
		var label = args.label;
		var content = args.content;
		var suffix = args.suffix;
		var caption = args.caption;
		var extra_classes = args.class || '';
		
		delete args.label;
		delete args.content;
		delete args.suffix;
		delete args.caption;
		delete args.class;
		
		html += '<div class="form_row ' + extra_classes + '" ' + compose_attribs(args) + '>';
		if (label) html += '<div class="fr_label">' + label + '</div>';
		if (content) html += '<div class="fr_content" aria-label="' + label + '">' + content + '</div>';
		if (suffix) html += '<div class="fr_suffix">' + suffix + '</div>';
		if (caption) html += '<div class="fr_caption"><span>' + inline_marked(caption) + '</span></div>'; // markdown
		html += '</div>';
		
		return html;
	}
	
	getFormText(args) {
		// render text field for form
		if (!args.type) args.type = 'text';
		if (args.disabled) args.disabled = "disabled";
		else delete args.disabled;
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		// stupid hack for safari (autofill bug)
		if (app.safari && (args.autocomplete === 'off')) {
			args.readonly = 'readonly';
			args.onfocus = "this.removeAttribute('readonly')";
			args.onblur = "this.setAttribute('readonly','readonly')";
		}
		
		return '<input ' + compose_attribs(args) + '/>';
	}
	
	getFormTextarea(args) {
		// render textarea field for form
		var value = ('value' in args) ? args.value : '';
		delete args.value;
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		return '<textarea ' + compose_attribs(args) + '>' + encode_entities(value) + '</textarea>';
	}
	
	getFormCheckbox(args) {
		// render checkbox for form
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var label = args.label || '';
		delete args.label;
		
		if (args.auto) {
			args.checked = app.getPref(args.auto);
			args['onChange'] = "app.setPref('" + args.auto + "',$(this).is(':checked'))";
			delete args.auto;
		}
		
		if (args.checked) args.checked = "checked";
		else delete args.checked;
		
		if (args.disabled) args.disabled = "disabled";
		else delete args.disabled;
		
		if (!('value' in args)) args.value = 1;
		
		html += '<div class="checkbox_container">';
		html += '<input type="checkbox" ' + compose_attribs(args) + '/>';
		html += '<label for="' + (args.id || '') + '">' + label + '</label>';
		html += '</div>';
		
		return html;
	}
	
	getFormMenu(args) {
		// render menu for form
		var html = '';
		html += '<div class="select_chevron mdi mdi-chevron-down" style="top:7px;"></div>';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var opts = args.options;
		if (isa_hash(args.options)) {
			// convert hash to array
			opts = Object.keys(args.options).map( function(key) {
				return { id: key, title: args.options[key] };
			} );
		}
		delete args.options;
		
		var value = args.value || '';
		delete args.value;
		
		var auto_add = args.auto_add || false;
		delete args.auto_add;
		
		html += '<select ' + compose_attribs(args) + '>';
		html += render_menu_options( opts, value, auto_add );
		html += '</select>';
		
		return html;
	}
	
	getFormMenuMulti(args) {
		// render multi-select menu for form
		var html = '';
		var opt_values = [];
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var opts = deep_copy_object(args.options);
		delete args.options;
		
		var values = args.values || [];
		delete args.values;
		
		var auto_add = args.auto_add || false;
		delete args.auto_add;
		
		if (args.default_icon) {
			opts.forEach( function(item) {
				if (!item.icon) item.icon = args.default_icon;
			} );
			delete args.default_icon;
		}
		
		html += '<select multiple ' + compose_attribs(args) + '>';
		for (var idx = 0, len = opts.length; idx < len; idx++) {
			var item = opts[idx];
			var item_name = '';
			var item_value = '';
			var attribs = {};
			
			if (isa_hash(item)) {
				if (('label' in item) && ('data' in item)) {
					item_name = item.label;
					item_value = item.data;
				}
				else {
					item_name = item.title;
					item_value = item.id;
				}
				if (item.icon) attribs['data-icon'] = item.icon;
				if (item.abbrev) attribs['data-abbrev'] = item.abbrev;
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
			if (find_in_array(values, item_value)) attribs.selected = 'selected';
			html += '<option ' + compose_attribs(attribs) + '>' + item_name + '</option>';
			opt_values.push( item_value );
		} // foreach opt
		
		if (auto_add) {
			values.forEach( function(value) {
				if (!find_in_array(opt_values, value)) {
					html += '<option value="' + encode_attrib_entities(value) + '" selected="selected">' + value + '</option>';
				}
			} );
		} // auto-add
		
		html += '</select>';
		return html;
	}
	
	getFormMenuSingle(args) {
		// render single-select menu for form
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var opts = deep_copy_object(args.options);
		delete args.options;
		
		var value = args.value || '';
		delete args.value;
		
		var auto_add = args.auto_add || false;
		delete args.auto_add;
		
		if (args.default_icon) {
			opts.forEach( function(item) {
				if (!item.icon) item.icon = args.default_icon;
			} );
			delete args.default_icon;
		}
		
		html += '<select ' + compose_attribs(args) + '>';
		html += render_menu_options( opts, value, auto_add );
		html += '</select>';
		
		return html;
	}
	
	getFormFieldset(args) {
		// get fieldset for form
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var legend = ('legend' in args) ? args.legend : '';
		delete args.legend;
		
		var content = args.content;
		delete args.content;
		
		return '<fieldset ' + compose_attribs(args) + '><legend>' + legend + '</legend>' + content + '</fieldset>';
	}
	
	getFieldsetInfoGroup(args) {
		// get info group pair for fieldset in form
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		if ('label' in args) html += '<div class="info_label">' + args.label + '</div>';
		if ('content' in args) html += '<div class="info_value">' + args.content + '</div>';
		return html;
	}
	
	getFormFile(args) {
		// render file field for form
		if (!args.type) args.type = 'file';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		return '<input ' + compose_attribs(args) + '/>';
	}
	
	getFormDate(args) {
		// render custom date field for form
		// coerce value into epoch
		if (!args.value) args.value = 0;
		else if (!args.value.toString().match(/^\d+$/)) {
			args.value = get_date_args(args.value).epoch;
		}
		if (!args.type) args.type = 'hidden';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		return '<input ' + compose_attribs(args) + '/><div class="form_date"></div>';
	}
	
	getFormRelativeTime(args) {
		// render custom relative sec/min/hour/day/week/month/year selector
		// value is always seconds, everything else is just UI sugar
		if (!args.value) args.value = 0;
		var adj_value = args.value;
		var unit = 'seconds';
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var units = [
			{ id: 'seconds', title: 'Seconds', mult: 1     },
			{ id: 'minutes', title: 'Minutes', mult: 60    },
			{ id: 'hours',   title: 'Hours',   mult: 3600  },
			{ id: 'days',    title: 'Days',    mult: 86400 }
		];
		
		if (adj_value && ((adj_value % 86400) == 0)) {
			adj_value = adj_value /= 86400;
			unit = 'days';
		}
		else if (adj_value && ((adj_value % 3600) == 0)) {
			adj_value = adj_value /= 3600;
			unit = 'hours';
		}
		else if (adj_value && ((adj_value % 60) == 0)) {
			adj_value = adj_value /= 60;
			unit = 'minutes';
		}
		
		if (!args.type) args.type = 'hidden';
		html += '<input ' + compose_attribs(args) + '/>';
		
		html += '<div class="form_row_duo">';
			html += '<div>' + this.getFormText({ id: args.id + '_val', type: 'number', min: 0, value: adj_value }) + '</div>';
			html += '<div>' + this.getFormMenu({ id: args.id + '_mul', options: units, value: unit }) + '</div>';
		html += '</div>';
		
		return html;
	}
	
	getFormRelativeBytes(args) {
		// render custom relative bytes/kb/mb/gb/tb selector
		// value is always bytes, everything else is just UI sugar
		if (!args.value) args.value = 0;
		var adj_value = args.value;
		var unit = 'b';
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		var units = [
			{ id: 'b',  title: 'Bytes',     mult: 1 },
			{ id: 'kb', title: 'Kilobytes', mult: 1024 },
			{ id: 'mb', title: 'Megabytes', mult: 1048576 },
			{ id: 'gb', title: 'Gigabytes', mult: 1073741824 },
			{ id: 'tb', title: 'Terabytes', mult: 1099511627776 }
		];
		
		if (adj_value && ((adj_value % 1099511627776) == 0)) {
			adj_value = adj_value /= 1099511627776;
			unit = 'tb';
		}
		else if (adj_value && ((adj_value % 1073741824) == 0)) {
			adj_value = adj_value /= 1073741824;
			unit = 'gb';
		}
		else if (adj_value && ((adj_value % 1048576) == 0)) {
			adj_value = adj_value /= 1048576;
			unit = 'mb';
		}
		else if (adj_value && ((adj_value % 1024) == 0)) {
			adj_value = adj_value /= 1024;
			unit = 'kb';
		}
		
		if (!args.type) args.type = 'hidden';
		html += '<input ' + compose_attribs(args) + '/>';
		
		html += '<div class="form_row_duo">';
			html += '<div>' + this.getFormText({ id: args.id + '_val', type: 'number', value: adj_value }) + '</div>';
			html += '<div>' + this.getFormMenu({ id: args.id + '_mul', options: units, value: unit }) + '</div>';
		html += '</div>';
		
		return html;
	}
	
	getFormRange(args) {
		// render custom range slider with visible number value on right side
		if (!args.value) args.value = 0;
		var html = '';
		
		// pull in args from localized ui config
		if (args.id) {
			if (config.ui.dom[args.id]) merge_hash_into( args, config.ui.dom[args.id] );
			else if (config.ui.pages[this.ID] && config.ui.pages[this.ID][args.id]) merge_hash_into( args, config.ui.pages[this.ID][args.id] );
		}
		
		if (args.onInput) args.onInput += ';'; else args.onInput = '';
		args.onInput += `$P().updateFormRange(this)`;
		
		html += '<div class="form_row_range">';
			html += '<div>' + this.getFormText( merge_objects(args, { type: 'range' }) ) + '</div>';
			html += '<div>' + this.getFormText( merge_objects(args, { id: args.id + '_txt', type: 'number' }) ) + '</div>';
		html += '</div>';
		
		return html;
	}
	
	updateFormRange(elem) {
		// keep range and text field in sync with each other
		var value = elem.value;
		$(elem).closest('.form_row_range').find('input').val(value);
	}
	
	getPaginatedTable() {
		// get html for paginated table
		// dual-calling convention: (resp, cols, data_type, callback) or (args)
		var args = null;
		if (arguments.length == 1) {
			// custom args calling convention
			args = arguments[0];
			
			// V2 API
			if (!args.resp && args.rows && args.total) {
				args.resp = {
					rows: args.rows,
					list: { length: args.total }
				};
			}
		}
		else {
			// classic calling convention
			args = {
				resp: arguments[0],
				cols: arguments[1],
				data_type: arguments[2],
				callback: arguments[3],
				limit: this.args.limit,
				offset: this.args.offset || 0
			};
		}
		
		var resp = args.resp;
		var cols = args.cols;
		var data_type = args.data_type;
		var callback = args.callback;
		var cpl = args.pagination_link || '';
		var html = '';
		
		// pagination header
		html += '<div class="pagination">';
		html += '<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr>';
		
		var results = {
			limit: args.limit,
			offset: args.offset || 0,
			total: resp.list.length
		};
		
		var num_pages = Math.floor( results.total / results.limit ) + 1;
		if (results.total % results.limit == 0) num_pages--;
		var current_page = Math.floor( results.offset / results.limit ) + 1;
		
		html += '<td align="left" width="33%">';
		html += commify(results.total) + ' ' + pluralize(data_type, results.total) + ' found';
		html += '</td>';
		
		html += '<td align="center" width="34%">';
		if (num_pages > 1) html += 'Page ' + commify(current_page) + ' of ' + commify(num_pages);
		else html += '&nbsp;';
		html += '</td>';
		
		html += '<td align="right" width="33%">';
		
		if (num_pages > 1) {
			// html += 'Page: ';
			if (current_page > 1) {
				if (cpl) {
					html += '<span class="link" onClick="'+cpl+'('+Math.floor((current_page - 2) * results.limit)+')">&laquo; Prev</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page - 2) * results.limit
					})) + '">&laquo; Prev</a>';
				}
			}
			html += '&nbsp;&nbsp;&nbsp;';

			var start_page = current_page - 4;
			var end_page = current_page + 5;

			if (start_page < 1) {
				end_page += (1 - start_page);
				start_page = 1;
			}

			if (end_page > num_pages) {
				start_page -= (end_page - num_pages);
				if (start_page < 1) start_page = 1;
				end_page = num_pages;
			}

			for (var idx = start_page; idx <= end_page; idx++) {
				if (idx == current_page) {
					html += '<b>' + commify(idx) + '</b>';
				}
				else {
					if (cpl) {
						html += '<span class="link" onClick="'+cpl+'('+Math.floor((idx - 1) * results.limit)+')">' + commify(idx) + '</span>';
					}
					else {
						html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
							offset: (idx - 1) * results.limit
						})) + '">' + commify(idx) + '</a>';
					}
				}
				html += '&nbsp;';
			}

			html += '&nbsp;&nbsp;';
			if (current_page < num_pages) {
				if (cpl) {
					html += '<span class="link" onClick="'+cpl+'('+Math.floor((current_page + 0) * results.limit)+')">Next &raquo;</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page + 0) * results.limit
					})) + '">Next &raquo;</a>';
				}
			}
		} // more than one page
		else {
			html += 'Page 1 of 1';
		}
		html += '</td>';
		html += '</tr></table>';
		html += '</div>';
		
		html += '<div style="margin-top:5px; overflow-x:auto;">';
		
		var tattrs = args.attribs || {};
		if (!tattrs.class) tattrs.class = 'data_table ellip';
		if (!tattrs.width) tattrs.width = '100%';
		html += '<table ' + compose_attribs(tattrs) + '>';
		
		html += '<tr><th>' + cols.join('</th><th>').replace(/\s+/g, '&nbsp;') + '</th></tr>';
		
		for (var idx = 0, len = resp.rows.length; idx < len; idx++) {
			var row = resp.rows[idx];
			var tds = callback(row, idx);
			if (tds) {
				html += '<tr' + (tds.className ? (' class="'+tds.className+'"') : '') + '>';
				html += '<td>' + tds.join('</td><td>') + '</td>';
				html += '</tr>';
			}
		} // foreach row
		
		if (!resp.rows.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			html += 'No '+pluralize(data_type)+' found.';
			html += '</td></tr>';
		}
		
		html += '</table>';
		html += '</div>';
		
		return html;
	}
	
	getPaginatedGrid() {
		// get html for paginated grid
		// multi-calling convention: (resp, cols, data_type, callback), or (args, callback), or (args)
		var args = null;
		if (arguments.length == 1) {
			// custom args calling convention
			args = arguments[0];
			
			// V2 API
			if (!args.resp && args.rows && args.total) {
				args.resp = {
					rows: args.rows,
					list: { length: args.total }
				};
			}
		}
		else if (arguments.length == 2) {
			// combo args + callback
			args = arguments[0];
			args.callback = arguments[1];
		}
		else {
			// classic calling convention
			args = {
				resp: arguments[0],
				cols: arguments[1],
				data_type: arguments[2],
				callback: arguments[3],
				limit: this.args.limit,
				offset: this.args.offset || 0
			};
		}
		
		var resp = args.resp;
		var rows = resp.rows;
		var cols = args.cols;
		var data_type = args.data_type;
		var callback = args.callback;
		var cpl = args.pagination_link || '';
		var html = '';
		
		// pagination header
		html += '<div class="data_grid_pagination">';
		
		var results = {
			limit: args.limit,
			offset: args.offset || 0,
			total: resp.list.length
		};
		
		var num_pages = Math.floor( results.total / results.limit ) + 1;
		if (results.total % results.limit == 0) num_pages--;
		var current_page = Math.floor( results.offset / results.limit ) + 1;
		
		html += '<div style="text-align:left">';
		html += commify(results.total) + ' ' + pluralize(data_type, results.total) + '<span class="sm_hide">&nbsp;found</span>';
		html += '</div>';
		
		html += '<div style="text-align:center">';
		if (num_pages > 1) html += 'Page ' + commify(current_page) + ' of ' + commify(num_pages);
		else html += '&nbsp;';
		html += '</div>';
		
		html += '<div style="text-align:right">';
		
		if (num_pages > 1) {
			// html += 'Page: ';
			if (current_page > 1) {
				if (cpl) {
					html += '<span class="link" onClick="'+cpl+'('+Math.floor((current_page - 2) * results.limit)+')">&laquo; Prev</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page - 2) * results.limit
					})) + '">&laquo; Prev</a>';
				}
			}
			html += '&nbsp;&nbsp;&nbsp;';
			
			var start_page = current_page - 4;
			var end_page = current_page + 5;
			
			if (start_page < 1) {
				end_page += (1 - start_page);
				start_page = 1;
			}
			
			if (end_page > num_pages) {
				start_page -= (end_page - num_pages);
				if (start_page < 1) start_page = 1;
				end_page = num_pages;
			}
			
			html += '<span class="sm_hide">';
			for (var idx = start_page; idx <= end_page; idx++) {
				if (idx == current_page) {
					html += '<b>' + commify(idx) + '</b>';
				}
				else {
					if (cpl) {
						html += '<span class="link" onClick="'+cpl+'('+Math.floor((idx - 1) * results.limit)+')">' + commify(idx) + '</span>';
					}
					else {
						html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
							offset: (idx - 1) * results.limit
						})) + '">' + commify(idx) + '</a>';
					}
				}
				html += '&nbsp;';
			}
			html += '&nbsp;&nbsp;';
			html += '</span>';
			
			if (current_page < num_pages) {
				if (cpl) {
					html += '<span class="link" onClick="'+cpl+'('+Math.floor((current_page + 0) * results.limit)+')">Next &raquo;</span>';
				}
				else {
					html += '<a href="#' + this.ID + compose_query_string(merge_objects(this.args, {
						offset: (current_page + 0) * results.limit
					})) + '">Next &raquo;</a>';
				}
			}
		} // more than one page
		else {
			html += 'Page 1 of 1';
		}
		html += '</div>'; // right 3rd
		html += '</div>'; // pagination
		
		html += '<div style="margin-top:5px;">';
		
		var tattrs = args.attribs || {};
		if (args.class) tattrs.class = args.class;
		if (!tattrs.class) {
			tattrs.class = 'data_grid';
			if (data_type.match(/^\w+$/)) tattrs.class += ' ' + data_type + '_grid';
		}
		if (!tattrs.style) tattrs.style = '';
		
		if (args.grid_template_columns) tattrs.style += 'grid-template-columns: ' + args.grid_template_columns + ';';
		else tattrs.style += 'grid-template-columns: repeat(' + cols.length + ', auto);';
		
		html += '<div ' + compose_attribs(tattrs) + '>';
		
		html += '<ul class="grid_row_header"><div>' + cols.join('</div><div>') + '</div></ul>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<ul class="grid_row ' + (tds.className || '') + '"' + (row.id ? (' data-id="'+row.id+'"') : '') + '>';
			html += '<div>' + tds.join('</div><div>') + '</div>';
			html += '</ul>';
		} // foreach row
		
		if (!rows.length) {
			html += '<ul class="grid_row_empty"><div style="grid-column-start: span ' + cols.length + ';">';
			if (args.empty_msg) html += args.empty_msg;
			else html += 'No '+pluralize(data_type)+' found.';
			html += '</div></ul>';
		}
		
		if (args.below) html += args.below;
		
		html += '</div>'; // scroll wrapper
		html += '</div>'; // grid
		
		return html;
	}
	
	getBasicTable() {
		// get html for sorted table (fake pagination, for looks only)
		var html = '';
		var args = null;
		
		if (arguments.length == 1) {
			// custom args calling convention
			args = arguments[0];
		}
		else {
			// classic calling convention
			args = {
				rows: arguments[0],
				cols: arguments[1],
				data_type: arguments[2],
				callback: arguments[3]
			};
		}
		
		var rows = args.rows;
		var cols = args.cols;
		var data_type = args.data_type;
		var callback = args.callback;
		
		// pagination
		if (!args.compact) {
			html += '<div class="pagination">';
			html += '<table cellspacing="0" cellpadding="0" border="0" width="100%"><tr>';
			
			html += '<td align="left" width="33%">';
			if (cols.headerLeft) html += cols.headerLeft;
			else html += commify(rows.length) + ' ' + pluralize(data_type, rows.length) + '';
			html += '</td>';
			
			html += '<td align="center" width="34%">';
				html += cols.headerCenter || '&nbsp;';
			html += '</td>';
			
			html += '<td align="right" width="33%">';
				html += cols.headerRight || 'Page 1 of 1';
			html += '</td>';
			
			html += '</tr></table>';
			html += '</div>';
		}
		
		html += '<div style="margin-top:5px; overflow-x:auto;">';
		
		var tattrs = args.attribs || {};
		if (!tattrs.class) tattrs.class = 'data_table ellip';
		if (!tattrs.width) tattrs.width = '100%';
		html += '<table ' + compose_attribs(tattrs) + '>';
		
		html += '<tr><th style="white-space:nowrap;">' + cols.join('</th><th style="white-space:nowrap;">') + '</th></tr>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<tr' + (tds.className ? (' class="'+tds.className+'"') : '') + (row.id ? (' data-id="'+row.id+'"') : '') + '>';
			html += '<td>' + tds.join('</td><td>') + '</td>';
			html += '</tr>';
		} // foreach row
		
		if (!rows.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			if (args.empty_msg) html += args.empty_msg;
			else html += 'No '+pluralize(data_type)+' found.';
			html += '</td></tr>';
		}
		
		html += '</table>';
		html += '</div>';
		
		return html;
	}
	
	getCompactTable(args, callback) {
		// get html for compact table (sans pagination)
		var html = '';
		
		var rows = args.rows;
		var cols = args.cols;
		var data_type = args.data_type;
		
		html += '<div class="data_table_compact" style="margin-top:5px; overflow-x:auto;">';
		
		var tattrs = args.attribs || {};
		if (!tattrs.class) tattrs.class = 'data_table compact';
		if (!tattrs.width) tattrs.width = '100%';
		html += '<table ' + compose_attribs(tattrs) + '>';
		
		html += '<tr><th style="white-space:nowrap;">' + cols.join('</th><th style="white-space:nowrap;">') + '</th></tr>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<tr' + (tds.className ? (' class="'+tds.className+'"') : '') + (row.id ? (' data-id="'+row.id+'"') : '') + '>';
			html += '<td>' + tds.join('</td><td>') + '</td>';
			html += '</tr>';
		} // foreach row
		
		if (!rows.length) {
			html += '<tr><td colspan="'+cols.length+'" align="center" style="padding-top:10px; padding-bottom:10px; font-weight:bold;">';
			if (args.empty_msg) html += args.empty_msg;
			else html += 'No '+pluralize(data_type)+' found.';
			html += '</td></tr>';
		}
		else if (args.append) {
			html += args.append;
		}
		
		html += '</table>';
		if (args.below) html += args.below;
		html += '</div>';
		
		return html;
	}
	
	getCompactGrid(args, callback) {
		// get html for compact grid table (sans pagination)
		// args: { rows, cols, data_type, attribs?, class?, style?, grid_template_columns?, empty_msg?, always_append_empty_msg?, below? }
		var html = '';
		var rows = args.rows;
		var cols = args.cols;
		var data_type = args.data_type;
		
		html += '<div class="data_table_compact" style="margin-top:5px;">';
		
		var tattrs = args.attribs || {};
		if (args.class) tattrs.class = args.class;
		if (!tattrs.class) {
			tattrs.class = 'data_grid';
			if (data_type.match(/^\w+$/)) tattrs.class += ' ' + data_type + '_grid';
		}
		if (!tattrs.style) tattrs.style = '';
		
		if (args.grid_template_columns) tattrs.style += 'grid-template-columns: ' + args.grid_template_columns + ';';
		else tattrs.style += 'grid-template-columns: repeat(' + cols.length + ', auto);';
		
		html += '<div ' + compose_attribs(tattrs) + '>';
		
		html += '<ul class="grid_row_header"><div>' + cols.join('</div><div>') + '</div></ul>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<ul class="grid_row ' + (tds.className || '') + '"' + (row.id ? (' data-id="'+row.id+'"') : '') + '>';
			html += '<div>' + tds.join('</div><div>') + '</div>';
			html += '</ul>';
		} // foreach row
		
		if (!rows.length || (args.empty_msg && args.always_append_empty_msg)) {
			html += '<ul class="grid_row_empty"><div style="grid-column-start: span ' + cols.length + ';">';
			if (args.empty_msg) html += args.empty_msg;
			else html += 'No '+pluralize(data_type)+' found.';
			html += '</div></ul>';
		}
		
		if (args.below) html += args.below;
		
		html += '</div>'; // grid
		html += '</div>'; // data_table_compact
		
		return html;
	}
	
	getBasicGrid() {
		// get html for sorted grid table (fake pagination, for looks only)
		var html = '';
		var args = null;
		
		if (arguments.length == 1) {
			// custom args calling convention
			args = arguments[0];
		}
		else if (arguments.length == 2) {
			// combo args + callback
			args = arguments[0];
			args.callback = arguments[1];
		}
		else {
			// classic calling convention
			args = {
				rows: arguments[0],
				cols: arguments[1],
				data_type: arguments[2],
				callback: arguments[3]
			};
		}
		
		var rows = args.rows;
		var cols = args.cols;
		var data_type = args.data_type;
		var callback = args.callback;
		
		if (!args.hide_pagination) {
			// pagination
			html += '<div class="data_grid_pagination">';
			
				html += '<div style="text-align:left">';
				if (cols.headerLeft) html += cols.headerLeft;
				else html += commify(rows.length) + ' ' + pluralize(data_type, rows.length) + '';
				html += '</div>';
				
				html += '<div style="text-align:center">';
					html += cols.headerCenter || '&nbsp;';
				html += '</div>';
				
				html += '<div style="text-align:right">';
					html += cols.headerRight || 'Page 1 of 1';
				html += '</div>';
			
			html += '</div>';
			
			html += '<div style="margin-top:5px;">';
		}
		else {
			// no pagination
			html += '<div>';
		}
		
		var tattrs = args.attribs || {};
		if (args.class) tattrs.class = args.class;
		if (!tattrs.class) {
			tattrs.class = 'data_grid';
			if (data_type.match(/^\w+$/)) tattrs.class += ' ' + data_type + '_grid';
		}
		if (!tattrs.style) tattrs.style = '';
		
		if (args.grid_template_columns) tattrs.style += 'grid-template-columns: ' + args.grid_template_columns + ';';
		else tattrs.style += 'grid-template-columns: repeat(' + cols.length + ', auto);';
		
		html += '<div ' + compose_attribs(tattrs) + '>';
		
		html += '<ul class="grid_row_header"><div>' + cols.join('</div><div>') + '</div></ul>';
		
		for (var idx = 0, len = rows.length; idx < len; idx++) {
			var row = rows[idx];
			var tds = callback(row, idx);
			if (tds.insertAbove) html += tds.insertAbove;
			html += '<ul class="grid_row ' + (tds.className || '') + '"' + (row.id ? (' data-id="'+row.id+'"') : '') + '>';
			html += '<div>' + tds.join('</div><div>') + '</div>';
			html += '</ul>';
		} // foreach row
		
		if (!rows.length) {
			html += '<ul class="grid_row_empty"><div style="grid-column-start: span ' + cols.length + ';">';
			if (args.empty_msg) html += args.empty_msg;
			else html += 'No '+pluralize(data_type)+' found.';
			html += '</div></ul>';
		}
		
		if (args.below) html += args.below;
		
		html += '</div>'; // scroll wrapper
		html += '</div>'; // grid
		
		return html;
	}
	
	requireLogin(args) {
		// user must be logged into to continue
		var self = this;
		
		if (!app.user) {
			// require login
			app.navAfterLogin = this.ID;
			if (args && num_keys(args)) app.navAfterLogin += compose_query_string(args);
			
			this.div.hide();
			
			app.api.post( 'user/resume_session', {}, function(resp) {
				if (resp.user) {
					Debug.trace("User Session Resume: " + resp.username);
					Dialog.hideProgress();
					app.doUserLogin( resp );
					Nav.refresh();
				}
				else {
					Debug.trace("User cookie is invalid, redirecting to login page");
					app.setPref('username', '');
					setTimeout( function() { Nav.go('Login'); }, 1 );
				}
			} );
			
			return false;
		}
		return true;
	}
	
	hasPrivilege(priv_id) {
		// check if user has privilege
		if (!app.user || !app.user.privileges) return false;
		if (app.user.privileges.admin) return true;
		return( !!app.user.privileges[priv_id] );
	}
	
	requireAnyPrivilege(...privs) {
		// check if user has priv, show full page error if not
		var privs_matched = privs.filter( (priv_id) => this.hasPrivilege(priv_id) ).length;
		if (!privs_matched) {
			this.doFullPageError("Your account does not have the required privileges to access this page.");
			return false;
		}
		return true;
	}
	
	isAdmin() {
		// return true if user is logged in and admin, false otherwise
		// Note: This is used for UI decoration ONLY -- all privileges are checked on the server
		return( app.user && app.user.privileges && app.user.privileges.admin );
	}
	
	getNiceAPIKey(item, link) {
		if (!item) return 'n/a';
		var key = item.api_key || item.key;
		var title = item.api_title || item.title;
		
		var html = '';
		var icon = '<i class="mdi mdi-key">&nbsp;</i>';
		if (link) {
			if (link === true) link = '#APIKeys?sub=edit&id=' + item.id;
			html += '<a href="' + link + '" style="text-decoration:none">';
			html += icon + '<span style="text-decoration:underline">' + title + '</span></a>';
		}
		else {
			html += icon + title;
		}
		
		return html;
	}
	
	getNiceUsername(user, link) {
		if (!user) return 'n/a';
		if ((typeof(user) == 'object') && (user.key || user.api_title)) {
			return this.getNiceAPIKey(user, link);
		}
		var username = user.username ? user.username : user;
		if (!username || (typeof(username) != 'string')) return 'n/a';
		
		var html = '';
		var icon = '<i class="mdi mdi-account">&nbsp;</i>';
		if (link) {
			if (link === true) link = '#Users?sub=edit&username=' + username;
			html += '<a href="' + link + '" style="text-decoration:none">';
			html += icon + '<span style="text-decoration:underline">' + username + '</span></a>';
		}
		else {
			html += icon + username;
		}
		
		return html;
	}
	
	getNiceEnvironment(item, link) {
		// get formatted env with icon, plus optional link
		if (!item) return '(None)';
		
		var html = '';
		var icon = '<i class="mdi mdi-wan">&nbsp;</i>';
		if (link) {
			if (link === true) link = '#Environments?sub=edit&id=' + item.id;
			html += '<a href="' + link + '" style="text-decoration:none">';
			html += icon + '<span style="text-decoration:underline">' + item.title + '</span></a>';
		}
		else {
			html += icon + item.title;
		}
		
		return html;
	}
	
	getNiceGroupList(groups, glue, max) {
		// get formatted group list
		var self = this;
		if (!glue) glue = ', ';
		if (typeof(groups) == 'string') groups = groups.split(/\,\s*/);
		if (!groups || !groups.length) return '(None)';
		if (max && (groups.length > max)) {
			var extras = groups.length - max;
			groups = groups.slice(0, max);
			return groups.map( function(group) { return self.getNiceGroup(group); } ).join(glue) + glue + ' and ' + extras + ' more';
		}
		return groups.map( function(group) { return self.getNiceGroup(group); } ).join(glue);
	}
	
	getNiceGroup(item, link) {
		// get formatted group with icon, plus optional link
		if (!item) return '(None)';
		
		var html = '';
		var icon = '<i class="mdi mdi-server-network">&nbsp;</i>';
		if (link) {
			if (link === true) link = '#Groups?sub=edit&id=' + item.id;
			html += '<a href="' + link + '" style="text-decoration:none">';
			html += icon + '<span style="text-decoration:underline">' + item.title + '</span></a>';
		}
		else {
			html += icon + item.title;
		}
		
		return html;
	}
	
	setGroupVisible(group, visible) {
		// set web groups of form fields visible or invisible, 
		// according to master checkbox for each section
		var selector = 'tr.' + group + 'group';
		if (visible) {
			if ($(selector).hasClass('collapse')) {
				$(selector).hide().removeClass('collapse');
			}
			$(selector).show(250);
		}
		else $(selector).hide(250);
		
		return this; // for chaining
	}
	
	checkUserExists(field) {
		// check if user exists, update UI checkbox
		// called after field changes
		var self = this;
		var $field = $(field);
		var username = trim( $field.val().toLowerCase() );
		var $elem = $field.closest('.form_row').find('.fr_suffix .checker');
		
		if (username.match(/^[\w\-\.]+$/)) {
			// check with user list
			if (find_object( app.users, { username })) {
				// username taken
				$elem.css('color','red').html('<span class="mdi mdi-alert-circle"></span>').attr('title', "Username is taken.");
				$field.addClass('warning');
			}
			else {
				// username is valid and available!
				$elem.css('color','green').html('<span class="mdi mdi-check-circle"></span>').attr('title', "Username available!");
				$field.removeClass('warning');
			}
		}
		else if (username.length) {
			// bad username
			$elem.css('color','red').html('<span class="mdi mdi-alert-decagram"></span>').attr('title', "Username is malformed.");
			$field.addClass('warning');
		}
		else {
			// empty
			$elem.html('').removeAttr('title');
			$field.removeClass('warning');
		}
	}
	
	checkAddRemoveMe(sel) {
		// check if user's e-mail is contained in text field or not
		// expects sel to point to the input
		var $elem = $(sel);
		var value = $elem.val().toLowerCase();
		var email = app.user.email.toLowerCase();
		var regexp = new RegExp( "\\b" + escape_regexp(email) + "\\b" );
		return !!value.match(regexp);
	}
	
	updateAddRemoveMe(sel) {
		// update add/remove me text based on if user's e-mail is contained in text field
		// expects sel to point to the input(s)
		var self = this;
		
		$(sel).each( function() {
			var $elem = $(this);
			var $suffix = $elem.closest('div.form_row').find('div.form_suffix_icon');
			
			if (self.checkAddRemoveMe(this)) {
				$suffix.removeClass('mdi-account-plus').addClass('mdi-account-minus').attr('title', "Remove Me");
			}
			else {
				$suffix.removeClass('mdi-account-minus').addClass('mdi-account-plus').attr('title', "Add Me");
			}
		} );
	}
	
	addRemoveMe(sel) {
		// toggle user's e-mail in/out of text field
		// expects sel to point to the div.form_suffix_icon
		var $suffix = $(sel);
		var $elem = $suffix.closest('div.form_row').find('input');
		var value = trim( $elem.val().replace(/\,\s*\,/g, ',').replace(/^\s*\,\s*/, '').replace(/\s*\,\s*$/, '') );
		
		if (this.checkAddRemoveMe( $elem[0] )) {
			// remove e-mail
			var email = app.user.email.toLowerCase();
			var regexp = new RegExp( "\\b" + escape_regexp(email) + "\\b", "i" );
			value = value.replace( regexp, '' ).replace(/\,\s*\,/g, ',').replace(/^\s*\,\s*/, '').replace(/\s*\,\s*$/, '');
			$elem.val( trim(value) );
		}
		else {
			// add email
			if (value) value += ', ';
			$elem.val( value + app.user.email );
		}
		
		this.updateAddRemoveMe( $elem[0] );
	}
	
	get_custom_combo_unit_box(id, value, items, class_name) {
		// get HTML for custom combo text/menu, where menu defines units of measurement
		// items should be array for use in render_menu_options(), with an increasing numerical value
		if (!class_name) class_name = 'std_combo_unit_table';
		var units = 0;
		var value = parseInt( value || 0 );
		
		for (var idx = items.length - 1; idx >= 0; idx--) {
			var max = items[idx][0];
			if ((value >= max) && (value % max == 0)) {
				units = max;
				value = Math.floor( value / units );
				idx = -1;
			}
		}
		if (!units) {
			// no exact match, so default to first unit in list
			units = items[0][0];
			value = Math.floor( value / units );
		}
		
		return (
			'<table cellspacing="0" cellpadding="0" class="'+class_name+'"><tr>' + 
				'<td style="padding:0"><input type="text" id="'+id+'" style="width:30px;" value="'+value+'"/></td>' + 
				'<td style="padding:0"><select id="'+id+'_units">' + render_menu_options(items, units) + '</select></td>' + 
			'</tr></table>' 
		);
	}
	
	get_relative_time_combo_box(id, value, class_name, inc_seconds) {
		// get HTML for combo textfield/menu for a relative time based input
		// provides Minutes, Hours and Days units
		var unit_items = [[60,'Minutes'], [3600,'Hours'], [86400,'Days']];
		if (inc_seconds) unit_items.unshift( [1,'Seconds'] );
		
		return this.get_custom_combo_unit_box( id, value, unit_items, class_name );
	}
	
	get_relative_size_combo_box(id, value, class_name) {
		// get HTML for combo textfield/menu for a relative size based input
		// provides MB, GB and TB units
		var TB = 1024 * 1024 * 1024 * 1024;
		var GB = 1024 * 1024 * 1024;
		var MB = 1024 * 1024;
		
		return this.get_custom_combo_unit_box( id, value, [[MB,'MB'], [GB,'GB'], [TB,'TB']], class_name );
	}
	
	setupDraggableTable(args) {
		// allow table rows to be drag-sorted
		// args: { table_sel, handle_sel, drag_ghost_sel, drag_ghost_x, drag_ghost_y, callback }
		var $table = $(args.table_sel);
		var $rows = $table.find('tr').slice(1); // omit header row
		var $cur = null;
		
		var createDropZone = function($tr, idx, pos) {
			pos.top -= Math.floor( pos.height / 2 );
			
			$('<div><div class="dz_bar"></div></div>')
				.addClass('dropzone')
				.css({
					left: '' + pos.left + 'px',
					top: '' + pos.top + 'px',
					width: '' + pos.width + 'px',
					height: '' + pos.height + 'px'
				})
				.appendTo('body')
				.on('dragover', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					e.dataTransfer.effectAllowed = "move";
				})
				.on('dragenter', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					$(this).addClass('drag');
				})
				.on('dragleave', function(event) {
					$(this).removeClass('drag');
				})
				.on('drop', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					
					// make sure we didn't drop on ourselves
					if (idx == $cur.data('drag_idx')) return false;
					
					// see if we need to insert above or below target
					var above = true;
					var pos = $tr.offset();
					var height = $tr.height();
					var y = event.clientY + window.scrollY;
					if (y > pos.top + (height / 2)) above = false;
					
					// remove element being dragged
					$cur.detach();
					
					// insert at new location
					if (above) $tr.before( $cur );
					else $tr.after( $cur );
					
					// fire callback, pass new sorted collection
					args.callback( $table.find('tr').slice(1) );
				});
		}; // createDropZone
		
		$rows.each( function(row_idx) {
			var $handle = $(this).find(args.handle_sel);
			
			$handle.on('dragstart', function(event) {
				var e = event.originalEvent;
				var $tr = $cur = $(this).closest('tr');
				var $ghost = $tr.find(args.drag_ghost_sel).addClass('dragging');
				var ghost_x = ('drag_ghost_x' in args) ? args.drag_ghost_x : Math.floor($ghost.width() / 2);
				var ghost_y = ('drag_ghost_y' in args) ? args.drag_ghost_y : Math.floor($ghost.height() / 2);
				
				e.dataTransfer.setDragImage( $ghost.get(0), ghost_x, ghost_y );
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/html', 'blah'); // needed for FF.
				
				// need to recalc $rows for each drag
				$rows = $table.find('tr').slice(1);
				
				$rows.each( function(idx) {
					var $tr = $(this);
					$tr.data('drag_idx', idx);
				});
				
				// and we need to recalc row_idx too
				var row_idx = $tr.data('drag_idx');
				
				// create drop zones for each row
				// (except those immedately surrounding the row we picked up)
				$rows.each( function(idx) {
					var $tr = $(this);
					if ((idx != row_idx) && (idx != row_idx + 1)) {
						var pos = $tr.offset();
						pos.width = $tr.width();
						pos.height = $tr.height();
						createDropZone( $tr, idx, pos );
					}
				});
				
				// one final zone below table (possibly)
				if (row_idx != $rows.length - 1) {
					var $last_tr = $rows.slice(-1);
					var pos = $last_tr.offset();
					pos.width = $last_tr.width();
					pos.height = $last_tr.height();
					pos.top += pos.height;
					createDropZone( $last_tr, $rows.length, pos );
				}
			}); // dragstart
			
			$handle.on('dragend', function(event) {
				// cleanup drop zones
				$('div.dropzone').remove();
				$rows.removeData('drag_idx');
				$table.find('.dragging').removeClass('dragging');
			}); // dragend
			
		} ); // foreach row
	}
	
	cancelDrag(table_sel) {
		// cancel drag operation in progress (well, as best we can)
		var $table = $(table_sel);
		if (!$table.length) return;
		
		var $rows = $table.find('tr').slice(1); // omit header row
		$('div.dropzone').remove();
		$rows.removeData('drag_idx');
		$table.find('.dragging').removeClass('dragging');
	}
	
	setupDraggableGrid(args) {
		// allow grid rows to be drag-sorted
		// args: { table_sel, handle_sel, drag_ghost_sel, drag_ghost_x, drag_ghost_y, callback }
		var $table = $(args.table_sel);
		var $rows = $table.find('ul.grid_row');
		var $cur = null;
		
		var createDropZone = function($tr, idx, pos) {
			pos.top -= Math.floor( pos.height / 2 );
			
			$('<div><div class="dz_bar"></div></div>')
				.addClass('dropzone')
				.css({
					left: '' + pos.left + 'px',
					top: '' + pos.top + 'px',
					width: '' + pos.width + 'px',
					height: '' + pos.height + 'px'
				})
				.appendTo('body')
				.on('dragover', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					e.dataTransfer.effectAllowed = "move";
				})
				.on('dragenter', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					$(this).addClass('drag');
				})
				.on('dragleave', function(event) {
					$(this).removeClass('drag');
				})
				.on('drop', function(event) {
					var e = event.originalEvent;
					e.preventDefault();
					
					// make sure we didn't drop on ourselves
					if (idx == $cur.data('drag_idx')) return false;
					
					// see if we need to insert above or below target
					var above = true;
					var bounds = $tr.innerBounds();
					var y = event.clientY + window.scrollY;
					if (y > bounds.top + (bounds.height / 2)) above = false;
					
					// remove element being dragged
					$cur.detach();
					
					// insert at new location
					if (above) $tr.before( $cur );
					else $tr.after( $cur );
					
					// fire callback, pass new sorted collection
					args.callback( $table.find('ul.grid_row') );
				});
		}; // createDropZone
		
		$rows.each( function(row_idx) {
			var $handle = $(this).find(args.handle_sel);
			
			$handle.on('dragstart', function(event) {
				var e = event.originalEvent;
				var $tr = $cur = $(this).closest('ul');
				var $ghost = $tr.find(args.drag_ghost_sel).addClass('dragging');
				var ghost_x = ('drag_ghost_x' in args) ? args.drag_ghost_x : Math.floor($ghost.width() / 2);
				var ghost_y = ('drag_ghost_y' in args) ? args.drag_ghost_y : Math.floor($ghost.height() / 2);
				
				e.dataTransfer.setDragImage( $ghost.get(0), ghost_x, ghost_y );
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/html', 'blah'); // needed for FF.
				
				// need to recalc $rows for each drag
				$rows = $table.find('ul.grid_row');
				
				$rows.each( function(idx) {
					var $tr = $(this);
					$tr.data('drag_idx', idx);
				});
				
				// and we need to recalc row_idx too
				var row_idx = $tr.data('drag_idx');
				
				// create drop zones for each row
				// (except those immedately surrounding the row we picked up)
				$rows.each( function(idx) {
					var $tr = $(this);
					if ((idx != row_idx) && (idx != row_idx + 1)) {
						var bounds = $tr.innerBounds();
						createDropZone( $tr, idx, bounds );
					}
				});
				
				// one final zone below table (possibly)
				if (row_idx != $rows.length - 1) {
					var $last_tr = $rows.slice(-1);
					var bounds = $last_tr.innerBounds();
					bounds.top += bounds.height;
					createDropZone( $last_tr, $rows.length, bounds );
				}
			}); // dragstart
			
			$handle.on('dragend', function(event) {
				// cleanup drop zones
				$('div.dropzone').remove();
				$rows.removeData('drag_idx');
				$table.find('.dragging').removeClass('dragging');
			}); // dragend
			
		} ); // foreach row
	}
	
	cancelGridDrag(table_sel) {
		// cancel drag operation in progress (well, as best we can)
		var $table = $(table_sel);
		if (!$table.length) return;
		
		var $rows = $table.find('ul.grid_row');
		$('div.dropzone').remove();
		$rows.removeData('drag_idx');
		$table.find('.dragging').removeClass('dragging');
	}
	
	doFullPageError(msg) {
		// show full page error
		this.fullPageError({ description: msg });
	}
	
	fullPageError(resp) {
		// show "full page" inline error dialog
		// suitable for binding to the API errorCallback
		var html = '';
		html += '<div style="height:75px;"></div>';
		
		html += '<div class="box" style="padding:30px">';
			html += '<div class="box_title error">' + (resp.title || 'An Error Occurred') + '</div>';
			html += '<div class="box_content" style="font-size:14px;">' + resp.description + '</div>';
		html += '</div>';
		
		html += '<div style="height:75px;"></div>';
		this.div.html(html);
		
		app.showSidebar(true);
		app.setWindowTitle( "Error" );
		app.setHeaderTitle( '<i class="mdi mdi-alert-circle-outline">&nbsp;</i>Error' );
	}
	
}; // class Page

//
// Page Manager
//

window.PageManager = class PageManager {
	// 'PageManager' class handles all virtual pages in the application
	
	// methods
	constructor(page_list) {
		// class constructor, create all pages
		// page_list should be array of components from master config
		// each one should have at least a 'ID' parameter
		// anything else is copied into object verbatim
		this.pages = [];
		this.page_list = page_list;
		this.current_page_id = '';
		var $main = $('div.main');
		
		for (var idx = 0, len = page_list.length; idx < len; idx++) {
			var page_def = page_list[idx];
			Debug.trace( 'page', "Initializing page: " + page_def.ID );
			assert(Page[ page_def.ID ], "Page class not found: Page." + page_def.ID);
			
			var div = $('<div></div>')
				.prop('id', 'page_' + page_def.ID)
				.addClass('page')
				.css('display', 'none');
			$main.append(div);
			
			var page = new Page[ page_def.ID ]( page_def, div );
			page.args = {};
			page.onInit();
			this.pages.push(page);
			
			// add click handler for tab
			$('#tab_'+page.ID).click( function(event) {
				Nav.go( this._page_id );
			} )[0]._page_id = page.ID;
		}
		
		this.initSidebar();
	}
	
	find(id) {
		// locate page by ID (i.e. Plugin Name)
		var page = find_object( this.pages, { ID: id } );
		if (!page) Debug.trace('PageManager', "Could not find page: " + id);
		return page;
	}
	
	activate(id, old_id, args) {
		// send activate event to page by id (i.e. Plugin Name)
		$('#page_'+id).show();
		$('.sidebar .section_item').removeClass('active').addClass('inactive');
		$('#tab_'+id).removeClass('inactive').addClass('active');
		var page = this.find(id);
		page.active = true;
		
		if (!args) args = {};
		
		// if we are navigating here from a different page, AND the new sub mismatches the old sub, clear the page html
		var new_sub = args.sub || '';
		if (old_id && (id != old_id) && (typeof(page._old_sub) != 'undefined') && (new_sub != page._old_sub) && page.div) {
			page.div.html('');
		}
						
		var result = page.onActivate.apply(page, [args]);
		if (typeof(result) == 'boolean') return result;
		else throw("Page " + id + " onActivate did not return a boolean!");
	}
	
	deactivate(id, new_id) {
		// send deactivate event to page by id (i.e. Plugin Name)
		var page = this.find(id);
		var result = page.onDeactivate(new_id);
		if (result) {
			$('#page_'+id).hide();
			$('#tab_'+id).removeClass('active').addClass('inactive');
			// $('#d_message').hide();
			page.active = false;
			
			// if page has args.sub, save it for clearing html on reactivate, if page AND sub are different
			if (page.args) page._old_sub = page.args.sub || '';
		}
		return result;
	}
	
	click(id, args) {
		// exit current page and enter specified page
		Debug.trace('page', "Switching pages to: " + id);
		var old_id = this.current_page_id;
		if (this.current_page_id) {
			var result = this.deactivate( this.current_page_id, id );
			if (!result) return false; // current page said no
		}
		this.current_page_id = id;
		this.old_page_id = old_id;
		
		window.scrollTo( 0, 0 );
		
		var result = this.activate(id, old_id, args);
		if (!result) {
			// new page has rejected activation, probably because a login is required
			// un-hide previous page div, but don't call activate on it
			$('#page_'+id).hide();
			this.current_page_id = '';
			// if (old_id) {
				// $('page_'+old_id).show();
				// this.current_page_id = old_id;
			// }
		}
		
		return true;
	}
	
	// Sidebar
	
	initSidebar() {
		// setup sidebar "tabs"
		var self = this;
		$('.sidebar .section_title').off('mouseup').on('mouseup', function() {
			self.toggleSidebarGroup(this);
		});
		
		// set initial state
		$('.sidebar .section_title').each( function() {
			var $sect = $(this);
			if (!$sect.hasClass('expanded')) {
				$sect.next().css('height', 0).scrollTop( $sect.next()[0].scrollHeight );
			}
		});
	}
	
	toggleSidebarGroup(sect) {
		// toggle sidebar group open/closed
		var $sect = $(sect);
		if ($sect.hasClass('expanded')) this.collapseSidebarGroup(sect);
		else this.expandSidebarGroup(sect);
	}
	
	collapseSidebarGroup(sect) {
		// collapse tab section in sidebar
		var $sect = $(sect);
		if ($sect.hasClass('expanded')) {
			$sect.removeClass('expanded');
			$sect.next().stop().animate({
				scrollTop: $sect.next()[0].scrollHeight,
				height: 0
			}, {
				duration: 500,
				easing: 'easeOutQuart'
			});
		}
	}
	
	expandSidebarGroup(sect) {
		// expand tab section in sidebar
		var $sect = $(sect);
		if (!$sect.hasClass('expanded')) {
			$sect.addClass('expanded');
			$sect.next().stop().animate({
				scrollTop: 0,
				height: $sect.next()[0].scrollHeight
			}, {
				duration: 500,
				easing: 'easeOutQuart'
			});
		}
	}
	
}; // class PageManager

var Nav = {
	
	/**
	 * Virtual Page Navigation System
	 **/
	
	loc: '',
	old_loc: '',
	inited: false,
	nodes: [],
	
	init: function() {
		// initialize nav system
		assert( window.config, "window.config not present.");
		
		if (!this.inited) {
			this.inited = true;
			this.loc = 'init';
			this.monitor();
			
			window.addEventListener("hashchange", function(event) {
				Nav.monitor();
			}, false);
		}
	},
	
	monitor: function() {
		// monitor browser location and activate handlers as needed
		var parts = window.location.href.split(/\#/);
		var anchor = parts[1];
		if (!anchor) anchor = config.DefaultPage || 'Main';
		
		var full_anchor = '' + anchor;
		var sub = '';
		
		if (anchor.match(/^(.+?)\/(.+)$/)) {
			// inline section anchor after page name, slash delimited
			anchor = RegExp.$1;
			sub = RegExp.$2;
		}
		
		if ((anchor != this.loc) && !anchor.match(/^_/)) { // ignore doxter anchors
			Debug.trace('nav', "Caught navigation anchor: " + full_anchor);
			
			var page_name = '';
			var page_args = {};
			if (full_anchor.match(/^\w+\?.+/)) {
				parts = full_anchor.split(/\?/);
				page_name = parts[0];
				page_args = parse_query_string( parts[1] );
			}
			else {
				parts = full_anchor.split(/\//);
				page_name = parts[0];
				page_args = {};
				if (sub) page_args.sub = sub;
			}
			
			Debug.trace('nav', "Calling page: " + page_name + ": " + JSON.stringify(page_args));
			Dialog.hide();
			// app.hideMessage();
			app.pushSidebar();
			
			var result = app.page_manager.click( page_name, page_args );
			if (result) {
				this.old_loc = this.loc;
				if (this.old_loc == 'init') this.old_loc = config.DefaultPage || 'Main';
				this.loc = anchor;
				app.notifyUserNav(this.loc);
			}
			else {
				// current page aborted navigation -- recover current page without refresh
				this.go( this.loc );
			}
		}
		else if (sub != this.sub_anchor) {
			Debug.trace('nav', "Caught sub-anchor nav: " + sub);
			$P().gosub( sub );
		} // sub-anchor changed
		
		this.sub_anchor = sub;	
	},
	
	go: function(anchor, force) {
		// navigate to page
		anchor = anchor.replace(/^\#/, '');
		if (force) {
			if (anchor == this.loc) {
				this.loc = 'init';
				this.monitor();
			}
			else {
				this.loc = 'init';
				window.location.href = '#' + anchor;
			}
		}
		else {
			window.location.href = '#' + anchor;
		}
	},
	
	prev: function() {
		// return to previous page
		this.go( this.old_loc || config.DefaultPage || 'Main' );
	},
	
	refresh: function() {
		// re-nav to current page
		this.loc = 'refresh';
		this.monitor();
	},
	
	currentAnchor: function() {
		// return current page anchor
		var parts = window.location.href.split(/\#/);
		var anchor = parts[1] || '';
		
		anchor = anchor.replace(/\/.+$/, '');
		
		return anchor;
	}
	
}; // Nav
