
var Popover = {
	
	enabled: false,
	onDetach: null,
	isSafari: !!(navigator.userAgent.match(/Safari/) && !navigator.userAgent.match(/(Chrome|Opera|Edge)/)),
	
	attach: function(elem, html, shrinkwrap) {
		if (this.enabled) this.detach();
		var $elem = $(elem);
		var rect = this.isSafari ? this.getBoundingClientRect($elem[0]) : $elem[0].getBoundingClientRect();
		var win = get_inner_window_size();
		
		var $box = $('<div class="arrow_box"></div>').html(html).css({
			left: '-9999px'
		});
		if (!shrinkwrap) $box.css('width', '' + Math.floor( rect.width ) + 'px');
		
		if ($elem.data('popover-z-index')) $box.css('z-index', $elem.data('popover-z-index'));
		
		$('body').append( $box );
		
		this.$box = $box;
		this.rect = rect;
		this.enabled = true;
		this.$anchor = $elem;
		
		setTimeout( function() {
			var width = $box.width();
			var height = $box.height();
			
			if (height + 16 < rect.top) {
				$box.css('top', '' + Math.floor( rect.top - height - 16 ) + 'px');
				$box.addClass('bottom');
			}
			else {
				$box.css('top', '' + Math.floor( rect.bottom + 16 ) + 'px');
				$box.addClass('top');
			}
			
			if (shrinkwrap) {
				var left = Math.floor( (rect.left + (rect.width / 2)) - (width / 2) );
				var adj = 0;
				if (left < 20) {
					adj = 20 - left;
					left += adj;
				}
				else if (left + width > win.width - 20) {
					adj = (win.width - 20) - (left + width);
					left += adj;
					adj++;
				}
				$box.css('left', '' + left + 'px');
				if (adj) $box.css('--arrow-left', 'calc(50% - ' + adj + 'px)');
			}
			else $box.css('left', '' + Math.floor( rect.left ) + 'px');
			
			if ($('#popoverlay').length) {
				$('#popoverlay').stop().remove();
			}
			
			var $overlay = $('<div id="popoverlay"></div>').css('opacity', 0);
			$('body').append($overlay);
			$overlay.click( function() { Popover.detach(); } );
			
			if (!$elem.data('popover-hide-overlay')) {
				$overlay.fadeTo( 500, 0.5 );
			}
			
			if (!Dialog.active) unscroll();
		}, 1 );
	},
	
	detach: function() {
		if (this.enabled) {
			this.$box.remove();
			this.enabled = false;
			delete this.$anchor;
			$('#popoverlay').stop().fadeOut( 300, function() { $(this).remove(); } );
			if (!Dialog.active) unscroll.reset();
			
			if (this.onDetach) {
				// one time hook for detach
				var callback = this.onDetach;
				this.onDetach = null;
				callback();
			}
			this.onKeyDown = null;
		}
	},
	
	reposition: function() {
		// box has changed size, so reposition it
		if (this.$box.hasClass('bottom')) {
			var height = this.$box.height();
			this.$box.css('top', '' + Math.floor( this.rect.top - height - 16 ) + 'px');
		}
	},
	
	handleKeyDown: function(event) {
		// intercept keydown for custom actions
		if (!this.enabled) return;
		
		if (this.onKeyDown) {
			this.onKeyDown(event);
		}
		else if (event.keyCode == 27) {
			event.preventDefault();
			this.detach();
		}
	},
	
	getBoundingClientRect: function(el) {
		// custom version of getBoundingClientRect that works in safari
		// supports zoom, fixed and scrolling elements
		if (!(el instanceof Element)) throw new TypeError("Expected an Element");
		
		let x = 0, y = 0;
		let current = el;
		let encounteredFixed = false;
		let scale = 1;
		
		while (current) {
			const style = window.getComputedStyle(current);
			const zoom = parseFloat(style.zoom) || 1;
			const position = style.position;
			
			if (position === 'fixed') {
				const rect = current.getBoundingClientRect();
				x += rect.left * zoom;
				y += rect.top * zoom;
				scale *= zoom;
				encounteredFixed = true;
				break;
			}
			
			x = (x + current.offsetLeft - current.scrollLeft) * zoom;
			y = (y + current.offsetTop - current.scrollTop) * zoom;
			scale *= zoom;
			
			current = current.offsetParent;
		}
		
		if (!encounteredFixed) {
			x -= window.pageXOffset;
			y -= window.pageYOffset;
		}
		
		const width = el.offsetWidth * scale;
		const height = el.offsetHeight * scale;
		
		return {
			x, y,
			width, height,
			top: y,
			left: x,
			right: x + width,
			bottom: y + height
		};
	}
	
};
