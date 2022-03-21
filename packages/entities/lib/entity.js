const {Utils, Strings} = require("@graphminer/Utils");

const EntityBase = require("./entityBase");

const _ = require("lodash");
const ObjectProperty = require("./objectProperty");

/**
 * Entity or **instance** defines a concrete piece of data based on a predefined type.
 */
class Entity extends EntityBase {
    /**
     * @type EntityType
     */
    entityType;
    /**
     * @type *
     */
    values;
    /**
     * @type *
     */
    objects;
    space;

    /**
     * You likely should not create an instance via this constructor,
     * use {@link typed} or {@link untyped} instead.
     * @constructor
     */
    constructor() {
        super("Unknown", null);
        this.space = null;

        this.values = {};
        this.objects = {};
    }

    /**
     * Creates a typed instance.
     * @param entityType
     * @param entitySpec
     * @returns {Entity}
     */
    static typed(entityType, entitySpec = null) {
        if (Utils.isEmpty(entityType)) {
            throw new Error(Strings.IsNil("entityType", "Entity.typed"))
        }
        const EntityType = require("./entityType");

        if (!(entityType instanceof EntityType)) {
            throw new Error(Strings.ShoudBeType("entityType", "EntityType", "Entity"));
        }
        const entity = new Entity();
        entity.entityType = entityType;
        entity.typeName = entityType.name;
        entity.space = entityType.space;
        if (Utils.isDefined(entitySpec)) {
            if (_.isString(entitySpec)) {
                entity.name = entitySpec.toString().trim();
            } else if (_.isPlainObject(entitySpec)) {
                entity.setValues(entitySpec)
            } else if (_.isObject(entitySpec)) {
                // if toJSON is defined this will use it
                entity.setValues(JSON.parse(JSON.stringify(entitySpec)))
            } else {
                throw new Error("Not sure how to assign the instance data from the given object.")
            }
        }
        if (Utils.isEmpty(entity.id)) {
            entity.id = Utils.id()
        }
        return entity
    }

    /**
     * Creates an untyped instance.
     * - Untyped does not mean without a type name. You need a type name but the schema of the type is undefined.
     * @see typed
     * @param typeName
     * @param data
     */
    static untyped(typeName, data = null) {

        if (Utils.isEmpty(typeName)) {
            throw new Error(Strings.IsNil("entityType", "Entity.typed"))
        }
        if (!_.isString(typeName)) {
            throw new Error(Strings.ShoudBeType("typeName", "string", "Entity.untyped"));
        }
        const entity = new Entity();
        entity.entityType = null;
        entity.typeName = typeName
        entity.space = null;

        if (Utils.isDefined(data)) {
            if (Utils.isDefined(data.id)) {
                entity.id = data.id
            }
            if (_.isString(data)) {
                entity.name = data.toString().trim();
            } else if (_.isPlainObject(data)) {
                entity.setValues(data)
            } else if (_.isObject(data)) {
                // if toJSON is defined this will use it
                entity.setValues(JSON.parse(JSON.stringify(data)))
            } else {
                throw new Error("Not sure how to assign the instance data from the given object.")
            }
        }
        return entity
    }


    /**
     * An untyped entity has no schema, i.e. an {@link entityType}.
     * @returns {boolean}
     */
    get isUntyped() {
        return _.isNil(this.entityType);
    }

    /**
     * A typed entity has an {@link entityType}
     * @returns {boolean}
     */
    get isTyped() {
        return !this.isUntyped;
    }

    /**
     * Deserializes an entity.
     * @param entityType {EntityType} An entity type.
     * @param json {*} The data to deserialize.
     * @returns {Entity}
     */
    static fromJSON(entityType, json) {
        if(Utils.isEmpty(entityType)){
            throw new Error(Strings.IsNil("entityType","Entity.fromJSON"))
        }
        const EntityType = require("./entityType");
        if(!(entityType instanceof EntityType)){
            throw new Error(Strings.ShoudBeType("entityType","EntityType","Entity.fromJSON"))
        }
        let e = new Entity();
        e.typeName = entityType.name;
        e.name = json.name || null;
        if (!Utils.isEmpty(json.id)) {
            e.id = json.id;
        }
        if (Utils.isEmpty(entityType)) {
            // data can't be checked against the schema
            e = _.assign(e, json);
        } else {
            const props = entityType.valueProperties;
            for (let p of props) {
                e.setValue(p.name, json[p.name]);
            }
            e.description = json.description;
            e.name = json.name
        }
        e.space = entityType?.space
        return e;
    }

    /**
     * Returns the value or object property.
     * @param options {string|ValueProperty|ObjectProperty} The name of a value/object property, a ValueProperty or an ObjectProperty.
     * @returns {*|null|string}
     */
    get(options) {
        let found = this.getValue(options);
        if (!Utils.isEmpty(found)) {
            return found;
        }
        return this.getObject(options);
    }

    /**
     * Gets the value of the specified value property
     * @param options {string|ValueProperty}
     * @returns {*}
     * @example
     *
     * const personType = new EntityType("Person");
     * personType.addValueProperty("age","Number");
     * const person = new Entity(personType, "Anna");
     * person.setValue("age", 34);
     * person.getValue("age");
     */
    getValue(options) {

        const ValueProperty = require("./valueProperty");
        if (_.isString(options)) {
            const valuePropertyName = options;
            if(_.includes(["id","name","description"],valuePropertyName)){
                return this[valuePropertyName]
            }

            if (this.isUntyped) {
                return this.values[valuePropertyName] || null;
            } else {
                if (this.valuePropertyExists(valuePropertyName)) {
                    return this.values[valuePropertyName];
                }
            }
        } else if (options instanceof ValueProperty) {
            const valuePropertyName = options.name;
            if(_.includes(["id","name","description"],valuePropertyName)){
                return this[valuePropertyName]
            }
            if (this.isUntyped) {
                return this.values[valuePropertyName];
            } else {
                if (this.valuePropertyExists(valuePropertyName)) {
                    return this.values[valuePropertyName];
                }
            }
        }
        return null;
    }

    /**
     * Sets the value of the property.
     * Note that the type is validated.
     * @param valuePropertyName {string} The name of the property.
     * @param value {*} The value to set.
     * @param throwError {boolean} Throw an error if the property does not exist.
     */
    setValue(valuePropertyName, value, throwError = true) {
        this.#isValidUntypedValue(value);
        if (this.isUntyped) {
            if (_.includes(["id", "name", "description"], valuePropertyName)) {
                this[valuePropertyName] = value;
            } else {
                this.values[valuePropertyName] = value;
            }
        } else {
            if (_.includes(["id", "name", "description"], valuePropertyName)) {
                this[valuePropertyName] = value;
            } else if (this.valuePropertyExists(valuePropertyName)) {
                this.#isValidValue(valuePropertyName, value);
                this.values[valuePropertyName] = value;
            } else {
                if (throwError) {
                    throw new Error(Strings.MemberDoesNotExist(valuePropertyName, this.typeName));
                }
            }
        }

    }

    /**
     * Set multiple value properties by means of a plain object.
     * @param data {*} The data to assign.
     */
    setValues(data) {
        if (!_.isPlainObject(data)) {
            throw new Error(Strings.ShoudBeType("data", "plain object", "Entity.setValues"))
        }
        if (Utils.isEmpty(this.entityType)) {
            // untyped entity
            _.forEach(data, (v, k) => {
                // these are intrinsic and not defined via value properties
                if (_.includes(["id", "name", "description"], k)) {
                    if (_.isNil(v) || _.isString(v)) {
                        this[k] = v
                    } else {
                        throw new Error("Can only assign a string to id, name or description.")
                    }
                } else {
                    this.#isValidUntypedValue(v)
                    this.values[k] = v;
                }

            })
        } else {
            _.forEach(data, (v, k) => {

                // these are intrinsic and not defined via value properties
                if (_.includes(["id", "name", "description"], k)) {
                    if (_.isNil(v) || _.isString(v)) {
                        this[k] = v
                    } else {
                        throw new Error("Can only assign a string to id, name or description.")
                    }
                } else {
                    // ignore invalid ones and don't throw an error
                    this.setValue(k, v, false)
                }
            })
        }
    }

    #isValidObject(objectPropertyName, obj) {
        const definition = this.entityType.getObjectProperty(objectPropertyName);
        const expectedType = definition.objectType;
        if (obj.typeName !== expectedType) {
            throw new Error(Strings.ShoudBeType(objectPropertyName, expectedType, this.typeName));
        }
    }

    #isValidUntypedValue(value) {
        const allowed = [_.isNumber, _.isNil, _.isString, _.isArray, _.isBoolean]
        if (!_.some(allowed.map(a => a(value)), u => u === true)) {
            throw new Error("A value can only be a simple type or nil.")
        }
    }

    #isValidValue(valuePropertyName, value) {
        const definition = this.entityType.getValueProperty(valuePropertyName);
        const expectedType = definition.valueType;
        const isArrayType = expectedType.startsWith("[");
        let baseType = expectedType;
        if (isArrayType) {
            baseType = baseType.slice(1, -1);
        }
        const validator = this.#getValueValidator(baseType);
        if (isArrayType) {
            if (!_.isArray(value)) {
                throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
            }
            if (!_.every(value, validator)) {
                throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
            }
        } else {
            // we'll accept null and undefined
            if (_.isNil(value)) {
                return true;
            }
            if (!validator(value)) {
                throw new Error(Strings.ShoudBeType(valuePropertyName, expectedType, this.typeName));
            }
        }
    }

    #getValueValidator(baseTypeName) {
        switch (baseTypeName.toLowerCase()) {
            case "number":
                return _.isNumber;
            case "string":
                return _.isString;
            case "boolean":
                return _.isBoolean;
            default:
                throw new Error(strings.Invalid(baseTypeName, "Entity.validateValue"));
        }
    }

    setObject(objectPropertyName, obj) {
        if (this.isUntyped) {
            throw new Error(strings.SealedEntity());
        }
        if (this.objectPropertyExists(objectPropertyName)) {
            this.#isValidObject(objectPropertyName, obj);
            this.objects[objectPropertyName] = obj;
        } else {
            throw new Error(strings.MemberDoesNotExist(objectPropertyName, this.typeName));
        }
    }

    /**
     * Returns the object for the given object property.
     * @param options  {string|ObjectProperty} The name of the object property or an {@link ObjectProperty}.
     * @returns {null|*}
     */
    getObject(options) {
        if (_.isString(options)) {
            const objectPropertyName = options.toString().trim();
            if (this.isUntyped) {
                return this[objectPropertyName];
            } else {
                if (this.objectPropertyExists(objectPropertyName)) {
                    return this.objects[objectPropertyName];
                }
            }
            return null;
        } else if (options instanceof ObjectProperty) {
            return this.getObject(options.name);
        } else {
            throw new Error(strings.WrongArguments("Entity.getObject"));
        }
    }

    valuePropertyExists(valuePropertyName) {
        return !Utils.isEmpty(_.find(this.entityType.valueProperties, {name: valuePropertyName}));
    }

    objectPropertyExists(objectPropertyName) {
        return !Utils.isEmpty(_.find(this.entityType.objectProperties, {name: objectPropertyName}));
    }

    getValueProperty(valuePropertyName) {
        return this.entityType.getValueProperty(valuePropertyName);
    }

    getObjectProperty(objectPropertyName) {
        return this.entityType.getObjectProperty(objectPropertyName);
    }

    toJSON(includeObjects = false) {
        const m = super.toJSON();
        if (Utils.isEmpty(this.entityType)) {
            _.assign(m, this.values)
        } else {
            let props = this.entityType.valueProperties;
            for (let p of props) {
                m[p.name] = this.getValue(p.name);
            }
            if (includeObjects) {
                props = this.entityType.objectProperties;
                for (let p of props) {
                    m[p.name] = this.getObject(p.name).toJSON();
                }
            }
        }
        return m;
    }
}

module.exports = Entity;
