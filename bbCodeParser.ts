export class BBCodeParser {
    token_match: any = /{[A-Z_]+[0-9]*}/ig;

    // regular expressions for the different bbcode tokens
    tokens: any = {
        URL: '((?:(?:[a-z][a-z\\d+\\-.]*:\\/{2}(?:(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})+|[0-9.]+|\\[[a-z0-9.]+:[a-z0-9.]+:[a-z0-9.:]+\\])(?::\\d*)?(?:\\/(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})*)*(?:\\?(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?(?:#(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?)|(?:www\\.(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})+(?::\\d*)?(?:\\/(?:[a-z0-9\\-._~\\!$&\'*+,;=:@|]+|%[\\dA-F]{2})*)*(?:\\?(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?(?:#(?:[a-z0-9\\-._~\\!$&\'*+,;=:@\\/?|]+|%[\\dA-F]{2})*)?)))',
        LINK: '([a-z0-9\-\./]+[^"\' ]*)',
        TEXT: '([\\S\\s]*?)'
    };

    bbcode_matches: any[] = [];        // matches for bbcode to html

    html_tpls: any[] = [];             // html templates for html to bbcode

    html_matches: any[] = [];          // matches for html to bbcode

    bbcode_tpls: any[] = [];           // bbcode templates for bbcode to html

    constructor() {
        this.addBBCode('\n', '<br>');
        this.addBBCode('[b]{TEXT}[/b]', '<b>{TEXT}</b>');
        this.addBBCode('[i]{TEXT}[/i]', '<i>{TEXT}</i>');
        this.addBBCode('[u]{TEXT}[/u]', '<u>{TEXT}</u>');
        this.addBBCode('[code]{TEXT}[/code]', '<pre>{TEXT}</pre>');
        this.addBBCode('[url={URL}]{TEXT}[/url]', '<a href="{URL}" title="link" target="_blank">{TEXT}</a>');
        this.addBBCode('[url]{URL}[/url]', '<a href="{URL}" title="link" target="_blank">{URL}</a>');
        this.addBBCode('[url={LINK}]{TEXT}[/url]', '<a href="{LINK}" title="link" target="_blank">{TEXT}</a>');
        this.addBBCode('[url]{LINK}[/url]', '<a href="{LINK}" title="link" target="_blank">{LINK}</a>');
        this.addBBCode('[img]{URL}[/img]', '<img src="{URL}">');
        this.addBBCode('[img]{LINK}[/img]', '<img src="{LINK}">');
        this.addBBCode('[quote]{TEXT}[/quote]', '<blockquote>{TEXT}</blockquote>');
    }

    /**
     * Turns a bbcode into a regular rexpression by changing the tokens into
     * their regex form
     */
    private _getRegEx(str: string) {
        var matches = str.match(this.token_match);
        var nrmatches = matches === null ? 0 :  matches.length;
        var i = 0;
        var replacement = '';

        if (nrmatches <= 0) {
            return new RegExp(this.preg_quote(str), 'g');        // no tokens so return the escaped string
        }

        for (; i < nrmatches; i += 1) {
            // Remove {, } and numbers from the token so it can match the
            // keys in tokens
            var token = matches[i].replace(/[{}0-9]/g, '');

            if (this.tokens[token]) {
                // Escape everything before the token
                replacement += this.preg_quote(str.substr(0, str.indexOf(matches[i]))) + this.tokens[token];

                // Remove everything before the end of the token so it can be used
                // with the next token. Doing this so that parts can be escaped
                str = str.substr(str.indexOf(matches[i]) + matches[i].length);
            }
        }

        replacement += this.preg_quote(str);      // add whatever is left to the string

        return new RegExp(replacement, 'gi');
    };

    /**
     * Turns a bbcode template into the replacement form used in regular expressions
     * by turning the tokens in $1, $2, etc.
     */
    private _getTpls(str: string) {
        var matches = str.match(this.token_match);
        var nrmatches = matches === null ? 0 :  matches.length;
        var i = 0;
        var replacement = '';
        var positions = {};
        var next_position = 0;

        if (nrmatches <= 0) {
            return str;       // no tokens so return the string
        }

        for (; i < nrmatches; i += 1) {
            // Remove {, } and numbers from the token so it can match the
            // keys in tokens
            var token = matches[i].replace(/[{}0-9]/g, '');
            var position;

            // figure out what $# to use ($1, $2)
            if (positions[matches[i]]) {
                position = positions[matches[i]];         // if the token already has a position then use that
            } else {
                // token doesn't have a position so increment the next position
                // and record this token's position
                next_position += 1;
                position = next_position;
                positions[matches[i]] = position;
            }

            if (this.tokens[token]) {
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
    private addBBCode(bbcode_match: any, bbcode_tpl: any) {
        // add the regular expressions and templates for bbcode to html
        this.bbcode_matches.push(this._getRegEx(bbcode_match));
        this.html_tpls.push(this._getTpls(bbcode_tpl));

        // add the regular expressions and templates for html to bbcode
        this.html_matches.push(this._getRegEx(bbcode_tpl));
        this.bbcode_tpls.push(this._getTpls(bbcode_match));
    };

    /**
     * Turns all of the added bbcodes into html
     */
    public bbcodeToHtml(str: string) {
        var nrbbcmatches = this.bbcode_matches.length;
        var i = 0;

        for (; i < nrbbcmatches; i += 1) {
            str = str.replace(this.bbcode_matches[i], this.html_tpls[i]);
        }

        return str;
    };

    /**
     * Turns html into bbcode
     */
    public htmlToBBCode(str: string) {
        var nrhtmlmatches = this.html_matches.length;
        var i = 0;

        for (; i < nrhtmlmatches; i += 1) {
            str = str.replace(this.html_matches[i], this.bbcode_tpls[i]);
        }

        return str;
    }

    /**
     * Quote regular expression characters plus an optional character
     * taken from phpjs.org
     */
    private preg_quote(str: string, delimiter: string = null) {
        return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
    }
}
