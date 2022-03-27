import "reflect-metadata";
import * as _ from "lodash";

/*
 * These things are a bit shaky since reflect is not yet fully supported everywhere.
 */
const DISPLAY_KEY = "display";
const BUSINESS_NAME_KEY = "businessName";

/*
 * Decorator which tells what to display in the model's summary page.
 * Not all properties should be shown and this helps to tag the ones that should.
 * */
export function display(name: string = null) {
    return function (target: any, propertyKey: string): void {
        if (!name) {
            name = propertyKey;
        }
        const coll = Reflect.getMetadata(DISPLAY_KEY, target) || [];
        const exists = (name) => coll.filter((item) => item.name === name).length > 0;

        // property: the actual name in the class
        // name: the name to use when rendering things
        if (!exists(name)) {
            coll.push({property: propertyKey, name: name});
        }
        Reflect.defineMetadata(DISPLAY_KEY, coll, target);
    };
}

export function getDisplayNames(target: { prototype: any }) {
    if (_.isNil(target)) {
        return [];
    }
    return (Reflect.getMetadata(DISPLAY_KEY, target) || []) as string[];
}

/*
 * Decorator contains info  which can be used during import/export to map from/to the OI context.
 * Can be place both on a class and on a property.
 * */
export function businessName(name: string = null) {
    return function (target: any, propertyName: string = null): void {
        if (!name) {
            name = "";
        }
        // const coll = Reflect.getMetadata(BUSINESS_NAME_KEY, target) || [];
        // const exists = (name) => coll.filter((item) => item.name === name).length > 0;
        //
        // // property: the actual name in the class
        // // name: the business name
        // if (!exists(name)) {
        // 	coll.push({ property: propertyKey, name: name });
        // }
        if (propertyName) {
            Reflect.defineMetadata(BUSINESS_NAME_KEY, name, target, propertyName) ;
        } else {
            Reflect.defineMetadata(BUSINESS_NAME_KEY, name, target);
        }
    };
}

export function getBusinessName(target: any, propertyName: string = null) {
    if (propertyName) {
        return Reflect.getMetadata(BUSINESS_NAME_KEY, target.prototype, propertyName) || null;
    } else {
        return Reflect.getMetadata(BUSINESS_NAME_KEY, target) || null;
    }
}
