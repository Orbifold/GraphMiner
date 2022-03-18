// ===================================================================
// WallabyJS configuration.
// If you don't have Wallaby or Quokka you can safely ignore this,
// but equally well; it's a amazing productivity tool you should
// check out.
// https://wallabyjs.com
// ===================================================================
module.exports = function (wallaby) {
    return {
        tests:[
            {"pattern": "packages/utils/__tests__/*.test.js", "ignore": false},
            {"pattern": "packages/store/__tests__/*.test.js", "ignore": true}
        ]
    }
}