/*global ig: true */
ig.module(
  'game.system.eventChain'
)
.requires(
  'impact.impact'
)
.defines(function() {

  // Defines a function that can fire sequential events.
  EventChain = function() {
    // Make sure we get called with new.
    if (this === window) {
      return new EventChain();
    }

    var steps = [];

    // Called every frame.
    var update = function() {
      if (steps && steps.length) {
        steps[0]();
      }
    };

    update.then = function(doThis) {
      steps.push(function() {
        // Update.
        doThis();
        // End.
        steps.shift();
      });
      return this;
    }

    update.wait = function(secs) {
      var decrement = secs;
      steps.push(function() {
        // Update.
        if (decrement) {
          decrement -= ig.system.tick;
        }
        // End.
        if (decrement <= 0) {
          steps.shift();
          // Necessary because of repeat.
          decrement = secs;
        }
      });
      return this;
    };

    update.during = function(doThis) {
      if (!steps) {
        throw new Error('during only works with previous step!');
      }
      var func = steps[steps.length - 1];
      steps[steps.length - 1] = function() {
        doThis();
        func();
      };
      return this;
    };

    update.repeat = function(times) {
      times = times || Infinity;
      var originalTimes = times;
      var stepsCopy;
      steps.push((function(currentIndex) {
        return function() {
          times -= 1;
          if (times > 0) {
            var args = stepsCopy.slice(0);
            args.unshift(currentIndex, 0);
            steps.splice.apply(steps, args);
          } else {
            // For successive repeats.
            times = originalTimes;
          }
          // End.
          steps.shift();
        };
      })(steps.length - 1));
      stepsCopy = steps.slice(0);
      return this;
    };

    update.every = function(sec, doThis) {
      update.during(
        new EventChain()
          .wait(sec)
          .then(doThis)
          .repeat()
      );
      return this;
    };

    // Returned from this constructor thing.
    return update;
  };
});
