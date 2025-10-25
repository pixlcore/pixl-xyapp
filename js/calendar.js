// Popup calendar component

var Calendar = {
	
	init: function(sel) {
		// initialize all based on selector
		$(sel).each( function() {
			var $this = $(this);
			var $anchor = $this.next();
			
			$anchor.on('mouseup', function() {
				Calendar.popup( $anchor, parseInt($this.val()), function(epoch) {
					$this.val( epoch );
					$this.trigger('change');
				});
			});
			
			$this.on('change', function() {
				var epoch = parseInt(this.value);
				if (epoch) {
					var fmt = app.formatDate(epoch, { 
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					});
					$anchor.html( '<i class="mdi mdi-calendar">&nbsp;</i>' + fmt );
				}
				else {
					$anchor.html( '(None)' );
				}
			});
			
			$this.trigger('change');
		});
	},
	
	popup: function(anchor, date, callback) {
		var self = this;
		var html = '';
		if (!date) date = time_now();
		
		this.$anchor = $(anchor);
		this.callback = callback;
		this.sel_epoch = normalize_time( date, { hour: 0, min: 0, sec: 0 } );
		this.month_start_epoch = normalize_time( this.sel_epoch, { mday: 1, hour: 12, min: 0, sec: 0 } );
		
		html += '<div class="calendar">';
			html += '<div class="cal_header">';
				html += '<div class="ch_nav ch_prev" onClick="Calendar.prevMonth()" title="Previous Month"><i class="mdi mdi-chevron-double-left"></i></div>';
				html += '<div class="ch_title"></div>';
				html += '<div class="ch_nav ch_next" onClick="Calendar.nextMonth()" title="Next Month"><i class="mdi mdi-chevron-double-right"></i></div>';
			html += '</div>';
			html += '<div class="cal_days">';
				_short_day_names.forEach( function(ddd) {
					html += '<div class="cal_day">' + ddd + '</div>';
				});
			html += '</div>';
			html += '<div class="cal_grid">';
				for (var y = 0; y < 6; y++) {
					html += '<div class="cg_row">';
					for (var x = 0; x < 7; x++) {
						html += '<div class="cg_cell" id="cg_' + x + '_' + y + '"></div>';
					}
					html += '</div>';
				}
			html += '</div>';
		html += '</div>';
		
		Popover.attach( this.$anchor, html, true );
		
		// save this for convenience
		this.$cal = Popover.$box.find('div.calendar');
		
		// add click handling to grid
		this.$cal.find('div.cg_cell').on('mouseup', function() {
			var mday = $(this).data('mday') || '';
			if (mday) self.clickCell( mday );
		});
		
		// draw initial calendar
		this.redraw();
		
		// highlight anchor field under us
		this.$anchor.addClass('selected');
		
		// arrow key navigation within popup
		Popover.onKeyDown = function(event) {
			if (event.keyCode == 37) self.prevMonth();
			else if (event.keyCode == 39) self.nextMonth();
		};
		
		// cleanup on close
		Popover.onDetach = function() {
			self.$anchor.removeClass('selected'); 
			delete self.$anchor;
			delete self.callback;
			delete self.sel_epoch;
			delete self.month_start_epoch;
		};
	},
	
	redraw: function() {
		// draw current month
		var self = this;
		var $cal = this.$cal;
		var month_start_epoch = this.month_start_epoch;
		var sel_dargs = get_date_args( this.sel_epoch );
		var today_dargs = get_date_args();
		
		// title
		var month_dargs = get_date_args( this.month_start_epoch );
		$cal.find('div.ch_title').html( month_dargs.mmmm + ' ' + month_dargs.yyyy );
		
		// setup grid
		$cal.find('div.cg_cell').empty().removeClass().addClass('cg_cell').removeData('mday');
		$cal.find('div.cg_row').removeClass('last');
		
		// populate real day grid units
		var epoch = month_start_epoch;
		var dargs = get_date_args( epoch );
		var y = -1;
		
		while (dargs.yyyy_mm == month_dargs.yyyy_mm) {
			var x = dargs.wday;
			if ((y == -1) || (x == 0)) y++;
			var $cell = $cal.find('#cg_' + x + '_' + y);
			$cell.addClass('enabled').html(dargs.mday).data('mday', dargs.mday);
			
			// augment class for current date and selected date
			if (dargs.yyyy_mm_dd == sel_dargs.yyyy_mm_dd) $cell.addClass('selected');
			if (dargs.yyyy_mm_dd == today_dargs.yyyy_mm_dd) $cell.addClass('today');
			
			// since we started at noon, this avoids DST issues
			epoch += 86400;
			dargs = get_date_args( epoch );
		}
		
		// fix up borders and reposition popover in case height has changed
		$cal.find('div.cg_row').slice(y).addClass('last');
		Popover.reposition();
	},
	
	clickCell: function(mday) {
		// user clicked on enabled grid cell -- fire callback and detach popover
		var epoch = normalize_time( this.month_start_epoch, { mday: parseInt(mday), hour: 0, min: 0, sec: 0 } );
		this.callback( epoch );
		Popover.detach();
	},
	
	prevMonth: function() {
		// jump to previous month
		var dargs = get_date_args( this.month_start_epoch );
		dargs.mon--; if (dargs.mon < 1) { dargs.mon = 12; dargs.year--; }
		this.month_start_epoch = get_time_from_args( dargs );
		this.redraw();
	},
	
	nextMonth: function() {
		// jump to next month
		var dargs = get_date_args( this.month_start_epoch );
		dargs.mon++; if (dargs.mon > 12) { dargs.mon = 1; dargs.year++; }
		this.month_start_epoch = get_time_from_args( dargs );
		this.redraw();
	}
	
}; // Calendar
