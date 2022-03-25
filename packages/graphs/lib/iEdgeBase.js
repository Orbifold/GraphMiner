const IId = require("./iid");

/**
 * @interface
 */
class IEdgeBase extends IId {
    sourceId;
    targetId;

    toJSON();
}

module.exports = IEdgeBase;
