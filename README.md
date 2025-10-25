# Overview

The **pixl-xyapp** package is a client-side JavaScript/CSS framework, designed for the [xyOps Web Application](https://xyops.io).  It consists of a number of JavaScript classes, utility functions, and basic CSS elements (header, tabs, dialogs, progress bars, form elements, etc.).  [jQuery](http://jquery.com/) is required for all features to work properly.

# Usage

You can use [npm](https://www.npmjs.com/) to install the module:

```
	npm install pixl-xyapp
```

Or just download the files from the [GitHub repo](https://github.com/pixlcore/pixl-xyapp).  There is no installation script.  This is basically just a collection of JavaScript, CSS and web fonts that you must include manually.

It is important that you include the JavaScript files in the proper order.  You can of course use tools such as [UglifyJS](https://www.npmjs.com/package/uglify-js) to compact them all together into a single blob for distribution.  But for development, it is best to include them separately.  For example, the CSS:

```html
	<link rel="stylesheet" href="css/normalize.css">
	<link rel="stylesheet" href="css/base.css">
	<link rel="stylesheet" href="css/YOUR-OWN-STYLE.css">
```

And the JavaScript:

```html
	<script src="js/common/misc.js"></script>
	<script src="js/common/tools.js"></script>
	<script src="js/common/datetime.js"></script>
	<script src="js/common/page.js"></script>
	<script src="js/common/dialog.js"></script>
	<script src="js/common/popover.js"></script>
	<script src="js/common/select.js"></script>
	<script src="js/common/calendar.js"></script>
	<script src="js/common/base.js"></script>
	<script src="js/YOUR-APP-CODE.js"></script>
```

## Configuration

The app framework requires a configuration object to be loaded into `window.config` and copied in `app.config`.  This can be loaded however you like (inline script tag, etc.).  An simple example is shown here (taken from the demo app):

```javascript
	window.config = app.config = {
		// Define all app's pages in 'Page' array
		Page: [
			{ ID: 'Home' },
			{ ID: 'MoreDemos' }
		],
		
		// Which page to load by default (if not in URL hash)
		DefaultPage: 'Home'
	};
```

The only required properties in the configuration object are the `Page` array, which contains objects for each of your pages (more on this below in [Pages](#pages)), and the `DefaultPage` string, which declares which page loads by default.  Everything else is optional, and this structure can be extended for your own uses.

## Main Application

Your main application object is located in the global scope under the name `app`.  It is a plain object with variables and classes you can override, and of course add your own.  You can use the built-in `extend()` method to add your own properties and methods, if you like.  Example:

```javascript
	app.extend({
		
		// This name will appear in the window title
		name: 'My App',
		
		// init() is called on page load
		init: function() {
			// initialize application
			
			// Setup page manager for tabs
			this.page_manager = new PageManager( config.Page );
			
			// start monitoring URL hash changes for page transitions
			Nav.init();
		}
		
	});
```

The first thing you need to do is add a `name` property, set to the name of your application.  This is used in a number of places (such as window titles).  Also, an `init()` method, which is called when the DOM is ready.

The only other requirement is the `init()` method, in which you need to construct a `PageManager()` instance, passing it your `Page` array from the configuration object, and assigning it to `this.page_manager` (must be exact).  Then call `Nav.init()` to start the page navigation system.  You can also add your own application startup tasks here.

Feel free to extend this object with whatever properties or methods your app requires.

## Pages

Each "page" in your web application is virtual.  It's basically a DIV that is shown when the page is activated, hidden when deactivated, and a JavaScript class upon which methods are called when the page state changes (activated, deactivated, etc.).  Each page has a unique ID, which must first be defined in your configuration:

```javascript
	{
		Page: [
			{ ID: 'Home' },
			{ ID: 'MoreDemos' }
		],
		DefaultPage: 'Home'
	}
```

In this example your HTML should be setup like this:

```html
	<div id="main" class="main">
		<div id="page_Home" style="display:none"></div>
		<div id="page_MoreDemos" style="display:none"></div>
	</div>
```

Finally, each virtual page in your app should inherit from the `Page` base class.  It contains placeholders for all the methods you can override (described below), as well as a few utility methods for rendering tables and tabs.

Here is an example class, showing the bare minimum you'll need to add:

```javascript
	Class.subclass( Page, "Page.Home", {	
		
		onInit: function() {
			// called once at page load
			var html = '';
			
			// include initial HTML here, if you want
			
			this.div.html( html );
		},
		
		onActivate: function(args) {
			// page activation
			if (!args) args = {};
			this.args = args;
			
			app.setWindowTitle('Home');
			app.showTabBar(true);
			
			// activate page here (show live / updated content)
			var html = 'Hello there!';
			this.div.html( html );
			
			return true;
		},
		
		onDeactivate: function() {
			// called when page is deactivated
			return true;
		}
		
	} );
```

You have the choice of including your HTML markup in the `index.html` file, or building the HTML as a string in the `onInit()` method (called *only once*), or building the HTML as a string in the `onActivate()` method (called *every time* your page is activated).

### onInit

The `onInit()` method is called on your page only once, at load time.  This allows you to setup things like initial HTML markup (or you can just put this in the `index.html` file), and any other initialization tasks your page might need.  A `div` property points to your page's DIV element (jQuery wrapped).

The function takes no arguments, and there is no return value.

### onActivate

The `onActivate()` method is called *every time* your page is activated.  Your DIV is automatically shown, but you can use this method to update the page contents if you want.

Your function may be passed an `args` object, if the URL hash contains a query string.  For example:

```
	http://myapp.com/#Home?foo=bar&baz=1234
```

This URL would load the `Home` virtual page, and the `onActivate()` method would be passed an `args` object containing:

```javascript
	{
		foo: "bar",
		baz: 1234
	}
```

Another typical thing to do in your `onActivate()` method is to call `app.setWindowTitle()` to set the browser window / tab title, and `app.showTabBar()` to show the tab bar:

```javascript
	app.setWindowTitle('Home');
	app.showTabBar(true);
```

The window title will contain the page name, *and* your application name, taken from `app.name`.  Showing the tab bar is typical for most web apps and pages, but there are exceptions.  For example, a "login" page may not want to show the tab bar.  See [Tabs](#tabs) below for more on this.

Your `onActivate()` method *must* return either `true` or `false`.  Returning `true` means that the page accepted the activation, and the app can proceed.  Returning `false` means that something went wrong (error or other), and the page should *not* be activated.  In this case the page remains hidden and the *previous* page's DIV is still displayed.

### onDeactivate

The `onDeactivate()` method is called when your page is deactivated.  Meaning, the user is navigating to another virtual page in the app.  Your method is passed the ID of the new page being activated:

```javascript
	onDeactivate: function(new_id) {
		// called when page is deactivated
		return true;
	}
```

You can use this method to shut down or cleanup things happening in the page.  For example: timers, IFRAMEs, or anything else that should be stopped.  You may want to clear your entire DIV element (if your `onActivate()` redraws everything, for example).

Your `onDeactivate()` method *must* return either `true` or `false`.  Returning `true` means that the page accepted the deactivation, and the app can proceed.  Returning `false` means that something went wrong (error or other), and the page should *not* be deactivated.  In this case the current page remains displayed.

### Accessing Pages

You can access any page by looking it up by its ID.  This is done by calling the `page_manager` object in the `app` global.  It provides a `find()` method that accepts an ID string.  Example:

```javascript
	var page = app.page_manager.find('Home');
```

There is a global shortcut for this, available by calling `$P()`.  It also accepts a Page ID, but if omitted, it defaults to the current page.  This is very useful for getting back into the context of the page from an inline HTML callback.

```javascript
	var page = $P('Home');
	var cur_page = $P();
```

## Navigation

The built-in navigation system listens for URL hash change events, and switches virtual pages based on the anchor tag present in the URL.  Example:

```
	http://myapp.com/#Home
```

This would activate the virtual page with ID `Home`.  It also supports URL query string params after the page ID, which are passed to the page class `onActivate()` method.  Example:

```
	http://myapp.com/#Home?foo=bar&baz=1234
```

So a typical way of triggering a page change event is to simply redirect the browser to a new hash anchor tag.  However, some convenience methods are also provided:

### Nav.go

This forces a page change event, and accepts a new anchor tag, optionally with a query string at the end.

```javascript
	Nav.go('SomePage');
	Nav.go('SomePage?foo=bar');
```

### Nav.refresh

This refreshes the current page (calls `onDeactivate()`, then `onActivate()`).

```javascript
	Nav.refresh();
```

### Nav.prev

This jumps back to the previous page.

```javascript
	Nav.prev();
```

### Nav.currentAnchor

This returns the name of the current anchor, including query string if present.

```javascript
	var loc = Nav.currentAnchor();
```

## Tables

The library provides CSS styles and JavaScript functions for creating data tables, optionally with pagination.  The HTML markup is simple; just use CSS class `data_table`, then provide your headers in `<TH>` elements, and your data in `<TD>` elements.  HTML example of a simple table:

```html
	<table class="data_table">
		<tr>
			<th>Username</th>
			<th>Full Name</th>
			<th>Status</th>
			<th>Created</th>
			<th>Modified</th>
		</tr>
		<tr>
			<td>jhuckaby</td>
			<td>Joseph Huckaby</td>
			<td>Administrator</td>
			<td>Jan 3, 2014</td>
			<td>Oct 5, 2015</td>
		</tr>
		<tr>
			<td>fsmith</td>
			<td>Fred Smith</td>
			<td>Standard User</td>
			<td>Oct 5, 2015</td>
			<td>Oct 5, 2015</td>
		</tr>
	</table>
```

In addition to the CSS, a pagination system is provided, to assist you with generating tables from a large dataset that have pagination links built-in.  The function to call is `this.getPaginatedTable()` and is available in the `Page` base class.  It returns the final rendered HTML for the page.

To use it, you'll need to provide an object containing the following pieces of information:

| Property Name | Description |
|---------------|-------------|
| `cols` | An array of header column labels, displayed in bold at the top of the table. |
| `rows` | The current page of data (array).  Each element is passed to your callback for each visible row of the table. |
| `data_type` | A string identifying the type of data, e.g. `user`.  Used in strings such as `No users found`. |
| `offset` | The current offset into the full dataset.  This should be `0` for the first page. |
| `limit` | The number of items shown on each page.  This should equal the length of the `rows` array. |
| `total` | The total number of items in the dataset.  This is used to render proper pagination links. |
| `callback` | A user callback which is fired for each row, so you can provide your own `<TD>` elements. |

Here is an example:

```javascript
	var cols = [
		'Name', 'Color', 'Size', 'Quantity', 'Price', 'Created'
	];
	
	var rows = [
		{ name: 'Celery', color: 'Green', size: '1ft', quantity: 450, price: '$2.75', created: 1442984544 },
		{ name: 'Beets', color: 'Purple', size: '4in', quantity: 30, price: '$3.50', created: 1442380043 },
		{ name: 'Lettuce', color: 'Green', size: '1ft', quantity: 1000, price: '$2.50', created: 1442264863 },
		{ name: 'Carrots', color: 'Orange', size: '8in', quantity: 60, price: '$4.00', created: 1442084869 },
		{ name: 'Rhubarb', color: 'Purple', size: '2ft', quantity: 190, price: '$3.99', created: 1441724876 }
	];
	
	var html = this.getPaginatedTable({
		cols: cols,
		rows: rows,
		data_type: 'vegetable',
		offset: 0,
		limit: 5,
		total: 10,
		
		callback: function(row, idx) {
			return [
				row.name,
				row.color,
				row.size,
				commify( row.quantity ),
				row.price,
				get_nice_date_time( row.created )
			];
		}
	});
```

So the idea here is, we have a dataset of 10 items total, but we are only showing 5 items per page.  So we have an array of 5 items in `rows`, but we're specifying the `total` as 10, and `offset` as 0 (first page).  Based on this, the `getPaginatedTable()` will generate the proper pagination links.

Your callback is fired once per row, and is passed the current row (array element from `rows`), and the localized index in `idx` (starts from `0` regardless of `offset`).  Your function should return an array of values which should match up with the `cols`, and each will be stuffed into a `<TD>` element.

The pagination links work by constructing self-referencing URL to the current page, but adding or modifying an `offset` query parameter, set to the appropriate value.  For example, in this case there would be a `Next Page` link, which would be set to:

```
	http://myapp.com/#Home?foo=bar&baz=1234&offset=5
```

Since the `limit` is set to 5 items per page, and `offset` starts at `0`, then the next page (page 2) will be at offset `5`.  This link is simply a hashtag anchor tag, which doesn't reload the browser page, but will instead be caught by the navigation system, and call your page's `onDeactivate()` then its `onActivate()` with the new values.  It is up to your page code to redraw the table with the new data chunk and new `offset` value.

Instead of generating hashtag anchor links, you can optionally provide a custom JavaScript function in a `pagination_link` property, which will be written into the HTML as an `onClick` handler on each link, and called instead of a standard link.  Note that it must be a string and globally accessible, so remember the `$P()` shortcut to get access to the current page.  Example:

```javascript
	pagination_link: '$P().tableNavClick'
```

In this case your custom page `tableNavClick()` method will be called for each table pagination click, and passed the new offset value.

## Notification

Notification messages are shown in a fixed bar at the top of the screen, regardless of the scroll position.  Messages can have one of three styles (highlight color), and custom HTML.  They can remain in place until clicked, or disappear after N seconds.  Only one notification may be shown at a time.

To use the notification system in your app, make sure this markup is in your main HTML page:

```html
	<div id="d_message" class="message" style="display:none" onClick="app.hideMessage(250)">
		<div id="d_message_inner" class="message_inner"></div>
	</div>
```

Then, call `app.showMessage()` and pass in a style name (see below), a text or HTML message string, and optionally a lifetime (number of seconds before it auto-hides).  Here are the three supported message styles:

| Style | Description |
|-------|-------------|
| `success` | Highlighted in green, used for successful completion messages.  By default, these automatically hide after 8 seconds. |
| `warning` | Highlighted in yellow, used for warning messages.  By default these are persistent until user click. |
| `error` | Highlighted in red, used for error messages.  By default these are persistent until user click. |

Example use:

```javascript
	app.showMessage( 'success', "The user was saved successfully.", 8 );
```

To programmatically hide the notification message, call `app.hideMessage()`.  You can optionally pass in a number of milliseconds to animate the hide, if you want (uses jQuery's animation system).

For form field validation errors, you can call `app.badField()` and pass in the DOM ID (or CSS selector) of the form field containing an invalid value, and an error message.  The form field will be focused, highlighted in red (background color, works well for text fields), and an error message notification will be displayed.  To clear an error, call `app.clearError()`.

```javascript
	app.badField( '#my_username', "Usernames must contain alphanumeric characters only." );
```

If you include [Font Awesome Icons](https://fortawesome.github.io/Font-Awesome/icons/) in your HTML page, the notification messages will also contain an appropriate icon matching the style:

```html
	<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
```

## API

The library contains a simple JSON REST API wrapper built around jQuery's [$.ajax()](http://api.jquery.com/jquery.ajax/) call, designed to support JSON API backends.  API calls can be sent to the server using HTTP GET or POST, and JSON responses are parsed for you.  Errors are handled automatically, but you can specify custom handlers as well.

By default, API calls are sent to the same hostname as the one hosting the page, using the URI `/api/COMMAND`, where `COMMAND` is a custom command passed in, e.g. `/api/user_login`.  You can change the base API URL by calling `app.setAPIBaseURL()`.  Example:

```javascript
	app.setAPIBaseURL( '/myapp/API.php' );
	app.setAPIBaseURL( 'http://myotherserver.com/myapp/API.php' );
```

To send an API call, use `app.api.get()` or `app.api.post()` depending on whether you want an HTTP GET or HTTP POST.  Pass in a command name (is appended to the base URI), a params object (serialized to JSON or a query string), and a callback.  Example:

```javascript
	app.api.post( 'user_login', { username: 'joe', password: '12345' }, function(resp) {
		// successfully logged user in
		// 'resp' is response JSON from server
	} );
```

So this example would send an HTTP POST to `/api/user_login`, and serialize the params into JSON, sent as the body of the post.  The response is expected to be in JSON, and is parsed and sent to the callback.

Sending an HTTP GET is similar. Just call `app.api.get()` instead, and note that the params object is serialized into a URL query string, not a JSON POST body.  The response and callback are handled the same.  Example:

```javascript
	app.api.get( 'user_get_info', { username: 'joe' }, function(resp) {
		// successfully fetched user info
		// 'resp' is response JSON from server
	} );
```

API errors are handled automatically by default, meaning your callback is *not* fired, and instead an error notification is displayed.  This includes HTTP related errors, as well as errors specified inside the response JSON.  The API system expects the response to include a `code` property, and if this is non-zero, it is considered an error, and it looks for a `description` property for the error message.

To set a custom error handler, specify a second callback after the first one:

```javascript
	app.api.post( 'user_login', { username: 'joe', password: '12345' },
		function(resp) {
			// successfully logged user in
			// 'resp' is response JSON from server
		},
		function(err) {
			// an error occurred
			// see err.code and err.description
		}
	);
```

## Misc

### Page Resize

If your pages need to take special action when the browser is resized, you can define an `onResize()` method in your page classes.  This is fired for every browser resize event, and your method is passed an object containing the new inner window `width` and `height` in pixels.  Example:

```javascript
	onResize: function(size) {
		// window was resized
		// see 'size.width' and 'size.height'
	}
```

### Page Unload

If you need to intercept the user navigating away from the app entirely or closing the browser tab/window, you can define an `onBeforeUnload()` method in your page classes.  This method should return a text message to be displayed, if you want to intercept the event and alert the user, or return `false` to allow the app to shut down without any intervention.  Example:

```javascript
	onBeforeUnload: function() {
		// if dirty, warn user before navigating away from app
		if (this.dirty) return "There are unsaved changes in this document.  If you leave now they will be abandoned.";
		else return false;
	}
```

This example assumes your page class has a `dirty` property, which is `true` when the user has made changes which are unsaved.

Please note that alerting the user in this way is very jarring and disruptive, and should *only* be done when there really is a good reason to keep the user on the page, i.e. unsaved changes that will be lost forever.

# License

See `LICENSE.md` in this repository.
