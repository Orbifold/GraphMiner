An entity space consists of entity types, entities, relationships... and can be considered as a gateway to a knowledge graph.

## Schema or Ontology
The entity space allows you to define a schema (in a semantic context one speaks of an ontology) which defines the types of entities you can encounter as well as how to .

> A schema is enforced by default but can be switched off. In this case you can add anything you like to the knowledge graph.
## Entity Types



## CRUD Overview

```js
  // create an in-memory entity space
    const space = await EntitySpace.inMemory();

    // the space metadata is an arbitrary dictionary
    await space.setMetadata("description", "Testing things out.")

    // add a Car type
    const Car = await space.addEntityType("Car");
    // an instance aka entity of a Car
    const toyota = await Car.createInstance("Toyota")
    // this instance is now in the space
    const found = await space.getInstanceById(toyota.id)
    console.assert(found.id === toyota.id, null, "Should be the same")

    // can also add an instance via the space
    await space.createInstance(Car, "Ford")
    const cars = await space.getInstances("Car")
    console.assert(cars.length === 2, null, "Should have two cars.")

    // this car defines a color but the schema will not pick it up
    const mazda = await Car.createInstance({name: "Mazda", color: "Red"})
    console.assert(mazda.valuePropertyExists("color") === false)
    // can also be seen if you serialize the instance
    console.assert(mazda.toJSON()["color"] === undefined)
    // to have a color we need to define it in the schema
    await space.addValueProperty(Car, "color", "string")
    // now the color will be included
    const redMazda = await Car.createInstance({name: "Mazda", color: "Red"})
    console.assert(redMazda.toJSON()["color"] === "Red")

    // update the color
    const blueMazdaData = redMazda.toJSON()
    blueMazdaData.color = "Blue"
    await space.upsertInstance(Car, blueMazdaData)
    let car = await space.getInstanceById(redMazda.id)
    console.assert(car.get("color") === "Blue")

    // remove it
    await space.removeInstance(car.id)
    car = await space.getInstanceById(redMazda.id)
    // ain't there anymore
    console.assert(car === null)

    // the entity type and instances can be removed like so
    await space.removeEntityType("Car", true)
    // can also clear the whole space in one go
    await space.clear()

    // to check all things are gone you can use
    console.assert(await space.countEntities() === 0)
    console.assert(await space.countEntityTypes() === 0)

    // the metadata is however not cleared
    console.assert(await space.getMetadata("description") === "Testing things out.")

```
