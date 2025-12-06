// Dialog Tools
// Author: Joseph Huckaby

var Dialog = {
	
	active: false,
	clickBlock: false,
	progress: null,
	onHide: null,
	
	show: function(html, click_block) {
		// show dialog, auto-size and center
		this.clickBlock = click_block || false;
		
		var temp = $('<div/>').addClass('dialog').css({
			position: 'absolute',
			visibility: 'hidden'
		}).html(html).appendTo('body');
		
		// var width = temp.width();
		// var height = temp.height();
		var width = temp[0].offsetWidth;
		var height = temp[0].offsetHeight;
		temp.remove();
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		if ($('#dialog_overlay').length) {
			$('#dialog_overlay').stop().remove();
		}
		
		var $overlay = $('<div id="dialog_overlay"></div>').css('opacity', 0);
		$('body').append($overlay);
		
		$overlay.fadeTo( 500, 0.75 ).on('click', function() {
			if (!Dialog.clickBlock) {
				if (Dialog.active == 'confirmation') Dialog.confirm_click(false);
				else Dialog.hide();
			}
		});
		
		if ($('#dialog').length) {
			$('#dialog').stop().remove();
		}
		
		var $dialog = $('<div id="dialog" class="dialog" role="dialog" aria-modal="true"></div>').css({
			opacity: 0,
			left: '' + x + 'px',
			top: '' + y + 'px'
		}).html( html );
		
		$('body').append($dialog);
		$dialog.fadeTo( 250, 1.0 );
		
		this.active = true;
		unscroll();
		
		// buttonize all buttons
		app.buttonize( $dialog );
	},
	
	autoResize: function() {
		// automatically resize dialog to match changed content size
		if (!this.active) return;
		
		var $dialog = $('#dialog');
		// var width = $dialog.width();
		// var height = $dialog.height();
		var width = $dialog[0].offsetWidth;
		var height = $dialog[0].offsetHeight;
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		$dialog.css({
			left: '' + x + 'px',
			top: '' + y + 'px'
		});
	},
	
	hide: function() {
		// hide dialog
		if (this.active) {
			$('#dialog').stop().fadeOut( 250, function() { $(this).remove(); } );
			$('#dialog_overlay').stop().fadeOut( 300, function() { $(this).remove(); } );
			this.active = false;
			unscroll.reset();
			
			if (this.onHide) {
				// one time hook for hide
				var callback = this.onHide;
				this.onHide = null;
				callback();
			}
		}
	},
	
	hideProgress: function() {
		// hide progress dialog
		this.hide();
		delete this.progress;
	},
	
	showProgress: function(counter, title) {
		// show or update progress bar
		if (!$('#d_progress_bar').length) {
			// no progress dialog is active, so set it up
			if (!counter) counter = 0;
			if (counter < 0) counter = 0;
			if (counter > 1) counter = 1;
			var cx = Math.floor( counter * 196 );
			
			var html = '';
			html += '<div style="padding:15px;">';
			html += '<div id="d_progress_title" class="dialog_title" style="text-align:center; margin-bottom:15px;">' + title + '</div>';
			
			var extra_classes = '';
			if (counter == 1.0) extra_classes = 'indeterminate';
			
			html += '<div id="d_progress_bar_cont" class="progress_bar_container '+extra_classes+'" style="width:196px; margin:0 auto 0 auto;">';
				html += '<div id="d_progress_bar" class="progress_bar_inner" style="width:'+cx+'px;"></div>';
			html += '</div>';
			
			html += '</div>';
			app.hideMessage();
			this.show( html, true );
			
			this.progress = {
				start_counter: counter,
				counter: counter,
				counter_max: 1,
				start_time: hires_time_now(),
				last_update: hires_time_now(),
				title: title
			};
		}
		else if (this.progress) {
			// progress dialog is active, so update existing elements
			var now = hires_time_now();
			var cx = Math.floor( counter * 196 );
			$('#d_progress_bar').css( 'width', '' + cx + 'px' );
			
			var prog_cont = $('#d_progress_bar_cont');
			if ((counter == 1.0) && !prog_cont.hasClass('indeterminate')) prog_cont.addClass('indeterminate');
			else if ((counter < 1.0) && prog_cont.hasClass('indeterminate')) prog_cont.removeClass('indeterminate');
			
			if (title) this.progress.title = title;
			$('#d_progress_title').html( this.progress.title );
			
			this.progress.last_update = now;
			this.progress.counter = counter;
		}
	},
	
	showSimpleDialog: function(title, inner_html, buttons_html) {
		// show simple dialog with title, content and buttons
		var html = '';
		html += '<div class="dialog_title">' + title + '</div>';
		html += '<div class="dialog_content">' + inner_html + '</div>';
		html += '<div class="dialog_buttons">' + buttons_html + '</div>';
		
		this.show( html );
		
		// add hover tooltips to mobile_collapse buttons
		$('#dialog .dialog_buttons .button.mobile_collapse').each( function() {
			var $this = $(this);
			$this.attr('title', $this.find('span').text() );
		} );
	},
	
	confirm: function(title, html, ok_btn_label, callback) {
		// show simple OK / Cancel dialog with custom text
		// fires callback with true (OK) or false (Cancel)
		if (!ok_btn_label) ok_btn_label = ['check-circle', "OK"];
		this.confirm_callback = callback;
		
		var inner_html = "";
		if (html.match(/^</)) inner_html = html;
		else inner_html += '<div class="confirm_container">'+html+'</div>';
		
		if (isa_array(ok_btn_label)) {
			ok_btn_label = '<i class="mdi mdi-' + ok_btn_label[0] + '">&nbsp;</i><span>' + ok_btn_label[1] + '</span>';
		}
		
		var buttons_html = "";
		buttons_html += '<div id="btn_dialog_cancel" class="button" onClick="Dialog.confirm_click(false)"><i class="mdi mdi-close-circle-outline">&nbsp;</i>Cancel</div>';
		buttons_html += '<div id="btn_dialog_confirm" class="button primary" onClick="Dialog.confirm_click(true)">' + ok_btn_label + '</div>';
		
		this.showSimpleDialog( title, inner_html, buttons_html );
		
		// special mode for key capture
		Dialog.active = 'confirmation';
		
		setTimeout( function() {
			// hold alt/opt key to immediately click default button
			if (app.lastClick.altKey) return Dialog.confirm_click(true);
		}, 1 );
	},
	
	confirmDanger: function(title, html, ok_btn_label, callback) {
		// show simple OK / Cancel dialog with custom text
		// fires callback with true (OK) or false (Cancel)
		if (!ok_btn_label) ok_btn_label = ['check-circle', "OK"];
		this.confirm_callback = callback;
		
		var inner_html = "";
		if (html.match(/^</)) inner_html = html;
		else inner_html += '<div class="confirm_container">'+html+'</div>';
		
		if (isa_array(ok_btn_label)) {
			ok_btn_label = '<i class="mdi mdi-' + ok_btn_label[0] + '">&nbsp;</i><span>' + ok_btn_label[1] + '</span>';
		}
		
		var buttons_html = "";
		buttons_html += '<div id="btn_dialog_cancel" class="button" onClick="Dialog.confirm_click(false)"><i class="mdi mdi-close-circle-outline">&nbsp;</i>Cancel</div>';
		buttons_html += '<div id="btn_dialog_confirm" class="button delete" onClick="Dialog.confirm_click(true)">'+ok_btn_label+'</div>';
		
		this.showSimpleDialog( '<span class="danger">' + title + '</span>', inner_html, buttons_html );
		
		// special mode for key capture
		Dialog.active = 'confirmation';
		
		setTimeout( function() {
			// change aria role for danger type
			$('#dialog').attr('role', 'alertdialog');
			
			// hold alt/opt key to immediately click default button
			if (app.lastClick.altKey) return Dialog.confirm_click(true);
		}, 1 );
	},
	
	confirm_click: function(result) {
		// user clicked OK or Cancel in confirmation dialog, fire callback
		// caller MUST deal with Dialog.hide() if result is true
		if (this.confirm_callback) {
			this.confirm_callback(result);
			if (!result) this.hide();
		}
	},
	
	confirm_key: function(event) {
		// handle keydown with active confirmation dialog
		if ((this.active === 'editor') && (event.keyCode == 27)) {
			// enable esc key for editor dialogs (codemirror)
			Dialog.hide();
			return;
		}
		
		if (this.active !== 'confirmation') return;
		if ((event.keyCode != 13) && (event.keyCode != 27)) return;
		
		// skip enter check if textarea is active
		if (document.activeElement && (event.keyCode == 13)) {
			if ($(document.activeElement).prop('type') == 'textarea') return;
		}
		
		event.stopPropagation();
		event.preventDefault();
		
		if (event.keyCode == 13) this.confirm_click(true);
		else if (event.keyCode == 27) this.confirm_click(false);
	}
	
};

// Code Editor

var CodeEditor = {
	
	active: false,
	onHide: null,
	onDragDrop: null,
	
	show: function(html) {
		// show dialog, auto-size and center
		var temp = $('<div/>').addClass('dialog').css({
			position: 'absolute',
			visibility: 'hidden'
		}).html(html).appendTo('body');
		
		// var width = temp.width();
		// var height = temp.height();
		var width = temp[0].offsetWidth;
		var height = temp[0].offsetHeight;
		temp.remove();
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		if ($('#ceditor_overlay').length) {
			$('#ceditor_overlay').stop().remove();
		}
		
		var $overlay = $('<div id="ceditor_overlay"></div>').css('opacity', 0);
		$('body').append($overlay);
		
		$overlay.fadeTo( 500, 0.75 ).on('click', function() {
			CodeEditor.hide();
		});
		
		if ($('#ceditor').length) {
			$('#ceditor').stop().remove();
		}
		
		var $dialog = $('<div class="dialog" id="ceditor" role="dialog" aria-modal="true"></div>').css({
			opacity: 0,
			left: '' + x + 'px',
			top: '' + y + 'px'
		}).html( html );
		
		$('body').append($dialog);
		$dialog.fadeTo( 250, 1.0 );
		
		this.active = true;
		
		// only do the unscroll thing if another dialog isn't active under us
		if (!Dialog.active) unscroll();
		
		// if dialog is active under us, remove its modal role
		if (Dialog.active) {
			$('#dialog').removeAttr('aria-modal').attr('aria-hidden', 'true');
		}
		
		// buttonize all buttons
		app.buttonize( $dialog );
	},
	
	autoResize: function() {
		// automatically resize dialog to match changed content size
		if (!this.active) return;
		
		var $dialog = $('#ceditor');
		// var width = $dialog.width();
		// var height = $dialog.height();
		var width = $dialog[0].offsetWidth;
		var height = $dialog[0].offsetHeight;
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		$dialog.css({
			left: '' + x + 'px',
			top: '' + y + 'px'
		});
	},
	
	hide: function() {
		// hide dialog
		if (this.active) {
			$('#ceditor').stop().fadeOut( 250, function() { $(this).remove(); } );
			$('#ceditor_overlay').stop().fadeOut( 300, function() { $(this).remove(); } );
			this.active = false;
			
			// only release scroll lock if another dialog isn't active under us
			if (!Dialog.active) unscroll.reset();
			
			// if dialog is active under us, restore its modal role
			if (Dialog.active) {
				$('#dialog').attr('aria-modal', 'true').removeAttr('aria-hidden');
			}
			
			if (this.onHide) {
				// one time hook for hide
				var callback = this.onHide;
				this.onHide = null;
				callback();
			}
			
			this.onDragDrop = null;
			this.onKeyDown = null;
		}
	},
	
	showSimpleDialog: function(title, inner_html, buttons_html) {
		// show simple dialog with title, content and buttons
		var html = '';
		html += '<div class="dialog_title">' + title + '</div>';
		html += '<div class="dialog_content">' + inner_html + '</div>';
		html += '<div class="dialog_buttons">' + buttons_html + '</div>';
		
		this.show( html );
		
		// add hover tooltips to mobile_collapse buttons
		$('#ceditor .dialog_buttons .button.mobile_collapse').each( function() {
			var $this = $(this);
			$this.attr('title', $this.find('span').text() );
		} );
	},
	
	handleKeyDown: function(event) {
		// intercept keydown for custom actions
		if (!this.active) return;
		
		if (this.onKeyDown) {
			this.onKeyDown(event);
		}
		else if (event.keyCode == 27) {
			event.preventDefault();
			this.hide();
		}
	},
	
}; // CodeEditor
