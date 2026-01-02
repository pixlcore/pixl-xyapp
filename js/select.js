// Custom single- and multi-drop-down menus

var SingleSelect = {
	
	maxMenuItems: 1000,
	
	init: function(sel) {
		// initialize all single-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			$this.css('display', 'none').attr({ 'aria-hidden': true, tabindex: '-1' });
			if (app.mobile) $this.data('compact', true);
			
			var $ms = $('<div class="multiselect single" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false"></div>');
			if ($this.data('private')) $ms.attr('data-private', 1);
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible select div
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-chevron-down"></div>');
				
				var opt = self.options[ self.selectedIndex ] || self.options[0] || { label: "(None)", value: "" };
				
				var html = '<div class="single';
				if (opt.value === "") html += ' novalue';
				// if (opt.getAttribute && opt.getAttribute('data-class')) {
				// 	html += ' ' + opt.getAttribute('data-class') + '';
				// }
				html += '">';
				
				if (opt.getAttribute && opt.getAttribute('data-icon')) {
					html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
				}
				
				html += (opt.label || opt.value);
				html += '</div>';
				$ms.append(html);
				
				if (opt.getAttribute && opt.getAttribute('data-class')) {
					$ms.removeClass().addClass('multiselect single ' + opt.getAttribute('data-class'));
				}
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			// also expose redraw as a custom event that can be triggered
			$this.on('redraw', redraw);
			
			// allow keyboard to open menu
			$ms.on('keydown', function(event) {
				if ((event.key == 'Enter') || (event.key == ' ')) {
					$ms.click();
					event.preventDefault();
				}
			} );
			
			$ms.on('click', function() {
				// create popover dialog for selecting and filtering
				var html = '';
				var is_private = $this.data('private');
				if ($ms.hasClass('disabled')) return;
				$ms.attr('aria-expanded', 'true');
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Select Item') + '</div>';
				
				if (!$this.data('compact')) {
					html += '<div class="sel_dialog_search_container" role="search">';
						html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
						html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
					html += '</div>';
				}
				
				html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea';
				if ($this.data('nudgeheight')) html += ' nudgeheight';
				html += '" role="listbox">';
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					
					if (opt.getAttribute('data-group')) {
						html += '<div class="sel_dialog_group">' + opt.getAttribute('data-group') + '</div>';
					}
					
					html += '<div class="sel_dialog_item check ' + (opt.selected ? 'selected' : '');
					
					if (opt.getAttribute && opt.getAttribute('data-class')) {
						html += ' ' + opt.getAttribute('data-class') + '';
					}
					if ($this.data('shrinkwrap')) html += ' shrinkwrap';
					
					html += '" ' + ((idx >= SingleSelect.maxMenuItems) ? 'style="display:none"' : '') + ' data-value="' + opt.value + '"';
					html += ' role="option" aria-selected="' + (opt.selected ? 'true' : 'false') + '" tabindex="-1">';
					
					if (opt.getAttribute && opt.getAttribute('data-icon')) {
						html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
					}
					
					html += '<span ' + (is_private ? 'data-private' : '') + '>' + (opt.label || opt.value) + '</span>';
					html += '<div class="sel_dialog_item_check"><i class="mdi mdi-check"></i></div>';
					html += '</div>';
				}
				
				html += '<div id="d_sel_dialog_more">';
				if (self.options.length > SingleSelect.maxMenuItems) {
					html += '(' + commify(self.options.length - SingleSelect.maxMenuItems) + ' more items not shown)';
				}
				html += '</div>';
				
				html += '</div>'; // scrollarea
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('click', function() {
					// select item, close dialog and update multi-select
					var $item = $(this);
					$this.val( $item.data('value') );
					
					Popover.detach();
					// redraw();
					$this.trigger('change');
				});
				
				if (!$this.data('compact')) {
					var $input = $('#fe_sel_dialog_search');
					$input.focus();
					
					// setup keyboard handlers
					$input.on('keyup', function(event) {
						// refresh list on every keypress
						var value = $input.val().toLowerCase();
						var num_matched = 0;
						
						if (value.length) $('#d_sel_dialog_scrollarea > div.sel_dialog_group').hide();
						else $('#d_sel_dialog_scrollarea > div.sel_dialog_group').show();
						
						$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
							var $item = $(this);
							var text = $item.find('> span').html().toLowerCase();
							
							if (!value.length || (text.indexOf(value) > -1)) {
								if (num_matched < SingleSelect.maxMenuItems) $item.addClass('match').show();
								else $item.removeClass('match').hide();
								num_matched++;
							}
							else {
								$item.removeClass('match').hide();
							}
						} ); // each
						
						if (num_matched > SingleSelect.maxMenuItems) {
							$('#d_sel_dialog_more').html( '(' + commify(num_matched - SingleSelect.maxMenuItems) + ' more items not shown)' );
						}
						else $('#d_sel_dialog_more').html('');
						
						Popover.reposition();
					});
					$input.on('keydown', function(event) {
						// capture enter key
						var value = $input.val().toLowerCase();
						if ((event.keyCode == 13) && value.length) {
							event.preventDefault();
							event.stopPropagation();
							$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger('click');
						}
					});
				}
				
				// handle keyboard focus
				Popover.onKeyDown = SingleSelect.handleKeyDown;
				
				// highlight select field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { 
					$ms.removeClass('selected').attr('aria-expanded', 'false').focus();
				};
			}); // click
			
		}); // forach elem
	},
	
	handleKeyDown: function(event) {
		var $options = $('#d_sel_dialog_scrollarea > div.sel_dialog_item');
		var $active = $(document.activeElement).closest('.sel_dialog_item');
		
		var focusItem = function($item) {
			if (!$item.length) return;
			$options.attr({ 'tabindex':'-1', 'aria-selected':'false' });
			$item.attr({ 'tabindex':'0', 'aria-selected':'true' }).focus();
		};
		
		switch (event.key) {
			case 'ArrowDown':
				focusItem( $options.eq( $active.length ? ($active.index('.sel_dialog_item') + 1) : 0 ) );
				event.preventDefault();
				event.stopPropagation();
			break;
			
			case 'ArrowUp':
				focusItem( $options.eq( $active.length ? Math.max(0, $active.index('.sel_dialog_item') - 1) : 0 ) );
				event.preventDefault();
				event.stopPropagation();
			break;
			
			case 'Enter':
			case ' ':
				if ($active.length) {
					$active.click();
					event.preventDefault();
					event.stopPropagation();
				}
			break;
			
			case 'Escape':
				Popover.detach();
				event.preventDefault();
				event.stopPropagation();
			break;
		} // switch key
	}, // onKeyDown
	
	popupQuickMenu: function(opts) {
		// show popup menu on custom element
		// opts: { elem, title, items, value, callback, nocheck?, onCancel? }
		// item: { id, title, icon }
		var $elem = $(opts.elem);
		var items = opts.items;
		var callback = opts.callback;
		var check = opts.nocheck ? 'nocheck' : 'check';
		var html = '';
		
		html += '<div class="sel_dialog_label">' + opts.title + '</div>';
		if (opts.search) {
			html += '<div class="sel_dialog_search_container" role="search">';
				html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
				html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
			html += '</div>';
		}
		html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea" role="listbox">';
		for (var idy = 0, ley = items.length; idy < ley; idy++) {
			var item = items[idy];
			var sel = (item.id == opts.value);
			if (item.group) html += '<div class="sel_dialog_group">' + item.group + '</div>';
			
			html += '<div class="sel_dialog_item ' + check + ' ' + (sel ? 'selected' : '') + ' shrinkwrap" data-value="' + item.id + '"';
			html += ' role="option" aria-selected="' + (sel ? 'true' : 'false') + '" tabindex="-1">';
			
			if (item.icon) html += '<i class="mdi mdi-' + item.icon + '">&nbsp;</i>';
			html += '<span>' + item.title + '</span>';
			if (!opts.nocheck) html += '<div class="sel_dialog_item_check"><i class="mdi mdi-check"></i></div>';
			html += '</div>';
		}
		html += '</div>';
		
		Popover.attach( $elem, '<div style="padding:15px;">' + html + '</div>', true );
		
		$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('click', function() {
			// select item, close dialog and update state
			var $item = $(this);
			var value = $item.data('value');
			
			delete opts.onCancel;
			Popover.detach();
			callback(value);
		}); // click
		
		// handle keyboard focus
		Popover.onKeyDown = SingleSelect.handleKeyDown;
		
		Popover.onDetach = function() {
			$elem.removeClass('popped').focus();
			if (opts.onCancel) opts.onCancel();
		};
		
		$elem.addClass('popped');
		
		if (opts.search) {
			// setup input field
			var $input = $('#fe_sel_dialog_search');
			$input.focus();
			
			// setup keyboard handlers
			$input.on('keyup', function(event) {
				// refresh list on every keypress
				var value = $input.val().toLowerCase();
				
				if (value.length) $('#d_sel_dialog_scrollarea > div.sel_dialog_group').hide();
				else $('#d_sel_dialog_scrollarea > div.sel_dialog_group').show();
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
					var $item = $(this);
					var text = $item.find('> span').html().toLowerCase();
					if (!value.length || (text.indexOf(value) > -1)) {
						$item.addClass('match').show();
					}
					else {
						$item.removeClass('match').hide();
					}
				} );
				Popover.reposition();
			});
			$input.on('keydown', function(event) {
				// capture enter key
				var value = $input.val().toLowerCase();
				if ((event.keyCode == 13) && value.length) {
					// enter key with a value typed into the search box
					event.preventDefault();
					event.stopPropagation();
					
					var mup = jQuery.Event( "click" );
					mup.metaKey = true; // bypass `hold` feature
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger(mup);
				}
			});
		} // opts.search
	}
	
}; // SingleSelect

var MultiSelect = {
	
	init: function(sel) {
		// initialize all multi-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			if (app.mobile) $this.data('compact', true);
			$this.css('display', 'none').attr({ 'aria-hidden': true, 'tabindex': '-1' });
			
			var $ms = $('<div class="multiselect multi" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false"></div>');
			if ($this.data('private')) $ms.attr('data-private', 1);
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible multiselect div
				var num_sel = 0;
				var inherited = $this.data('inherited') ? ($this.data('inherited') || '').split(/\,\s*/) : [];
				
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-chevron-double-down"></div>');
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					if (inherited.includes(opt.value)) {
						// item is inherited -- show with lock icon
						var html = '<i class="mdi mdi-lock-check">&nbsp;</i>';
						if (opt.getAttribute && opt.getAttribute('data-icon')) {
							html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
						}
						html += opt.getAttribute('data-abbrev') || opt.label;
						var tooltip = $this.data('itooltip') || '(Inherited Item)';
						var $item = $('<div class="item inherited"></div>').attr('title', tooltip).data('value', opt.value).html(html);
						$ms.append( $item );
						num_sel++;
					}
					else if (opt.selected) {
						// item is selected
						var html = '<button class="mdi mdi-close" aria-label="Remove Item: ' + encode_attrib_entities(opt.label) + '">&nbsp;</button>';
						if (opt.getAttribute && opt.getAttribute('data-icon')) {
							html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
						}
						html += opt.getAttribute('data-abbrev') || opt.label;
						var $item = $('<div class="item"></div>').data('value', opt.value).html(html);
						$ms.append( $item );
						num_sel++;
					}
				}
				
				if (num_sel) $ms.append( '<div class="clear"></div>' );
				else $ms.append( '<div class="placeholder">' + ($this.attr('placeholder') || 'Click to select...') + '</div>' );
				
				$ms.find('div.item > button.mdi-close').on('click keydown', function(e) {
					// user clicked on the 'X' -- remove this item and redraw
					if (e.key && (e.key != 'Enter') && (e.key != ' ')) return;
					
					var $item = $(this).parent();
					var value = $item.data('value');
					for (var idx = 0, len = self.options.length; idx < len; idx++) {
						var opt = self.options[idx];
						if (opt.selected && (opt.value == value)) {
							opt.selected = false;
							idx = len;
						}
					}
					// redraw();
					$this.trigger('change');
					e.stopPropagation();
					e.preventDefault();
					return false;
				});
				
				if ($this.data('hold') && $this.data('volatile') && Popover.enabled && (Popover.$anchor.prop('id') == $this.prop('id'))) {
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function(idx) {
						if (self.options[idx].selected) $(this).addClass('selected').attr('aria-selected', 'true');
						else $(this).removeClass('selected').attr('aria-selected', 'false');
					} );
				}
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			// also expose redraw as a custom event that can be triggered
			$this.on('redraw', redraw);
			
			// allow keyboard to open menu
			$ms.on('keypress', function(event) {
				if ((event.key == 'Enter') || (event.key == ' ')) {
					$ms.click();
					event.preventDefault();
				}
			} );
			
			$ms.on('click', function() {
				// create popover dialog for selecting and filtering
				var html = '';
				var orig_sel_state = [];
				var last_sel_idx = -1;
				var inherited = $this.data('inherited') ? ($this.data('inherited') || '').split(/\,\s*/) : [];
				var is_private = $this.data('private');
				if ($ms.hasClass('disabled')) return;
				$ms.attr('aria-expanded', 'true');
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Select Items');
				if ($this.data('select-all')) {
					var is_all_sel = !!(find_objects(self.options, { selected: true }).length == self.options.length);
					html += '<div class="sel_all_none">' + (is_all_sel ? 'Select None' : 'Select All') + '</div>';
				}
				html += '</div>';
				
				if (!$this.data('compact')) {
					html += '<div class="sel_dialog_search_container" role="search">';
						html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
						html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
					html += '</div>';
				}
				html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea" role="listbox">';
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					var is_inherited = !!inherited.includes(opt.value);
					
					if (opt.getAttribute('data-group')) {
						html += '<div class="sel_dialog_group">' + opt.getAttribute('data-group') + '</div>';
					}
					
					html += '<div class="sel_dialog_item check ' + (opt.selected ? 'selected' : '');
					
					if (opt.getAttribute && opt.getAttribute('data-class')) {
						html += ' ' + opt.getAttribute('data-class') + '';
					}
					if ($this.data('shrinkwrap')) html += ' shrinkwrap';
					if (is_inherited) html += ' inherited';
					
					html += '" data-value="' + opt.value + '" title="' + (is_inherited ? ($this.data('itooltip') || '(Inherited Item)') : '') + '"';
					html += ' role="option" aria-selected="' + (opt.selected ? 'true' : 'false') + '" tabindex="-1">';
					
					if (opt.getAttribute && opt.getAttribute('data-icon')) {
						html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
					}
					html += '<span ' + (is_private ? 'data-private' : '') + '>' + (opt.label || opt.value) + '</span>';
					html += '<div class="sel_dialog_item_check"><i class="mdi mdi-' + (is_inherited ? 'lock-check' : 'check') + '"></i></div>';
					html += '</div>';
					orig_sel_state.push( opt.selected );
					if (opt.selected) last_sel_idx = idx;
				}
				
				html += '</div>';
				
				if ($this.data('hold')) {
					html += '<div class="sel_dialog_button_container">';
						html += '<div class="button" id="btn_sel_dialog_cancel"><i class="mdi mdi-close-circle-outline">&nbsp;</i>Cancel</div>';
						html += '<div class="button primary" id="btn_sel_dialog_add"><i class="mdi mdi-check-circle">&nbsp;</i>' + ($this.attr('confirm') || 'Accept') + '</div>';
					html += '</div>';
				} // hold
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('click', function(event) {
					// select item, close dialog and update multi-select
					var $item = $(this);
					if ($item.hasClass('inherited')) return; // no clicky on inherited items
					
					var value = $item.data('value');
					var new_sel_state = !$item.hasClass('selected');
					var new_sel_idx = -1;
					
					for (var idx = 0, len = self.options.length; idx < len; idx++) {
						var opt = self.options[idx];
						if (opt.value == value) {
							opt.selected = new_sel_state;
							if (new_sel_state) $item.addClass('selected').attr('aria-selected', 'true'); else $item.removeClass('selected').attr('aria-selected', 'false');
							if (new_sel_state) new_sel_idx = idx;
							idx = len;
						}
					}
					
					if (!$this.data('hold') || (self.options.length == 1) || event.metaKey) {
						// close popover
						Popover.detach();
					}
					else if ($this.data('hold') && event.shiftKey && (new_sel_idx > -1) && (last_sel_idx > -1) && (new_sel_idx != last_sel_idx)) {
						// select range
						if (last_sel_idx > new_sel_idx) { var temp = last_sel_idx; last_sel_idx = new_sel_idx; new_sel_idx = temp; }
						for (var idx = last_sel_idx; idx <= new_sel_idx; idx++) { self.options[idx].selected = true; }
						$('#d_sel_dialog_scrollarea > div.sel_dialog_item').slice(last_sel_idx, new_sel_idx + 1).addClass('selected').attr('aria-selected', 'true');
					}
					else if ($this.data('hold') && event.altKey && (new_sel_idx > -1) && (last_sel_idx > -1) && (new_sel_idx != last_sel_idx)) {
						// select pattern
						if (last_sel_idx > new_sel_idx) { var temp = last_sel_idx; last_sel_idx = new_sel_idx; new_sel_idx = temp; }
						var dist = new_sel_idx - last_sel_idx;
						for (var idx = last_sel_idx, len = self.options.length; idx < len; idx += dist) {
							var opt = self.options[idx];
							opt.selected = true;
							$('#d_sel_dialog_scrollarea > div.sel_dialog_item').slice(idx, idx + 1).addClass('selected').attr('aria-selected', 'true');
						}
					}
					else if ($this.data('hold') && !new_sel_state) {
						// user has de-selected something, so re-evaluate last_sel_idx
						last_sel_idx = find_object_idx( self.options, { selected: true } );
					}
					
					$this.trigger('change');
					last_sel_idx = new_sel_idx;
					
					// update select-all-none display
					if ($this.data('select-all')) {
						var is_all_sel = !!(find_objects(self.options, { selected: true }).length == self.options.length);
						$('div.arrow_box div.sel_all_none').html( is_all_sel ? 'Select None' : 'Select All' );
					}
				}); // click
				
				if ($this.data('hold')) {
					$('#btn_sel_dialog_cancel').on('click', function() {
						Popover.detach();
						
						// restore original opts and redraw
						for (var idx = 0, len = self.options.length; idx < len; idx++) {
							var opt = self.options[idx];
							opt.selected = orig_sel_state[idx];
						}
						
						redraw();
						$this.trigger('change');
					});
					$('#btn_sel_dialog_add').on('click', function() { Popover.detach(); $ms.focus(); });
				} // hold
				
				// attach click handler for select-all-none
				$('div.arrow_box div.sel_all_none').on('click', function(event) {
					var is_all_sel = !!(find_objects(self.options, { selected: true }).length == self.options.length);
					var new_sel_state = !is_all_sel;
					
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function(idx) {
						var $item = $(this);
						if ($item.hasClass('inherited')) return; // no clicky on inherited items
						
						var opt = self.options[idx];
						opt.selected = new_sel_state;
						if (new_sel_state) $item.addClass('selected').attr('aria-selected', 'true'); else $item.removeClass('selected').attr('aria-selected', 'false');
					} );
					
					$this.trigger('change');
					$(this).html( is_all_sel ? 'Select All' : 'Select None' );
				});
				
				var $input = null;
				if (!$this.data('compact')) {
					// setup input field
					$input = $('#fe_sel_dialog_search');
					$input.focus();
					
					// setup keyboard handlers
					$input.on('keyup', function(event) {
						// refresh list on every keypress
						var value = $input.val().toLowerCase();
						
						if (value.length) $('#d_sel_dialog_scrollarea > div.sel_dialog_group').hide();
						else $('#d_sel_dialog_scrollarea > div.sel_dialog_group').show();
						
						$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
							var $item = $(this);
							if ($item.hasClass('inherited')) {
								if (value.length) $item.hide();
								else $item.show();
								return;
							}
							
							var text = $item.find('> span').html().toLowerCase();
							if (!value.length || (text.indexOf(value) > -1)) {
								$item.addClass('match').show();
							}
							else {
								$item.removeClass('match').hide();
							}
						} );
						Popover.reposition();
					});
					$input.on('keydown', function(event) {
						// capture enter key
						var value = $input.val().toLowerCase();
						if ((event.keyCode == 13) && value.length) {
							// enter key with a value typed into the search box
							event.preventDefault();
							event.stopPropagation();
							
							var mup = jQuery.Event( "click" );
							mup.metaKey = true; // bypass `hold` feature
							$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger(mup);
						}
						else if ((event.keyCode == 13) && $this.data('hold')) {
							// enter key WITHOUT value typed into search box + hold mode
							event.preventDefault();
							event.stopPropagation();
							$('#btn_sel_dialog_add').trigger( jQuery.Event("click") );
						}
						else if ((event.keyCode == 27) && $this.data('hold')) {
							// esc key WITHOUT value typed into search box + hold mode
							event.preventDefault();
							event.stopPropagation();
							$('#btn_sel_dialog_cancel').trigger( jQuery.Event("click") );
						}
					});
				} // not compact
				
				// handle enter/esc keys if search field is NOT focused
				Popover.onKeyDown = function(event) {
					if ((event.keyCode == 13) && (!$input || !$input.is(':focus')) && $this.data('hold')) {
						// enter key
						event.preventDefault();
						event.stopPropagation();
						$('#btn_sel_dialog_add').trigger( jQuery.Event("click") );
					}
					else if ((event.keyCode == 27) && (!$input || !$input.is(':focus')) && $this.data('hold')) {
						// esc key
						event.preventDefault();
						event.stopPropagation();
						$('#btn_sel_dialog_cancel').trigger( jQuery.Event("click") );
					}
				};
				
				// handle keyboard focus
				Popover.onKeyDown = SingleSelect.handleKeyDown;
				
				// highlight multiselect field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { 
					$ms.removeClass('selected').attr('aria-expanded', 'false').focus();
					if (Dialog.active) Dialog.autoResize();
				};
			}); // click
			
		}); // foreach elem
	},
	
	popupQuickMenu: function(opts) {
		// show popup menu on custom element
		// opts: { elem, title, items, values, callback }
		// item: { id, title, icon }
		var $elem = $(opts.elem);
		var items = opts.items;
		var callback = opts.callback;
		var html = '';
		
		html += '<div class="sel_dialog_label">' + opts.title + '</div>';
		if (opts.search) {
			html += '<div class="sel_dialog_search_container" role="search">';
				html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
				html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
			html += '</div>';
		}
		html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea" role="listbox">';
		for (var idy = 0, ley = items.length; idy < ley; idy++) {
			var item = items[idy];
			var sel = opts.values.includes(item.id);
			
			html += '<div class="sel_dialog_item check ' + (sel ? 'selected' : '') + ' shrinkwrap" data-value="' + item.id + '"';
			html += ' role="option" aria-selected="' + (sel ? 'true' : 'false') + '" tabindex="-1">';
			
			if (item.icon) html += '<i class="mdi mdi-' + item.icon + '">&nbsp;</i>';
			html += '<span>' + item.title + '</span>';
			html += '<div class="sel_dialog_item_check"><i class="mdi mdi-check"></i></div>';
			html += '</div>';
		}
		html += '</div>';
		
		Popover.attach( $elem, '<div style="padding:15px;">' + html + '</div>', true );
		
		$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('click', function() {
			// select item, close dialog and update state
			var $item = $(this);
			if ($item.hasClass('selected')) $item.removeClass('selected');
			else $item.addClass('selected');
			
			var values = [];
			$('#d_sel_dialog_scrollarea > div.sel_dialog_item.selected').each( function() {
				values.push( $(this).data('value') );
			});
			
			Popover.detach();
			callback(values);
		}); // click
		
		// handle keyboard focus
		Popover.onKeyDown = SingleSelect.handleKeyDown;
		
		Popover.onDetach = function() {
			$elem.removeClass('popped').focus();
		};
		
		$elem.addClass('popped');
		
		if (opts.search) {
			// setup input field
			var $input = $('#fe_sel_dialog_search');
			$input.focus();
			
			// setup keyboard handlers
			$input.on('keyup', function(event) {
				// refresh list on every keypress
				var value = $input.val().toLowerCase();
				
				if (value.length) $('#d_sel_dialog_scrollarea > div.sel_dialog_group').hide();
				else $('#d_sel_dialog_scrollarea > div.sel_dialog_group').show();
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
					var $item = $(this);
					var text = $item.find('> span').html().toLowerCase();
					if (!value.length || (text.indexOf(value) > -1)) {
						$item.addClass('match').show();
					}
					else {
						$item.removeClass('match').hide();
					}
				} );
				Popover.reposition();
			});
			$input.on('keydown', function(event) {
				// capture enter key
				var value = $input.val().toLowerCase();
				if ((event.keyCode == 13) && value.length) {
					// enter key with a value typed into the search box
					event.preventDefault();
					event.stopPropagation();
					
					var mup = jQuery.Event( "click" );
					mup.metaKey = true; // bypass `hold` feature
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger(mup);
				}
			});
		} // opts.search
	}
	
}; // MultiSelect

var TextSelect = {
	
	init: function(sel) {
		// initialize all text-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			$this.css('display', 'none').attr({ 'aria-hidden': true, 'tabindex': '-1' });
			
			var $ms = $('<div class="multiselect text" role="button" tabindex="0"></div>');
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible multiselect div
				var num_sel = 0;
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-plus"></div>');
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					var $item = $('<div class="item"></div>').data('value', opt.value).html(
						'<button class="mdi mdi-close" aria-label="Remove Item: ' + encode_attrib_entities(opt.label) + '">&nbsp;</button>' + opt.label
					);
					$ms.append( $item );
					num_sel++;
				}
				
				if (num_sel) $ms.append( '<div class="clear"></div>' );
				else $ms.append( '<div class="placeholder">' + ($this.attr('placeholder') || 'Click to add...') + '</div>' );
				
				$ms.find('div.item > button.mdi').on('click keydown', function(e) {
					// user clicked on the 'X' -- remove this item and redraw
					if (e.key && (e.key != 'Enter') && (e.key != ' ')) return;
					
					var $item = $(this).parent();
					var value = $item.data('value');
					
					var idx = find_object_idx( self.options, { value: value } );
					self.options.remove( idx );
					
					$this.trigger('change');
					e.stopPropagation();
					e.preventDefault();
					return false;
				});
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			// also expose redraw as a custom event that can be triggered
			$this.on('redraw', redraw);
			
			// allow keyboard to open menu
			$ms.on('keypress', function(event) {
				if ((event.key == 'Enter') || (event.key == ' ')) {
					$ms.click();
					event.preventDefault();
				}
			} );
			
			$ms.on('click', function() {
				// create popover dialog for adding new items
				var html = '';
				if ($ms.hasClass('disabled')) return;
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Add New Item') + '</div>';
				html += '<div class="sel_dialog_search_container">';
					html += '<input type="text" id="fe_sel_dialog_text" class="sel_dialog_search" style="border-radius:2px;" autocomplete="off" value=""/>';
					html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-' + ($this.attr('icon') || 'plus') + '"></i></div>';
				html += '</div>';
				
				if ($this.attr('description')) {
					html += '<div class="sel_dialog_caption">' + $this.attr('description') + '</div>';
				}
				
				html += '<div class="sel_dialog_button_container">';
					html += '<div class="button" id="btn_sel_dialog_cancel">Cancel</div>';
					html += '<div class="button primary" id="btn_sel_dialog_add">' + ($this.attr('confirm') || 'Add Item') + '</div>';
				html += '</div>';
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				var doAdd = function() {
					app.clearError();
					
					var value = $('#fe_sel_dialog_text').val().replace(/[\"\']+/g, '');
					if ($this.attr('trim')) value = value.trim();
					if ($this.attr('lower')) value = value.toLowerCase();
					if ($this.data('validate') && !value.match( new RegExp($this.data('validate')) )) {
						return app.badField('#fe_sel_dialog_text');
					}
					
					if (!value.length || find_object(self.options, { value: value })) {
						Popover.detach();
						return;
					}
					
					// add new item
					var opt = new Option( value, value );
					opt.selected = true;
					self.options[ self.options.length ] = opt;
					
					Popover.detach();
					$this.trigger('change');
				}; // doAdd
				
				$('#btn_sel_dialog_cancel').on('click', function() { Popover.detach(); });
				$('#btn_sel_dialog_add').on('click', function() { doAdd(); });
				
				var $input = $('#fe_sel_dialog_text').focus().on('keydown', function(event) {
					// capture enter key
					if ((event.keyCode == 13) && this.value.length) {
						event.preventDefault();
						event.stopPropagation();
						doAdd();
					}
				});
				
				// highlight multiselect field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { 
					$ms.removeClass('selected').focus();
				};
			}); // click
			
		}); // forach elem
	},
	
	popupQuickMenu: function(opts) {
		// show popup menu on custom element
		// opts: { elem, title, icon?, description?, confirm?, trim?, lower?, validate?, callback }
		var $elem = $(opts.elem);
		var callback = opts.callback;
		var html = '';
		
		html += '<div class="sel_dialog_label ' + (opts.danger ? 'danger' : '') +'">' + (opts.title || 'Add New Item') + '</div>';
		html += '<div class="sel_dialog_search_container">';
			html += '<input type="text" id="fe_sel_dialog_text" class="sel_dialog_search" style="border-radius:2px;" autocomplete="off" value=""/>';
			html += '<div class="sel_dialog_search_icon ' + (opts.danger ? 'danger' : '') + '"><i class="mdi mdi-' + (opts.icon || 'plus') + '"></i></div>';
		html += '</div>';
		
		if (opts.description) {
			html += '<div class="sel_dialog_caption">' + opts.description + '</div>';
		}
		
		html += '<div class="sel_dialog_button_container">';
			html += '<div class="button" id="btn_sel_dialog_cancel">Cancel</div>';
			html += '<div class="button primary ' + (opts.danger ? 'delete' : '') + '" id="btn_sel_dialog_add">' + (opts.confirm || 'Add Item') + '</div>';
		html += '</div>';
		
		Popover.attach( $elem, '<div style="padding:15px;">' + html + '</div>', true );
		
		var doAdd = function() {
			app.clearError();
			
			var value = $('#fe_sel_dialog_text').val().replace(/[\"\']+/g, '');
			if (opts.trim) value = value.trim();
			if (opts.lower) value = value.toLowerCase();
			if (opts.validate && !value.match( new RegExp(opts.validate) )) {
				return app.badField('#fe_sel_dialog_text');
			}
			
			if (!value.length) {
				Popover.detach();
				return;
			}
			
			Popover.detach();
			callback(value);
		}; // doAdd
		
		$('#btn_sel_dialog_cancel').on('click', function() { Popover.detach(); });
		$('#btn_sel_dialog_add').on('click', function() { doAdd(); });
		
		var $input = $('#fe_sel_dialog_text').focus().on('keydown', function(event) {
			// capture enter key
			if ((event.keyCode == 13) && this.value.length) {
				event.preventDefault();
				event.stopPropagation();
				doAdd();
			}
		});
		
		$elem.addClass('popped');
		Popover.onDetach = function() { 
			$elem.removeClass('popped').focus(); 
		};
	}
	
}; // TextSelect

var KeySelect = {

	init: function(sel) {
		// initialize all key-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			$this.css('display', 'none').attr({ 'aria-hidden': true, 'tabindex': '-1' });
			
			var $ms = $('<div class="multiselect text" role="button" tabindex="0"></div>');
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible multiselect div
				var num_sel = 0;
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-plus"></div>');
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					var $item = $('<div class="item"></div>').data('value', opt.value).html(
						'<button class="mdi mdi-close" aria-label="Remove Key: ' + encode_attrib_entities(opt.label) + '">&nbsp;</button>' + opt.label
					);
					$ms.append( $item );
					num_sel++;
				}
				
				if (num_sel) $ms.append( '<div class="clear"></div>' );
				else $ms.append( '<div class="placeholder">' + ($this.attr('placeholder') || 'Click to add...') + '</div>' );
				
				$ms.find('div.item > button.mdi').on('click keydown', function(e) {
					// user clicked on the 'X' -- remove this item and redraw
					if (e.key && (e.key != 'Enter') && (e.key != ' ')) return;
					
					var $item = $(this).parent();
					var value = $item.data('value');
					
					var idx = find_object_idx( self.options, { value: value } );
					self.options.remove( idx );
					
					$this.trigger('change');
					e.stopPropagation();
					e.preventDefault();
					return false;
				});
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			// also expose redraw as a custom event that can be triggered
			$this.on('redraw', redraw);
			
			// allow keyboard to open menu
			$ms.on('keypress', function(event) {
				if ((event.key == 'Enter') || (event.key == ' ')) {
					$ms.click();
					event.preventDefault();
				}
			} );
			
			$ms.on('click', function() {
				// create popover dialog for adding new items
				var html = '';
				if ($ms.hasClass('disabled')) return;
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Add New Item') + '</div>';
				html += '<div class="sel_dialog_search_container">';
					html += '<input type="hidden" id="fe_sel_dialog_key" value=""/>';
					html += '<input type="text" id="fe_sel_dialog_text" class="sel_dialog_search" style="border-radius:2px;" autocomplete="off" value=""/>';
					html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-' + ($this.attr('icon') || 'plus') + '"></i></div>';
				html += '</div>';
				
				if ($this.attr('description')) {
					html += '<div class="sel_dialog_caption">' + $this.attr('description') + '</div>';
				}
				
				html += '<div class="sel_dialog_button_container">';
					html += '<div class="button" id="btn_sel_dialog_cancel">Cancel</div>';
					html += '<div class="button primary" id="btn_sel_dialog_add">' + ($this.attr('confirm') || 'Add Hot Key') + '</div>';
				html += '</div>';
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				var doAdd = function() {
					app.clearError();
					
					var value = $('#fe_sel_dialog_key').val();
					var label = $('#fe_sel_dialog_text').val();
					
					if (!value.length || find_object(self.options, { value: value })) {
						Popover.detach();
						return;
					}
					
					// add new item
					var opt = new Option( label, value );
					opt.selected = true;
					self.options[ self.options.length ] = opt;
					
					Popover.detach();
					$this.trigger('change');
				}; // doAdd
				
				$('#btn_sel_dialog_cancel').on('click', function() { Popover.detach(); });
				$('#btn_sel_dialog_add').on('click', function() { doAdd(); });
				
				var $input = $('#fe_sel_dialog_text').focus().on('keydown', function(event) {
					// capture keydown
					if ((event.keyCode == 13) && this.value.length) {
						event.preventDefault();
						event.stopPropagation();
						doAdd();
					}
					
					var key_id = KeySelect.getKeyID(event);
					if (!key_id) return;
					
					event.preventDefault();
					event.stopPropagation();
					
					$('#fe_sel_dialog_key').val( key_id );
					$('#fe_sel_dialog_text').val( KeySelect.getkeyLabel(key_id) );
				});
				
				// highlight multiselect field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { 
					$ms.removeClass('selected').focus();
				};
			}); // click
			
		}); // forach elem
	},
	
	getKeyID(event) {
		// get get ID based on event
		// ignore modifiers by themselves
		if (event.key.match(/^(Shift|Control|Alt|Meta)$/)) return '';
		
		var parts = [];
		if (event.shiftKey) parts.push('Shift');
		if (event.ctrlKey) parts.push('Control');
		if (event.altKey) parts.push('Alt');
		if (event.metaKey) parts.push('Meta');
		if (!parts.includes(event.code)) parts.push( event.code );
		
		return parts.join('+');
	},
	
	getkeyLabel(key_id, glue = '+') {
		// get formatted label based on key id
		var os = app.os;
		return key_id.split(/\+/).map( function(key) {
			if (key == 'Meta') return os.mac ? 'Command' : (os.win ? 'Windows' : 'Super');
			else return key.replace(/^(Key|Digit)/, '');
		} ).join(glue);
	}
	
}; // KeySelect
