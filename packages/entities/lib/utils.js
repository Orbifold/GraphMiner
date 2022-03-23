const { Strings, Utils } = require("@graphminer/Utils");
const _ = require("lodash");

class SpaceUtils {
	/**
	 * Returns a value name from the given specs if possible.
	 * @param valueSpec {*}
	 * @returns {string|null}
	 */
	static getValueNameFromSpecs(valueSpec, throwErrorIfNil = true) {
		const ValueProperty = require("./valueProperty");
		if (Utils.isEmpty(valueSpec)) {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the value specification into a value name.");
			}
			return null;
		}
		if (_.isString(valueSpec)) {
			return valueSpec;
		} else if (valueSpec instanceof ValueProperty) {
			return valueSpec.name || null;
		} else if (_.isPlainObject(valueSpec)) {
			return valueSpec.name || null;
		} else {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the value specification into a value name.");
			}
			return null;
		}
	}

	/**
	 * Returns an object name from the given specs if possible.
	 * @param valueSpec {*}
	 * @param throwErrorIfNil
	 * @returns {string|null}
	 */
	static getObjectNameFromSpecs(valueSpec, throwErrorIfNil = true) {
		const ObjectProperty = require("./objectProperty");
		if (Utils.isEmpty(valueSpec)) {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the object specification into a value name.");
			}
			return null;
		}
		if (_.isString(valueSpec)) {
			return valueSpec;
		} else if (valueSpec instanceof ObjectProperty) {
			return valueSpec.name || null;
		} else if (_.isPlainObject(valueSpec)) {
			return valueSpec.name || null;
		} else {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the object specification into a value name.");
			}
			return null;
		}
	}

	/**
	 * Returns an id from the given specs if possible.
	 * @param entitySpec {*}
	 * @param throwErrorIfNil
	 * @returns {string|null}
	 */
	static getEntityIdFromSpecs(entitySpec, throwErrorIfNil = true) {
		const Entity = require("./entity");
		if (Utils.isEmpty(entitySpec)) {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the entity specification into an entity.");
			}
			return null;
		}
		if (_.isString(entitySpec)) {
			return entitySpec;
		} else if (entitySpec instanceof Entity) {
			return entitySpec.id || null;
		} else if (_.isPlainObject(entitySpec)) {
			return entitySpec.id || null;
		} else {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the entity specification into an entity.");
			}
			return null;
		}
	}

	static getIdFromSpecs(obj, throwErrorIfNil = true) {
		if (Utils.isEmpty(obj)) {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the specification into an id.");
			}
			return null;
		}
		if (_.isString(obj)) {
			return obj;
		} else if (_.isObjectLike(obj)) {
			return obj.id || null;
		} else if (_.isPlainObject(obj)) {
			return obj.id || null;
		} else {
			if (throwErrorIfNil) {
				throw new Error("Could not turn the specification into an id.");
			}
			return null;
		}
	}

	/**
	 * Deserializes the type coming from the store.
	 * @param json {*} Supposedly a serialized EntityType.
	 * @returns {null|EntityType}
	 */
	static deserializeEntityType(json, space) {
		const EntityType = require("./entityType");
		if (Utils.isEmpty(json)) {
			return null;
		}
		if (json.typeName !== "EntityType") {
			return null;
		}
		const entityType = EntityType.fromJSON(json);
		entityType.space = space;
		return entityType;
	}

	static detachEntity(entity) {
		const Entity = require("./entity");
		if (Utils.isEmpty(entity)) {
			return;
		}
		if (entity instanceof Entity) {
			entity.space = null;
			if (entity.entityType) {
				entity.entityType.space = null;
			}
		}
	}

	static isValidValue(value) {
		const allowed = [_.isNumber, _.isNil, _.isString, _.isArray, _.isBoolean];
		if (
			!_.some(
				allowed.map((a) => a(value)),
				(u) => u === true,
			)
		) {
			throw new Error("A value can only be a simple type or nil.");
		}
	}

	static isValidObject(obj, objectProperty = null) {
		const Entity = require("./entity");
		if (objectProperty) {
			const expectedType = objectProperty.objectType;
			if (obj.typeName !== expectedType) {
				throw new Error(Strings.ShoudBeType(objectProperty.name, expectedType));
			}
		} else {
			if (_.isNil(obj) || obj instanceof Entity) {
				return;
			}
			throw new Error("The given object can't be assigned, expected nil or an instance.");
		}
	}

	/**
	 * Tries to make sense of the given data to get an entity type.
	 * @param entityTypeSpec {*|string|EntityType} A type name, a type or a serialized type.
	 * @param throwError {boolean} Throw if the specs can't be interpreted into an entity type name.
	 * @returns {string|null}
	 */
	static getTypeNameFromSpecs(entityTypeSpec, throwError = true) {
		const EntityType = require("./entityType");
		const Entity = require("./entity");

		if (Utils.isEmpty(entityTypeSpec)) {
			if (throwError) {
				throw new Error("Can't turn the given entity type specification into an entity type.");
			}
			return null;
		} else if (entityTypeSpec instanceof EntityType) {
			return entityTypeSpec.name;
		} else if (entityTypeSpec instanceof Entity) {
			const e = entityTypeSpec;
			if (e.isTyped) {
				return e.entityType.name;
			} else {
				return e.typeName;
			}
		} else if (_.isString(entityTypeSpec)) {
			return entityTypeSpec;
		} else if (_.isPlainObject(entityTypeSpec)) {
			return entityTypeSpec.typeName !== "EntityType" ? null : entityTypeSpec.name;
		} else {
			if (throwError) {
				throw new Error("Can't turn the given entity type specification into an entity type.");
			}
			return null;
		}
	}

	/**
	 * Validates the given schema for import.
	 * Things like id, name, description are optional and the typeName of the elements will be inserted if missing.
	 * @param json {*} The schema array.
	 */
	static validateSchema(json) {
		const ValueProperty = require("./valueProperty");
		const entityTypes = json.map((e) => e.name);
		for (const entityType of json) {
			if (entityType.typeName !== "EntityType") {
				throw new Error(`Schema error: there is an object that isn't an EntityType (found: ${entityType.typeName || "nil"}).`);
			}
			if (Utils.isEmpty(entityType.name)) {
				throw new Error("Schema error: there is an entity type without a name.");
			}
			if (Utils.isEmpty(entityType.id)) {
				// throw new Error("Schema error: there is an entity type without an id.");
				entityType.id = Utils.id();
			}
			if (entityType.objectProperties) {
				for (const prop of entityType.objectProperties) {
					if (!_.includes(entityTypes, prop.objectType)) {
						throw new Error(Strings.InvalidSchemaType(prop.objectType, prop.name, entityType.name));
					}
					if (Utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have a name.`);
					}
					if (Utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: an object property of '${entityType.name}' does not have an id.`);
					}
				}
			}
			if (entityType.valueProperties) {
				for (const prop of entityType.valueProperties) {
					if (!ValueProperty.isValueType(prop.valueType)) {
						throw new Error(Strings.InvalidSchemaType(prop.valueType, prop.name, entityType.name));
					}
					if (Utils.isEmpty(prop.name)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have a name.`);
					}
					if (Utils.isEmpty(prop.id)) {
						throw new Error(`Schema error: a value property of '${entityType.name}' does not have an id.`);
					}
				}
			}
		}
	}
}

module.exports = SpaceUtils;
