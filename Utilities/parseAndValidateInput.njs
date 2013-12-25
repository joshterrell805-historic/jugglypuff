
module.exports = parseAndValidateInput;

// error codes, when I get to allowing user-defined error checks.. those should
// (coulde) have postitive error numbers)

var errorCode = {
   lengthOrValueTooSmall: -1,
   lengthOrValueTooLarge: -2,
   invalidCharacters: -3,
   invalidOption: -4,
   undefinedProperty: -5,
   unparsableNumber: -6,
   invalidFieldCount: -7
};

parseAndValidateInput.errorCode = errorCode;

parseAndValidateInput.errorMessage = {
   '-1': {
      title: 'Insufficient length or value',
      message: 'The field <i id="fieldName"></i> has a length or value that ' +
       'is too small.'
   },
   '-2': {
      title: 'Length or value exceeded',
      message: 'The field <i id="fieldName"></i> has a length or value that ' +
       'is too large.'
   },
   '-3': {
      title: 'Invalid characters',
      message: 'The field <i id="fieldName"></i> contains invalid characters ' +
       'or otherwise doesn\'t match the expected format.'
   },
   '-4': {
      title: 'Invalid option',
      message: 'The value of <i id="fieldName"></i> isn\'t a valid option.'
   },
   '-5': {
      title: 'Undefined field',
      message: 'The field <i id="fieldName"></i> is missing from the request.'
   },
   '-6': {
      title: 'Unparsable number',
      message: 'The field <i id="fieldName"></i> is not able to be parsed ' +
       'as a number in the format required.'
   },
   '-7': {
      title: 'Invalid field count',
      message: 'The request does not have the correct number of fields.'
   }
};

/*
 * Make sure all necissary fields exist and no extra ones do. Validate input
 *  against caller-defined requirements. Also, convert all validated fields
 *  into the types requested.
 *
 * expectedFields: {
 *    necessary: [
 *       {
 *          name: 'stringFieldName'
 *          type: 'string',
 *          length: [1, 20],
 *          invalidRegExpTest: /[^a-zA-Z0-9 ()-]/
 *       },
 *       {
 *          name: 'intFieldName'
 *          type: 'int',
 *          value: [0, null]
 *       },
 *       {
 *          name: 'floatFieldName'
 *          type: 'float',
 *          value: [0, 1000, undefined, true]
 *       },
            Note: for comparison types, falsy is inclusive and truthy
             is exclusive.
 *       {
 *          name: 'decimalFieldName'
 *          type: 'decimal',
 *          value: [-300.2, 434],
 *          size: [5, 2]
 *       },
 *       {
 *          name: 'selectFieldName'
 *          type: 'select'
 *          options: ['a', 'b', 'c', 'd']
 *       }
 *
 *    ],
 *    optional: [
 *       {
 *          name: /^[a-zA-Z]+$/,
 *          occurences: [0, 1],
 *          type: 'decimal',
 *          value: [0, 10],
 *          size: [4, 1]
 *       }
 *
 *       NOTE: regex & optional aren't supported yet!
 *    ]
 * }
 *
 * postOrGetData: an associative array with fields and values of the get or
 *  post request.
 *
 * return: null if all is well or error object if a parsing/validation error
 *  happend. {code: error_code, field: the_field_from_expectedFields.necessary}
 *  field exists only if applicable.
 *
 * the decimal type leaves the number as a string. Its size field corresponds
 *  to the mysql format of [max_number_of_digits, digits_after_decimal_point]
 *  also, according to the mysql standard -/+ do not count against the
 *  max_number_of_digits. So a field with size [5,2] can hold numbers from
 *  -999.99 to 999.99
 *
 * TODO
 *    add tests
 *    allow regex fields? there's some circumstnaces where the name
 *     of the fields might be user-defined.
 *    support optional fields
 *    add custom tests?
 */

function parseAndValidateInput(expectedFields, postOrGetData) {

   var dataPropertyNames = Object.keys(postOrGetData);

   if (expectedFields.necessary.length != dataPropertyNames.length) {
      return {code: errorCode.invalidFieldCount};
   }

   for (var i = 0; i < expectedFields.necessary.length; ++i) {

      var field = expectedFields.necessary[i];

      if (postOrGetData[field.name] !== undefined) {

         switch (field.type) {

         case 'string':

            if (field.length) {

               // check lower length limit
               if (field.length[0] !== null &&
                (field.length[2] ?
                postOrGetData[field.name].length <= field.length[0] :
                postOrGetData[field.name].length <  field.length[0])) {
                  return {
                     code: errorCode.lengthOrValueTooSmall,
                     field: field.name
                  };
               }

               // check upper length limit
               if (field.length[1] !== null && field.length[1] !== undefined &&
                (field.length[3] ?
                postOrGetData[field.name].length >= field.length[1] :
                postOrGetData[field.name].length >  field.length[1])) {
                  return {
                     code: errorCode.lengthOrValueTooLarge,
                     field: field.name
                  };
               }
            }

            if (field.invalidRegExpTest &&
             field.invalidRegExpTest.test(postOrGetData[property])) {
               return {
                  code: errorCode.invalidCharacters,
                  field: field.name
               };
            }

            break;

         case 'int':
            var value = parseInt(postOrGetData[field.name]);
         case 'float':
         case 'decimal':
            var value = parseFloat(postOrGetData[field.name]);

            if (isNaN(value)) {
               return {
                  code: errorCode.unparsableNumber,
                  field: field.name
               };
            }

            if (field.value) {
               // check lower value limit
               if (field.value[0] !== null &&
                (field.value[2] ?
                value <= field.value[0] :
                value <  field.value[0])) {
                  return {
                     code: errorCode.lengthOrValueTooSmall,
                     field: field.name
                  };
               }

               // check upper value limit
               if (field.value[1] !== null && field.value[1] !== undefined &&
                (field.value[3] ?
                value >= field.value[1] :
                value >  field.value[1])) {
                  return {
                     code: errorCode.lengthOrValueTooLarge,
                     field: field.name
                  };
               }
            }

            if (field.type === 'decimal') {
               if (field.size !== undefined) {
                  // don't allow decimal (a,b>=a)
                  // I think decimal (a,b==a) is legal, but I have no need
                  // for it right now and I don't want to do testing on that
                  // special form of regexp (is -.01 legal for (2,2) ?) now.
                  if (field.size[0] <= 0 || (field.size[1] &&
                   field.size[1] >= field.size[0])) {
                     throw new Error('Invalid field size: ' + field.size);
                  }

                  // eg /^[+-]{0,1}\d{1,1}(\.\d{1,2}){0,1}$/
                  var isValidDecimal = new RegExp(
                   '^[+-]{0,1}\\d{1,' + (field.size[1] ?
                   (field.size[0] - field.size[1]) +
                   '}(\\.\\d{1,' + field.size[1] + '}){0,1}' :
                   field.size[0] + '}') + '$'
                  );

                  if (!isValidDecimal.test(postOrGetData[field.name])) {
                     return {
                        code: errorCode.invalidCharacters,
                        field: field.name
                     };
                  }
               } else {
                  // I guess it's possible to want a decimal as a string with
                  // no limit on length?
                  // eg /^[+-]{0,1}\d{1,1}(\.\d{1,2}){0,1}$/
                  if (!/^[+-]{0,1}\\d+(\\.\\d+){0,1}$/.test(
                    postOrGetData[fieldName])) {
                     return {
                        code: errorCode.invalidCharacters,
                        field: field.name
                     };
                  }

               }
            } else {
               postOrGetData[field.name] = value;
            }

            break;

         case 'select':
            if (field.options.indexOf(postOrGetData[field.name]) === -1) {
               return {
                  code: errorCode.invalidOption,
                  field: field.name
               };
            }

            break;

         default:
            throw new Error(
             'expectedFields contains unrecognized type' + field.type
            );
         }
      }
      else {
         return {
            code: errorCode.undefinedProperty,
            field: field.name
         };
      }
   }
}
