// Required to stringify transaction objects
BigInt.prototype.toJSON = function () {
  return Number(this);
};
