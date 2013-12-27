/*
 * Add work to the queue. All lengthy synchronus code should be added to
 *  the queue to keep the server responsive.
 *
 * <work> is a function to be added to the queue. <work> is called as-is
 *  (i.e. work()). <work> can also be an array of functions. 
 */

var async = require('async');

var numWorkers = 1;

var queue = async.queue(queueWorker, numWorkers);

// TODO this method technically allows work to be passed as an array of
// functions, but this function wasn't designed for that. Add multiple
// function support.

// doWork(work, callback)
module.exports = queue.push.bind(queue);

function queueWorker(work, callback) {
   callback(null, work());
}
