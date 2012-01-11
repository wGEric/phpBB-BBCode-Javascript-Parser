var bbcodeParser = {};

(function() {
	var token_match = /{[A-Z_]+[0-9]*}/g;

	// regular expressions for the different bbcode tokens
	bbcodeParser.tokens = {
		'URL'			: '((?:(?:[a-z][a-z\\d+\\-.]*:\\/{2}(?:(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})+|[0-9.]+|\\[[a-z0-9.]+:[a-z0-9.]+:[a-z0-9.:]+\\])(?::\\d*)?(?:\\/(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})*)*(?:\\?(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?(?:#(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?)|(?:www\\.(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})+(?::\\d*)?(?:\\/(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})*)*(?:\\?(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?(?:#(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?)))',
		'LOCAL_URL'		: '((?:[a-z0-9\-._~\!$&\'()*+,;=:@|]+|%[\dA-F]{2})*(?:\/(?:[a-z0-9\-._~\!$&\'()*+,;=:@|]+|%[\dA-F]{2})*)*(?:\?(?:[a-z0-9\-._~\!$&\'()*+,;=:@\/?|]+|%[\dA-F]{2})*)?(?:#(?:[a-z0-9\-._~\!$&\'()*+,;=:@\/?|]+|%[\dA-F]{2})*)?)',
		'EMAIL'			: '((?:[\\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*(?:[\\w\!\#$\%\'\*\+\-\/\=\?\^\`{\|\}\~]|&)+@(?:(?:(?:(?:(?:[a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(?:\\d{1,3}\.){3}\\d{1,3}(?:\:\\d{1,5})?))',
		'TEXT'			: '(.*?)',
		'SIMPLETEXT'	: '([a-zA-Z0-9-+.,_ ]+)',
		'INTTEXT'		: '([a-zA-Z0-9-+,_. ]+)',
		'IDENTIFIER'	: '([a-zA-Z0-9-_]+)',
		'COLOR'			: '([a-z]+|#[0-9abcdef]+)',
		'NUMBER'		: '([0-9]+)'
	};

	// matches for bbcode to html
	bbcodeParser.bbcode_matches = [];

	// html templates for bbcode to html
	bbcodeParser.html_tpls = [];

	// matches for html to bbcode
	bbcodeParser.html_matches = [];

	// bbcode templates for bbcode to html
	bbcodeParser.bbcode_tpls = [];

	/**
	 * Turns a bbcode into a regular rexpression by changing the tokens into
	 * their regex form
	 */
	bbcodeParser._getRegEx = function(str) {
		var matches = str.match(token_match);
		var i = 0;
		var replacement = '';

		if (matches.length <= 0) {
			// no tokens so return the escaped string
			return new RegExp(preg_quote(str), 'g');
		}

		for(; i < matches.length; i += 1) {
			// Remove {, } and numbers from the token so it can match the
			// keys in bbcodeParser.tokens
			var token = matches[i].replace(/[{}0-9]/g, '');

			if (bbcodeParser.tokens[token]) {
				// Escape everything before the token
				replacement += preg_quote(str.substr(0, str.indexOf(matches[i]))) + bbcodeParser.tokens[token];

				// Remove everything before the end of the token so it can be used
				// with the next token. Doing this so that parts can be escaped
				str = str.substr(str.indexOf(matches[i]) + matches[i].length);
			}
		}

		// add whatever is left to the string
		replacement += preg_quote(str);

		return new RegExp(replacement, 'gi');
	};

	/**
	 * Turns a bbcode template into the replacement form used in regular expressions
	 * by turning the tokens in $1, $2, etc.
	 */
	bbcodeParser._getTpls = function(str) {
		var matches = str.match(token_match);
		var i = 0;
		var replacement = '';
		var positions = {};
		var next_position = 0;

		if (matches.length <= 0) {
			// no tokens so return the string
			return str;
		}

		for(; i < matches.length; i += 1) {
			// Remove {, } and numbers from the token so it can match the
			// keys in bbcodeParser.tokens
			var token = matches[i].replace(/[{}0-9]/g, '');
			var position;

			// figure out what $# to use ($1, $2)
			if (positions[matches[i]]) {
				// if the token already has a position then use that
				position = positions[matches[i]];
			} else {
				// token doesn't have a position so increment the next position
				// and record this token's position
				next_position += 1;
				position = next_position;
				positions[matches[i]] = position;
			}

			if (bbcodeParser.tokens[token]) {
				replacement += str.substr(0, str.indexOf(matches[i])) + '$' + position;
				str = str.substr(str.indexOf(matches[i]) + matches[i].length);
			}
		}

		replacement += str;

		return replacement;
	};

	/**
	 * Adds a bbcode to the list
	 */
	bbcodeParser.addBBCode = function(bbcode_match, bbcode_tpl) {
		// add the regular expressions and templates for bbcode to html
		bbcodeParser.bbcode_matches.push(bbcodeParser._getRegEx(bbcode_match));
		bbcodeParser.html_tpls.push(bbcodeParser._getTpls(bbcode_tpl));

		// add the regular expressions and templates for html to bbcode
		bbcodeParser.html_matches.push(bbcodeParser._getRegEx(bbcode_tpl));
		bbcodeParser.bbcode_tpls.push(bbcodeParser._getTpls(bbcode_match));
	};

	/**
	 * Turns all of the added bbcodes into html
	 */
	bbcodeParser.bbcodeToHtml = function(str) {
		var i = 0;

		for(; i < bbcodeParser.bbcode_matches.length; i += 1) {
			str = str.replace(bbcodeParser.bbcode_matches[i], bbcodeParser.html_tpls[i]);
		}

		return str;
	};

	/**
	 * Turns html into bbcode
	 */
	bbcodeParser.htmlToBBCode = function(str) {
		var i = 0;

		for(; i < bbcodeParser.html_matches.length; i += 1) {
			str = str.replace(bbcodeParser.html_matches[i], bbcodeParser.bbcode_tpls[i]);
		}

		return str;
	}

	/**
	 * Quote regular expression characters plus an optional character
	 * taken from phpjs.org
	 */
	function preg_quote (str, delimiter) {
		// http://kevin.vanzonneveld.net
		// +   original by: booeyOH
		// +   improved by: Ates Goral (http://magnetiq.com)
		// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   bugfixed by: Onno Marsman
		// +   improved by: Brett Zamir (http://brett-zamir.me)
		// *     example 1: preg_quote("$40");
		// *     returns 1: '\$40'
		// *     example 2: preg_quote("*RRRING* Hello?");
		// *     returns 2: '\*RRRING\* Hello\?'
		// *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
		// *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
		return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
	}
})();
