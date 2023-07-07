/** Polyfill for TANH */
Math.tanh =
  Math.tanh ||
  function (x) {
    if (x === Infinity) {
      return 1;
    } else if (x === -Infinity) {
      return -1;
    } else {
      let e2x = Math.exp(2 * x);
      return (e2x - 1) / (e2x + 1);
    }
  };
