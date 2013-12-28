
/*
 * Replace attributes of elements.
 *
 * sourceString : the string to parse
 *
 * selector : an associative array with member names and values that correspond
 *  to element attribute names and values.
 *
 * replacement : an associative array with member names and values that
 *  correspond to the new attribute names and values. These can be created or
 *  replace old values.
 *
 *
 * selector and replacement may also be normal arrays containing associative
 *  arrays. In this case, the sourceString is iterated over with each selector
 *  and replacement.
 * This can definitely be optimized, but ya know what they say: premature
 *  optimization...
 *
 * Using innerHtml for an element of *selector* doesn't select
 *  on matching innerHtml. It selects on a matching element attribute called
 *  innerHtml. I don't plan on giving this library the ability to select on
 *  innerHtml unless there's a need for it.
 *
 * this function assumes ALL elements are of the form <blah></blah> and that ALL
 *  elements have attributes defined as like so: attribute="value"
 *
 *
 * TODO
 *    allow functions in replacement
 *    tests!!! what happens in comments? script tags with html strings?
 *    allow regex matches for all selector members
 */
module.exports = function replace(sourceString, selector, replacement) {

   if (Array.isArray(selector) != Array.isArray(replacement))
      throw new Error('selector and replacment must be both Arrays or Objects');

   if (Array.isArray(selector)) {
      if (selector.length != replacement.length)
         throw new Error('selector and replacement must have the same number ' +
          'of elements.');

      for (var i = 0; i < selector.length; ++i) {
         sourceString = replace(sourceString, selector[i], replacement[i]);
      }

      return sourceString;
   }
   
   var selectorAttributeNames = Object.keys(selector);

   // don't want to iterate over innerHtml in search in replace..
   //  innerHtml must be handled specially.
   if (replacement.innerHtml !== undefined) {
      var replaceInnerHtml = replacement.innerHtml;
      delete replacement.innerHtml;
   }

   var replacementAttributeNames = Object.keys(replacement);

   var attributeRegExps = [];
   var returnString = '';
   var getElement = /<(\w+)\s*[^>"]*("[^"]*"[^>"]*)*>/g;
   var elementMatch;

   for (var attributeNameIndex = 0; attributeNameIndex <
    selectorAttributeNames.length; ++attributeNameIndex) {

      var attributeName = selectorAttributeNames[attributeNameIndex];
      attributeRegExps.push(
       new RegExp(attributeName + '="' + selector[attributeName] + '"')
      );
   }

   var sourceStringIndex = 0;

   while (elementMatch = getElement.exec(sourceString)) {

      var elementBeginTag = elementMatch[0];
      var elementName = elementMatch[1];
      var missingElement = false;

      for (var index in attributeRegExps) {
         if (!attributeRegExps[index].exec(elementBeginTag)) {
            missingElement = true;
            break;
         }
      }

      returnString += sourceString.substr(sourceStringIndex,
       elementMatch.index - sourceStringIndex);

      sourceStringIndex = elementMatch.index + elementBeginTag.length;

      if (missingElement) {
         returnString += elementBeginTag;
      } else {

         var replacementElementBeginTag = elementBeginTag;

         for (var attributeNameIndex = 0; attributeNameIndex <
          replacementAttributeNames.length; ++attributeNameIndex) {

            var attributeName = replacementAttributeNames[attributeNameIndex];

            // if the attribute already exists, replace its value
            if (elementBeginTag.indexOf(attributeName) !== -1) {

               replacementElementBeginTag = replacementElementBeginTag.replace(
                // will this break with funky yet valid html attribute names?
                new RegExp(attributeName + '="[^"]*"'),
                attributeName + '="' + replacement[attributeName] + '"'
               );

            } else {
               replacementElementBeginTag =
                replacementElementBeginTag.replace(/\s*>$/, ' ' +
                attributeName + '="' + replacement[attributeName] + '"' + '>'
               );
            }

         }

         returnString += replacementElementBeginTag;

         if (replaceInnerHtml) {

            var searchIndex = sourceStringIndex;

            do {

               var nextBeginTagIndex = sourceString.indexOf('<' + elementName,
                searchIndex);

               var nextEndTagIndex = sourceString.indexOf('</' + elementName,
                searchIndex);

               searchIndex = nextEndTagIndex + 1;

            } while (nextBeginTagIndex !== -1 && nextBeginTagIndex <
             nextEndTagIndex);

            if (nextEndTagIndex === -1)
               throw new Error('No end-tag for element:\n\t' + elementBeginTag);

            returnString += replaceInnerHtml;

            getElement.lastIndex = sourceStringIndex = nextEndTagIndex;
         }
      }

   }

   return returnString + sourceString.substr(sourceStringIndex); 
};

/*
var fs = require('fs');

var original = fs.readFileSync('indes.html', {encoding: 'utf8'});
var stuff = module.exports(original, {
   id: 'tacoMan',
   src: 'localhost'
}, {
   id: 'here\'s the new id',
   innerHtml: 'what what'
});

var stuff = module.exports(original, [
   {
      id: 'tacoMan',
      src: 'localhost'
   },
   {
      id: 'yeah'
   },
   {
      id: 'shiz'
   }
], [
   {
      src: '',
      id: '',
      innerHtml: ''
   },
   {
      id: 'YEAH',
      extra: 'extra'
   },
   {
      id: 'shiz',
      innerHtml: 'CRAP'
   }

]);

console.log('-------original------------');
console.log(original);
console.log('-----------new-------------');
console.log(stuff);
*/
