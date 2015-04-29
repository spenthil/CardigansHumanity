angular.module("cardcard", []);

angular.module("cardcard").service("cardcard", ["$log", "$q", "$sce", function ($log, $q, $sce) {
  this.options = {
    cards: [
      "Cardigans are the _____.",
      "worst creation imagined",
      "most horrible thing"
    ].join('\n'),
    pagePadding: [0.2, 0.4],

    cardSpacing: [0.1, 0.1],
    cardWidth: 2.5,
    cardHeight: 3.5,

    fontSize: 14,
    lineHeight: 1.4,

    whiteCardsFontColor: '#000000', //#FF0000
    blackCardsFontColor: '#000000',

    whiteCardsFontStroke: 'none',
    blackCardsFontStroke: 'none', //#FF0000

    blackBorderColor: '#000000', //#00FF00
    whiteBorderColor: '#000000',

    whiteLogoCardsFontColor: '#000000',
    blackLogoCardsFontColor: '#000000',

    cardPadding: [0.1, 0.15],
    cardRadius: 0,
    fontWeight: 'Bold',
    fontFamily: 'Helvetica',
    blank: '_____',

    logoWidth: 0.2,
    logoFontSize: 10,
    logoFontWeight: 'Bold',
    logoFontFamily: 'Helvetica',

    whiteLogoCardsStroke: '#000000', //#FF0000
    blackLogoCardsStroke: '#000000',
    whiteLogoCardsFontStroke: 'none',
    blackLogoCardsFontStroke: 'none',

    logoText: 'Cardigans Humanity',

    fileName: 'CardigansHumanity.svg',
    strokeWidth: '.01', // .001in for vector on laser
    strokeWidthLogo: '.01' // .001in for vector on laser
  };

  var degreesToRadians = function (angle) {
    return angle * (Math.PI / 180);
  };

  var cosDegrees = function (angle) {
    return Math.cos(degreesToRadians(angle));
  };

  var sinDegrees = function (angle) {
    return Math.sin(degreesToRadians(angle));
  };

  var pdfFactory = function () {
    this._pdf = new jsPDF("portrait", "in", "letter");
    //$log.debug('PDF Fonts: ', this._pdf.getFontList());
  };

  function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
  }

  pdfFactory.prototype = {
    addPage: function () {
      this._pdf.addPage()
    },

    _setFill: function (fill) {
      var style = '';
      if (fill !== 'none') {
        doc.setDrawColor(0);
        var rgb = hexToRgb(fill);
        this._pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        style += 'F';
      }
      return style;

    },
    _setStroke: function (strokeColor, strokeWidth) {
      var style = '';
      if (strokeColor !== 'none') {
        var rgb = hexToRgb(strokeColor);
        this._pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
        this._pdf.setLineWidth(strokeWidth);
        style += 'D';
      }
      return style;
    },

    drawRectangle: function (x, y, width, height, cornerRadius, strokeWidth, strokeColor, fill) {
      var style = '';
      style += this._setFill(fill);
      style += this._setStroke(strokeColor, strokeWidth);
      this._pdf.roundedRect(x, y, width, height, cornerRadius, cornerRadius, style);
    },
    drawText: function (text, x, y, width, fontFamily, fontWeight, fontSize, fontColor, lineHeight) {
      this._pdf.lineHeightProportion = lineHeight;
      var rgb = hexToRgb(fontColor);
      this._pdf.setTextColor(rgb[0], rgb[1], rgb[2]).setFont(fontFamily, fontWeight).setFontSize(fontSize);

      var lines;
      if (typeof width !== 'undefined') {
        lines = this._pdf.splitTextToSize(text, width);
      } else {
        lines = text;
      }
      var verticalOffset = fontSize / 72;
      this._pdf.text(x, y + verticalOffset, lines);
      return lines;
    },
    drawLines: function (points, strokeWidth, strokeColor) {
      this._setStroke(strokeColor, strokeWidth);
      this._pdf.lines(points.slice(1), points[0][0], points[0][1]);
    },
    openNewWindow: function () {
      return this._pdf.output('dataurlnewwindow')
    },
    uriString: function () {
      return this._pdf.output('datauristring')
    }
  };

  var create = function (options, cardDelimiter, factory) {
    cardDelimiter = typeof cardDelimiter !== 'undefined' ? cardDelimiter : '\n';
    factory = typeof factory !== 'undefined' ? factory : pdfFactory;

    var deferred = $q.defer();

    var cards = options.cards.split(cardDelimiter);

    var thing = new factory();

    var row = 0;
    // will be incremented at first iteration of loop to 0
    var column = -1;

    var cardsPerRow = 3;
    var cardsPerColumn = 3;

    var failedMessage = "";
    cards.every(function (line, cardI) {
      var failed = false;
      line = line.trim();
      // skip blank lines
      if (line === "") {
        return true;
      }

      var isBlack = (line.indexOf(options.blank) !== -1);

      if (column + 1 === cardsPerRow) {
        row += 1;
        if (row === cardsPerColumn) {
          row = 0;
          console.debug(JSON.stringify("Adding PDF page.", null, 2));
          thing.addPage();
        }
        column = 0;
      } else {
        column += 1;
      }

      var cardX = options.pagePadding[1] + column * (options.cardWidth + options.cardSpacing[1]);
      var cardY = options.pagePadding[0] + row * (options.cardHeight + options.cardSpacing[0]);

      thing.drawRectangle(cardX, cardY, options.cardWidth, options.cardHeight, options.cardRadius, options.strokeWidth, isBlack ? options.blackBorderColor : options.whiteBorderColor, 'none');

      //
      // Text
      //
      var textX = cardX + options.cardPadding[1];
      var textY = cardY + options.cardPadding[0];
      var textBlankOffset = textY;
      // remove trailing period, we'll put that in automatically for last entry
      var nonblanks = line.split(options.blank);
      var fontColor = isBlack ? options.blackCardsFontColor : options.whiteCardsFontColor;
      var textWidth = options.cardWidth - (2 * options.cardPadding[1]);
      var textBlankOffsetIncrement = (options.fontSize / 72) * options.lineHeight;
      nonblanks.forEach(function (nonblank, i) {
        // find if we need punctuation
        var words = nonblank.split(" ");
        var punctuation = false;
        if (~[".", "?", ","].indexOf(words[0])) {
          punctuation = words[0];
          // remove the punctuation since it will be in blank line
          nonblank = nonblank.substring(2);
        }
        // draw blank
        if ((i !== 0) && i !== (i !== (nonblanks.length - 1))) {
          // need blank
          var blankX = textX;
          var blankY = textBlankOffset + textBlankOffsetIncrement * .8;
          var blankWidth;
          if (punctuation) {
            var punctuationRoom = options.fontSize / 72;
            blankWidth = textWidth - punctuationRoom;
            thing.drawText(
              punctuation,
              blankX + textWidth - punctuationRoom,
              textBlankOffset,
              textWidth,
              options.fontFamily,
              options.fontWeight,
              options.fontSize,
              fontColor,
              options.lineHeight
            );
          } else {
            blankWidth = textWidth;
          }
          thing.drawLines(
            [
              [blankX, blankY],
              [blankWidth, 0]
            ],
            options.strokeWidth,
            fontColor
          );
          textBlankOffset += textBlankOffsetIncrement;
        }
        // text
        nonblank = nonblank.trim();
        if (!nonblank) {
          // consecutive blanks
          return;
        }
        if ((nonblank === '.' || nonblank === '') && i === (nonblanks.length - 1)) {
          // Period - don't need since it was put with last blank OR simply the end.
          return
        }

        var lines = thing.drawText(
          nonblank,
          textX,
          textBlankOffset,
          textWidth,
          options.fontFamily,
          options.fontWeight,
          options.fontSize,
          fontColor,
          options.lineHeight
        );
        textBlankOffset += textBlankOffsetIncrement * lines.length;
      });

      //
      // Logo
      //
      if (options.logoText) {
        var logoX = cardX + options.cardPadding[1] + options.logoWidth * .75;
        var logoY = (cardY + options.cardHeight - options.logoWidth * 2);
        var logoPoints = function (angleIncrement, length) {
          logoPoints.angle += angleIncrement;
          logoPoints.points.push(
            [(cosDegrees(logoPoints.angle) * length * options.logoWidth), (sinDegrees(logoPoints.angle) * length * options.logoWidth)]
          );
        };
        logoPoints.angle = 0;
        logoPoints.points = [
          [logoX, logoY]
        ];
        var sleeveAngle = 60;
        // right half of top line
        logoPoints(0, 0.35);
        // right sleeve
        logoPoints(sleeveAngle, 0.9);
        logoPoints(90, 0.2);
        logoPoints(90, 0.7);
        // right line
        logoPoints(150 + sleeveAngle, 0.8);
        // bottom line (twice size of top line)
        logoPoints(90, 0.6);
        // left line
        logoPoints(90, 0.8);
        // left sleeve
        logoPoints(150 + sleeveAngle, 0.7);
        logoPoints(90, 0.2);
        logoPoints(90, 0.9);
        // left half of top line
        logoPoints(sleeveAngle, 0.35);
        // center line
        logoPoints(90, 1.1);
        // ALL DONE :D
        thing.drawLines(logoPoints.points, options.strokeWidthLogo, isBlack ? options.blackLogoCardsStroke : options.whiteLogoCardsStroke);

        thing.drawText(
          options.logoText,
          logoX + options.logoWidth,
          logoY,
          textWidth,
          options.logoFontFamily,
          options.logoFontWeight,
          options.logoFontSize,
          isBlack ? options.blackLogoCardsFontColor : options.whiteLogoCardsFontColor,
          options.lineHeight
        );
      }

      if (failed === true) {
        $log.debug("failed to create card: " + failedMessage);
        return false;
      } else {
        failedMessage = "";
      }

      return true;
    });

    if (failedMessage) {
      deferred.reject(failedMessage);
    } else {
      deferred.resolve(thing);
    }

    return deferred.promise;
  };

  this.createUriString = function (options) {
    return create(options).then(function (pdf) {
      return $sce.trustAsResourceUrl(pdf.uriString());
    });
  };

  this.createNewWindow = function (options) {
    return create(options).then(function (pdf) {
      pdf.openNewWindow();
    });
  };

}])
;
