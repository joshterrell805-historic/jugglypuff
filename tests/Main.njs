
var assert = require('assert');
var exec = require('child_process').exec;
var fs = require('fs');

// TODO Kill process on failure.. right now this is manually done
// edit: This is done in the RunTest script now. I think it would be better done
// in this file though. !! We need a cleanup() method
//
// complimentary message is in RunTests.sh

var StartMainProcess = function StartMainProcess() {

   // TODO: The pathing on Main.njs and ./tests/DocumentRoot is hard coded.
   // This assumes that mocha is run from the parent directory.

   var childProcess = exec('node --harmony Main.njs 3000 ./tests/DocumentRoot/',
    function mainProcessCallback(error, stdout, stderr) {

      var sErr = stderr.toString();
      assert.equal(sErr, '', 'stderr buffer is non-empty: ' + sErr);

      if (error)
         assert.equal(error, null, error.message);

      assert.notEqual(stdout.toString('utf8', 0, 'usage'.length), 'usage',
       'invalid usage');

      childProcess.assertionsTested = true;
   });

   return childProcess;
};

var QuitMainProcess = function QuitMainProcess(mainProcess, done) {

   setTimeout(function waitForMainToExec() {
      mainProcess.kill('SIGINT');

      setTimeout(function checkMainExecCompletion() {
         assert(mainProcess.assertionsTested, 'assertions were not tested');
         done();
      }, 100);

   }, 400);
};

describe('Main', function() {

   it('should start via command line and quit via SIGINT',
    function commandLineTest(done) {

      var mainProcess = StartMainProcess();
      QuitMainProcess(mainProcess, done);
   });

   it('should return the expected output from SampleResponder.njs',
    function sampleResponderTest(done) {

      var mainProcess = StartMainProcess();

      var curlFinished = false;

      // TODO: there's got to be a better way to do this (wait for the
      // server to load).
      setTimeout(function() {
         exec('curl -s http://localhost:3000/SampleResponder',
          function(error, stdout, stderr) {

            assert.equal(stderr.toString(), '', 'stderr is non-empty');

            if (error)
               assert.equal(error, null,
                'code: ' + error.code + ', message: ' + error.message);

            assert.equal(stdout.toString(), 'tacos are good',
             'curl didn\'t return the expected output');

            curlFinished = true;
         });
         setTimeout(function checkCurlFinished() {
            if (!curlFinished)
               done(new Error('curl of localhost didn\'t finish'));
         }, 100);
      }, 100);

      QuitMainProcess(mainProcess, done);

   });

});
