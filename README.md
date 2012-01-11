Based off of phpBB's BBCode parser. Uses the same tags as the custom BBCode.

## How to Use

### Adding BBCode

    bbcodeParser.addBBCode(bbcode syntax, html syntax);

Examples:

    bbcodeParser.addBBCode('[b]{TEXT}[/b]', '<strong>{TEXT}</strong>');
	bbcodeParser.addBBCode('[url]{URL}[/url]', '<a href="{URL}">{URL}</a>');
	bbcodeParser.addBBCode('[url={URL}]{TEXT}[/url]', '<a href="{URL}">{TEXT}</a>');
	bbcodeParser.addBBCode('[text]{TEXT1} :: {TEXT2}[/text]', '<span>{TEXT1} :: {TEXT2}</span>');

### BBCode to HTML

    var html = bbcodeParser.bbcodeToHtml('[text]testing some text!123[/text]');

### HTML to BBCode

    var bbcode = bbcodeParser.htmlToBBCode('<span>testing some text!123 testing some text!123</span>');
