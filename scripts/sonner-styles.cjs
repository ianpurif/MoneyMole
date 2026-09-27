/* Sonner 2.0.8 also ships its CSS as a file. Use that file through Next's CSS
 * pipeline instead of its unnonced runtime style injection. Fail on upstream
 * changes so a dependency update cannot silently weaken or break the CSP. */
module.exports = function sonnerStyles(source) {
  const injection = /^__insertCSS\(".*"\);?$/m;
  if (!injection.test(source)) throw new Error("Review Sonner CSS injection after dependency update");
  return source.replace(injection, "");
};
