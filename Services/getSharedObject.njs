/*
 * This service should be used when multiple responses (or an entire responder)
 *  depend on the same information.
 *
 * An example is a table schema. Rather than hard coding the schema into the
 *  server scripts, the schema is read from the database and used to produce
 *  output in all responses of a responder. The schema shouldn't be read
 *  until the first response needs it, and it should only be read once.
 *  All responses that request the schema after it has been loaded are returned
 *  the schema from memory, and all responses that request the schema while
 *  it is being loaded are added to a temporary queue which will be emptied
 *  when the schema has been loaded.
 *
 * <callback> should (in every circumstance I can think of) be the responder
 *  generator callback which is currently Response.asyncCallback.
 *  <callback> is passed the standard (err, value) parameters so it can be used
 *  in other circumstances too if needed.
 *
 * <getObject> is an asynchronous function which gets the data needed and calls
 *  its parameter, callback, when it has obtained the information or
 *  produced an error. The callback has the standard form (err, value)
 *
 * NOTE:
 *  <getObject> is used as a key to determine which value the user wants.
 *  <getObject> is compared internally with strict comparision, so it must
 *  be a reference to the same exact function-object among responders. If a new
 *  object is used, a new request will be made to get the information that may
 *  already be stored in memory. Again, the actually object <getObject> is the
 *  key into this funciton. To reload, delete, or get the information associated
 *  with this object, the same object must be passed. Note: this works fine even
 *  if the user has the function stored in a different module and uses
 *  require to objtain the module several different times. This is because
 *  node caches modules. If the module cache is ever cleared, however,
 *  the next require will return a different function object. Eeven though the
 *  functions may be the same code, if they are different instances of the same
 *  function they will serve as two distinct keys.
 *
 * NOTE:
 *  <getObject> is expected to be asynchronous and will break generators if it
 *  is not.
 */

module.exports = getSharedObject;

var objectStore = [];
// holds objects with {key, info, waiting}

function getSharedObject(getObject, callback) {

   var object = getObjectFromKey(getObject);

   if (object) {

      // this function is supposed to by async, and it will break generators
      //  unless this wrapping occurs so that the generator isn't calling
      //  next or throw on itself.
      setTimeout(function() { callback(object.error, object.info); }, 0);

   } else {
      object = {
         key: getObject,
         waiting: [callback],
      };

      objectStore.push(object);

      getObject(function(err, info) {
         object.error = err;
         object.info = info;
         clearWaitList(object);
      });
   }
}

function getObjectFromKey(key) {
   for (var objectIndex in objectStore) {
      if (objectStore[objectIndex].key === key)
         return objectStore[objectIndex];
   }
}

function clearWaitList(object) {
   var callback;
   while (callback = object.waiting.shift()) {
      callback(object.error, object.info);
   }
}
