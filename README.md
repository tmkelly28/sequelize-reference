# Sequelize

---

## Connect to database

```javascript
const Sequelize = require('sequelize')
const db = new Sequelize('postgres://localhost:5432/your-db')
```

## Defining Models

```javascript
const Pug = db.define('pugs', {
  // column names go here
})
```

### Column Types
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-definition.html#data-types)

The example below demonstrates some common data types:

```javascript
const Pug = db.define('pugs', {
  name: {
    type: Sequelize.STRING // for shorter strings (< 256 chars)
  },
  bio: {
    name: Sequelize.TEXT // for longer strings
  },
  age: {
    type: Sequelize: INTEGER
  },
  birthday: {
    type: Sequelize.DATE
  },
  colors: {
    type: Sequelize.ENUM('black', 'fawn')
  },
  toys: {
    type: Sequelize.ARRAY(Sequelize.TEXT) // an array of text strings (Postgres only)
  },
  adoptedStatus: {
    type: Sequelize.BOOLEAN
  }
})
```

#### Validators and Default Value
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-definition.html#validations)

The example below demontrates usage for important validations (allowNull, min/max) and also demonstrates how to set a default value (defaultValue)

```javascript
const Pug = db.define('pugs', {
  name: {
    type: Sequelize.STRING
    allowNull: false // name MUST have a value
  },
  bio: {
    name: Sequelize.TEXT
  },
  age: {
    type: Sequelize: INTEGER,
    validate: {
      min: 0,
      max: 100
      // note: many validations need to be defined in the "validate" object
      // allowNull is so common that it's the exception
    }
  },
  birthday: {
    type: Sequelize.DATE,
    defaultValue: Date.now()
    // if no birthday is specified when we create the row, it defaults to right now!
  },
  colors: {
    type: Sequelize.ENUM('black', 'fawn')
  },
  toys: {
    type: Sequelize.ARRAY(Sequelize.TEXT)
  },
  adoptedStatus: {
    type: Sequelize.BOOLEAN
  }
})
```

### Instance Methods

The code example below demonstrates an instance method.
Instance methods are methods that are available on *instances* of the model.
We often write these to get information or do something related *to that instance*.

##### Definition:
```javascript
const Pug = db.define('pugs', {/* etc*/})

// instance methods are defined on the model's .prototype
Pug.prototype.celebrateBirthday = function () {
  // 'this' in an instance method refers to the instance itself
  const birthday = new Date(this.birthday)
  const today = new Date()
  if (birthday.getMonth() === today.getMonth() && today.getDate() === birthday.getDate()) {
    console.log('Happy birthday!')
  }
}
```

##### Usage:

```
Pug.create({name: 'Cody'}) // let's say `birthday` defaults to today
  .then(createdPug => {
    // the instance method is invoked *on the instance*
    createdPug.celebrateBirthday() // Happy birthday!
  })
```


### Class Methods

The code example below demonstrates a class method.
Class methods are methods that are available on the *model itself* (aka the _class_).
We often write these to get instances, or do something to more than one instance

##### Definition

```javascript
const Pug = db.define('pugs', {/* etc*/})

// class methods are defined right on the model
Pug.findPuppies = function () {
  // 'this' refers directly back to the model (the capital "P" Pug)
  return this.findAll({ // could also be Pug.findAll
    where: {
      age: {$lte: 1} // find all pugs where age is less than or equal to 1
    }
  })
}
```

##### Usage
```javascript
Pug.findPuppies()
  .then(foundPuppies => {
    console.log('Here are the pups: ', foundPuppies)
  })
  .catch(err => {
    console.log('Oh noes!')
    // deal with errors
  })
```

### Getters and Setters
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-definition.html#getters-setters)

Getters and setters are ways of customizing what happens when someone 'gets' or 'sets' a property on an instance. 'Get' and 'set' are referred to as "meta-operations" in JavaScript.

```javascript
const someObj = {foo: 'bar'}
someObj.foo // the 'get' meta-operation
someObj.foo = 'baz' // the 'set' meta-operation
```

Normally, we expect that 'getting' a property will simply return the value at that key in the object, and 'setting' a property will set that property in the object.

'Getters' and 'setters' allow us to *override* that expected behavior.

##### Definition

```javascript
const Pug = db.define('pugs', {
  name: {
    type: Sequelize.STRING,
    get () { // this defines the 'getter'
      // 'this' refers to the instance (same as an instance method)
      // in a 'getter', you should not refer to the names of the columns directly
      // as this will recursively call the getter and result in a stack overflow,
      // instead, use the `this.getDataValue` method
      return this.getDataValue('name') + ' the pug'
      // this getter will automatically append ' the pug' to any name
    },
    set (valueToBeSet) { // defines the 'setter'
      // 'this' refers to the instance (same as above)
      // use `this.setDataValue` to actually set the value
      this.setDataValue('name', valueToBeSet.toUpperCase())
      // this setter will automatically set the 'name' property to be uppercased
    }
  }
})
```

##### Usage

```javascript
// building or creating an instance will trigger the 'set' operation, causing the name to be capitalized
Pug.create({name: 'cody'})
  .then(createdPug => {
    // when we 'get' createdPug.name, we get the capitalized 'CODY' + ' the pug' from our getter
    console.log(createdPug.name) // CODY the pug

    // this is the 'set' operation, which will capitalize the name we set
    createdPug.name = 'murphy'
    console.log(createdPug.name) // MURPHY the pug
  })
```

### Virtual Columns

"Virtual" columns are columns that *do not* get saved in your database - they are calculated on the fly based on the values of other columns. They are helpful for saving space if there are values we want to use on our instances that can be easily calculated.

Virtual columns always have the data type of Sequelize.VIRTUAL.

Virtual columns must have *at least* one custom 'getter' or 'setter' to be useful. This does not mean that getters and setters can _only_ be used with virtual columns though (see above).

Virtual columns are similar to instance methods. The difference is you access virtual columns the same way you access a regular property (via the 'get' and 'set' meta-operation), whereas instance methods are functions that you must invoke.

##### Definition

```javascript
const Pug = db.define('pugs', {
  firstName: {
    type: Sequelize.STRING,
  },
  lastName: {
    type: Sequelize.STRING
  },
  fullName: {
    type: Sequelize.VIRTUAL,
    get () {
      return this.getDataValue('firstName') + ' ' + this.getDataValue('lastName')
    }
  }
})
```

##### Usage

```javascript
Pug.create({firstName: 'Cody', lastName: 'McPug'})
  .then(pug => {
    console.log(pug.fullName) // "Cody McPug"
    // however, if you look inside your database, there won't be a "fullName" column!
  })
```

### Hooks
[Docs](http://docs.sequelizejs.com/manual/tutorial/hooks.html)

When we perform various operations in sequelize (like updating, creating, or destroying an instance), that's not _all_ that happens. There are various stages that an instance goes through as it's being updated/created/destroyed. These are called *lifecycle events*. Hooks give us the ability to "hook" into these lifecycle events and execute arbitrary functions related to that instance.

This can be useful in several ways. For example:

* Before creating an instance of a User, we could encrypt that user's plaintext password, so that what gets saved is the encrypted version
* Before destroying an instance of a TodoList, we could also destroy all Todos that are associated with that TodoList.

We define hooks on the model, but they are executed against instances when those instances pass through those lifecycle events.

All hooks are defined using a function that takes two arguments. The first argument is the instance passing through the lifecycle hook. The second argument is an options object (rarely used - you can often ignore it or exclude it).

Here's what the above two examples might look like. Note that there are several different ways that hooks can be defined (but they are mostly equivalent).

```javascript
// given the following User model:
const User = db.define('users', {
  name: Sequelize.STRING,
  password: Sequelize.STRING
})
// we want to hook into the "beforeCreate" lifecycle event
// this lifecycle event happens before an instance is created and saved to the database,
// so we can use this to change something about the instance before it gets saved.

User.beforeCreate((userInstance, optionsObject) => {
  userInstance.password = encrypt(userInstance.password)
})

// This lifecycle hook would get called after calling something like:
// User.create({name: 'Cody', password: '123'})
// and it would run before the new user is saved in the database.
// If we were to inspect the newly created user, we would see that
// the user.password wouldn't be '123', but it would be another string
// representing the encrypted '123'
```

```javascript
// given the following TodoList and Todo models:
const TodoList = db.define('todolists', {
  name: Sequelize.STRING
})

const Todo = db.define('todo', {
  name: Sequelize.STRING,
  completedStatus: Sequelize.BOOLEAN
})

Todo.belongsTo(TodoList, {as: 'list'})

// we want to hook into the "beforeDestroy" lifecycle event
// this lifecycle event happens before an instance is removed from the database,
// so we can use this to "clean up" other rows that are also no longer needed
TodoList.beforeDestroy((todoListInstance) => {
  // make sure to return any promises inside hooks! This way Sequelize will be sure to
  // wait for the promise to resolve before advancing to the next lifecycle stage!
    return Todo.destroy({
      where: {
        listId: todoListInstance.id
      }
    })
})
```

### Associations
[Docs](http://docs.sequelizejs.com/manual/tutorial/associations.html)

Associations in Sequelize establish three things:

1. For one-one or one-many associations, it establishes a foreign key relationship between two tables (though a table could be related to itself). For many-many associations, it establishes a join-table that contains pairs of foreign keys.
2. It creates several special instance methods (like "getAssociation", "setAssociation", and potentially others depending on the type of association) that an instance can use to search for the instances that they are related to
3. It creates the ability to use "include" in queries to include data about related rows (known as "eager loading")

##### Types of Associations

It is possible to specify the following associations in Sequelize:

* `belongsTo`
* `hasOne`
* `hasMany`
* `belongsToMany`

These relations can be combined to establish *one-one*, *one-many* and *many-many* relationships, like so:

* `one-one`
  * `A.belongsTo(B)`
  * `B.hasOne(A)`

* `one-many`
  * `A.belongsTo(B)`
  * `B.hasMany(B)`

* `many-many`
  * `A.belongsToMany(B, {through: 'AB'})`
  * `B.belongsToMany(A, {through: 'AB'})`

##### One-One Relations

A one-one association is established by pairing a `belongsTo` and a `hasOne` association (though the `hasOne` is often omitted).

Say we have two model tables, `Pug` and an `Owner`. We might associate them like so:

```javascript
Pug.belongsTo(Owner)
Owner.hasOne(Pug)
```

This means that a pug belongs to an owner, and an owner has one (and only one) pug.

By doing this, the following three things will happen/be available to use:

1. The Pug table will have a foreign key column, "ownerId", corresponding to a primary key in the Owner table.

*Pugs* - includes an ownerId!
```
id | name | createdAt | updatedAt | ownerId
```

*Owner* - no changes!
```
id | name | createdAt | updatedAt
```

2. Sequelize automatically creates two instance methods for pugs, "getOwner" and "setOwner". This is because we defined `Pug.belongsTo(Owner)`. Likewise, owners get two instance methods, "getPug" and "setPug" (because we defined `Owner.hasOne(Pug)`).

```javascript
pug.getOwner() // returns a promise for the pug's owner

pug.setOwner(ownerInstanceOrID) // updates the pug's ownerId to be the id of the passed-in owner, and returns a promise for the updated pug

owner.getPug() // returns a promise for the owner's pug

owner.setPug(pugInstanceOrID) // updates the passed-in pug's ownerId to be the id of the owner, and returns a promise for the updated pug
```

3. Sequelize will allow us to "include" the pug's owner, or the owner's pug in queries.

```javascript
return Pug.findAll({
  include: [{model: Owner}]
})
.then(pugsWithTheirOwners => {
  console.log(pugsWithTheirOwners[0])
  // looks like this:
  // {
  //   id: 1,
  //   name: 'Cody',
  //   ownerId: 1,
  //   owner: {
  //     id: 1,
  //     name: 'Tom'
  //   }
  // }
})
```

Likewise (but note that if we do omit the `Owner.hasOne(Pug)`, this is not possible):

```javascript
return Owner.findAll({
  include: [{model: 'Pug'}]
})
.then(ownersWithTheirPug => {
  console.log(ownersWithTheirPug[0])
  // looks like this:
  // {
  //   id: 1,
  //   name: 'Tom',
  //   pug: {
  //     id: 1,
  //     name: 'Cody',
  //     ownerId: 1
  //   }
  // }
})
```

##### One-Many Associations

A one-many association is established by pairing a `belongsTo` and a `hasMany` relation (though like `hasOne`, the `belongsTo` is sometimes omitted).

Given our Pug and Owner, we might allow an owner to have multiple pugs like so:

```javascript
Pug.belongsTo(Owner)
Owner.hasMany(Pug)
```

This means that a pug belongs to an owner, and an owner can have many pugs (also known a a [grumble](https://www.google.com/search?q=grumble+of+pugs&ie=utf-8&oe=utf-8&client=firefox-b-1-ab)).

By doing this, the following three things will happen/be available to use:

1. The Pug table will have a foreign key column, "ownerId", corresponding to a primary key in the Owner table. *Note: this is the same as a one-one association*.

*Pugs* - includes an ownerId!
```
id | name | createdAt | updatedAt | ownerId
```

*Owner* - no changes!
```
id | name | createdAt | updatedAt
```

2. Sequelize automatically creates three instance methods for pugs, "getOwner", "setOwner", and "createOwner". This is because we defined `Pug.belongsTo(Owner)`. Likewise, owners get a bunch of new instance methods, "getPugs", "setPugs", "createPug", "addPug", "addPugs", "removePug", "removePugs", "hasPug", "hasPugs", and "countPugs" (because we defined `Owner.hasMany(Pug)`). *Note: the difference here from one-one is that the owner's methods are now pluralized, and return promises for arrays of pugs instead of just a single pug!*

```javascript
pug.getOwner() // returns a promise for the pug's owner

pug.setOwner(owner) // updates the pug's ownerId to be the id of the passed-in owner, and returns a promise for the updated pug

owner.getPugs() // returns a promise for an array of all of the owner's pugs (that is, all pugs with ownerId equal to the owner's id)

owner.setPugs(arrayOfPugs)
// updates each pug in the passed in array to have an ownerId equal to the owner's id.
// returns a promise for the owner (NOT the pugs)
```

3. Sequelize will allow us to "include" the pug's owner, or the owner's pugs in queries.

```javascript
// this is the same as one-one
return Pug.findAll({
  include: [{model: Owner}]
})
.then(pugsWithTheirOwners => {
  console.log(pugsWithTheirOwners[0])
  // looks like this:
  // {
  //   id: 1,
  //   name: 'Cody',
  //   ownerId: 1,
  //   owner: {
  //     id: 1,
  //     name: 'Tom'
  //   }
  // }
})
```

Likewise (but note that if we do omit the `Owner.hasMany(Pug)`, this is not possible):

```javascript
// the difference is that instead of a "pug" field, the owner has a "pugs" field, which is an array of all that owner's pugs
return Owner.findAll({
  include: [{model: 'Pug'}]
})
.then(ownersWithTheirPug => {
  console.log(ownersWithTheirPug[0])
  // looks like this:
  // {
  //   id: 1,
  //   name: 'Tom',
  //   pugs: [{
  //     id: 1,
  //     name: 'Cody',
  //     ownerId: 1
  //   }]
  // }
})
```

##### Many-Many Associations

One-One and One-Many associations are very similar. Many-Many associations are different! Instead of placing a foreign key in one table, they create a brand new "join" table where each row contains a foreign key for each entity in the relationship.

For our example, let's introduce a new table, Friend:

```
const Friend = db.define('friends', {
  name: Sequelize.STRING
})
```

A "friend" is a (human) person that is friends with pugs (but not necessarily a pug Owner themselves)! Any given "friend" may be a friend of many pugs. Likewise, any given pug will have many human friends! This is the nature of a many-to-many relationship.

Here is how we define one:

```
Friend.belongsToMany(Pug, {through: 'friendship'})
Pug.belongsToMany(Friend, {through: 'friendship'})
```

The "through" parameter defines the name of the join table that gets created.

By establishing the relation above, the following *four* things happen:

1. A brand new table called `"friendship"` is created.

*friendship*
```
createdAt | updatedAt | pugId | pugFriendId
```

No changes occur to the `pug` or `friend` tables!

2. A new Sequelize model becomes automatically generated for the table:

```javascript
const Friendship = db.model('friendship')
```

You can use this model the same way you use any other Sequelize model (you can query it, create instances, etc).

3. Sequelize automatically creates several instance methods for pugs and for friends, the same ones as created by `hasMany` above:

```
pug.getFriends() // returns a promise for the array of friends for that pug
pug.addFriend(friend) // creates a new row in the friendship table for the pug and the friend, returns a promise for the friendship (NOT the pug OR the friend - the "friendship")
pug.addFriends(friendsArray) // creates a new row in the friendship table for each friend, returns a promise for the friendship
pug.removeFriend(friend) // removes the row from the friendship table for that pug-friend, returns a promise for the number of affected rows (as if you'd want to destroy any friendships...right?)
pug.removeFriends(friendsArray) // removes the rows from the friendship table for those pug-friend pairs, returns a promise for the number affected rows

// analogous to above ^
friend.getPugs()
friend.addPug(pug)
friend.addPugs(pugsArray)
friend.setPugs(pugsArray)
friend.removePug(pug)
friend.removePugs(pugsArray)
```

4. Allows us to include a pug's friends, or a friend's pugs

```javascript
Pug.findAll({
  include: [{model: Friend}]
})
.then(pugsWithFriends => {
  console.log(pugsWithFriends[0])
  // looks like this:
  // {
  //  id: 1,
  //  name: 'Cody',
  //  friends: [
  //    {
  //      id: 1,
  //      name: 'CodyFan <3'
  //    },
  //    ....any many more!
  //  ]
  // }
})
```

The inverse also applies if we `Friend.findAll({include: [{model: Pug}]})`

---

## Querying Using Models

### Model.findOne
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#-find-search-for-one-specific-element-in-the-database)

Finds a single instance that matches the search criteria (even if there are more than one that match the search criteria - it will return the first it finds)

```javascript
Pug.findOne({
  where: {name: 'Cody'}
})
.then(foundPug => {
  console.log(foundPug)
})
```

### Model.findById
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#-find-search-for-one-specific-element-in-the-database)

Finds the instance with the specified id.

```javascript
Pug.findById(1)
.then(pugWithIdOne => {
  console.log(pugWithIdOne)
})
```
### Model.findAll
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#-findall-search-for-multiple-elements-in-the-database)

Finds all instances that match the search criteria. If no criteria are given, it returns all the instances in the table.

```javascript
Pug.findAll() // will find ALL the pugs!
  .then(allPugs => {
    console.log(allPugs)
  })
```

#### "Select" Clauses ("attributes")
[Docs](http://docs.sequelizejs.com/manual/tutorial/querying.html#attributes)

You can select specific columns to be included in the returned instance by specifying an "attributes" array.

```javascript
Pug.findAll({
  attributes: ['id', 'name', 'age'] // like saying: SELECT id, name, age from pugs;
})
  .then(allPugs => {
    console.log(allPugs) // [{id: 1, name: 'Cody', age: 7}, {id: 2, name: "Murphy", age: 4}]
    // note that all the pugs only have key-value pairs for id, name and age included
  })
```

#### "Where" Clauses
[Docs](http://docs.sequelizejs.com/manual/tutorial/querying.html#where)

You can narrow down the search in a `findAll` by specifying a `where` clause

```javascript
Pug.findAll({
  where: { // like saying: SELECT * from pugs WHERE age = 7;
    age: 7,
  }
})
.then(sevenYearOldPugs => {
  console.log(sevenYearOldPugs)
})
```

Specifying multiple options uses "AND" logic

```javascript
Pug.findAll({
  where: { // like saying: SELECT * from pugs WHERE age = 7 AND color = 'black';
    age: 7,
    color: 'black'
  }
})
.then(sevenYearOldBlackPugs => {
  console.log(sevenYearOldBlackPugs)
})
```

##### Search Operators
[Docs](http://docs.sequelizejs.com/manual/tutorial/querying.html#operators)

We often want to specify comparisons like "greater than", "less than" in our `where` clauses.

In sequelize, we need to use special properties called "operators" to do this. Here are some of the most common. (Note: there are of course many more operators - there's no need to memorize all of them, but be sure to read through them so that you have an idea of what you can do!)

*Note*: Up until very recently, we used regular object properties to refer to operators. In upcoming versions of Sequelize, these will be replaced by Symbols that must be obtained from Sequelize, like so:

```javascript
// Sequelize stores these operators on the `Sequelize.Op` module:
const Op = Sequelize.Op

Pug.findAll({
  where: {
    age: {
      [Op.lte]: 7 // square brackets are needed for property names that aren't plain strings
    }
  }
})
```

The examples below demonstrate using operators as regular object properties, with the Symbol equivalent in an adjacent comment.

Here is a list of some of the more commonly used operators, and their usage:

* $gt: Greater than // soon to be replaced by [Op.gt]
* $gte: Greater than or equal // soon to be replaced by [Op.gte]
* $lt: Less than // soon to be replaced by [Op.lt]
* $lte: Less than or equal // soon to be replaced by [Op.lte]
* $ne: Not equal // soon to be replaced by [Op.ne]
* $eq: Equal // soon to be replaced by [Op.eq]
* $or: Use or logic for multiple properties // soon to be replaced by [Op.or]


```javascript
// gt, gte, lt, lte

// SELECT * FROM pugs WHERE age <= 7
Pug.findAll({
  where: {
    age: {
      $lte: 7 // soon to be replaced by [Op.lte]
    }
  }
})
```

```javascript
// $ne

// SELECT * FROM pugs WHERE age != 7
Pug.findAll({
  where: {
    age: {
      $ne: 7 // soon to be replaced by [Op.ne]
    }
  }
})
```

```javascript
// $or

// SELECT * FROM pugs WHERE age = 7 OR age = 6
Pug.findAll({
  where: {
    age: {
      $or: [ // soon to be replaced by [Op.or]
        {$eq: 7}, // soon to be replaced by [Op.eq]
        {$eq: 6} // soon to be replaced by [Op.eq]
      ]
    }
  }
})
```

#### Joins/Includes (aka "Eager Loading")
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#eager-loading)

If we have two tables that are associated with each other, we often want to join that data together. In raw SQL queries, our favorite tool for this is an INNER JOIN. We can do something similar in Sequelize - it just goes by the slightly different name of "eager loading". Don't get hung up on the terminology - when you see "eager loading", think "join two tables".

If two tables have an association, we can "include" information from the associated table like so:

```
const Pug = db.define('pugs', {name: Sequelize.STRING})
const Owner = db.define('owners', {name: Sequelize.STRING})

Pug.belongsTo(Owner)

Pug.findAll({ // we want to find all the pugs, and include their owners
  include: [{model: Owner}]
})
  .then(pugs => console.log(pugs))
  // [{name: 'Cody', ownerId: 1, owner: {name: 'Tom'}}, ...etc]
```

*Important!* A Model can only eagerly load an association if the association is defined *on* that model.

This means that for the above example, if we attempt to do the following:

```
const Pug = db.define('pugs', {name: Sequelize.STRING})
const Owner = db.define('owners', {name: Sequelize.STRING})

// the relation only exists on Pug
Pug.belongsTo(Owner)

Owner.findAll({include: [{model: Pug}]}) // this will error!
```

...it will error! For us to include Pug when we query Owner, we must also establish the 'hasOne' or 'hasMany' association between Owners and Pugs.

Example with `hasOne`:

```javascript
const Pug = db.define('pugs', {name: Sequelize.STRING})
const Owner = db.define('owners', {name: Sequelize.STRING})

Pug.belongsTo(Owner)
Owner.hasOne(Pug) // 1-1 association

Owner.findAll({include: [{model: Pug}]})
  .then(owners => console.log(owners)) // [{name: 'Tom', pug: {name: 'Cody', ownerId: 1}}]
```

Example with `hasMany`:

```javascript
const Pug = db.define('pugs', {name: Sequelize.STRING})
const Owner = db.define('owners', {name: Sequelize.STRING})

Pug.belongsTo(Owner)
Owner.hasMany(Pug) // 1-Many Relationship

Owner.findAll({include: [{model: Pug}]})
  .then(owners => console.log(owners)) // [{name: 'Tom', pugs: [{name: 'Cody', ownerId: 1}]}]
```

Note that the difference between the two examples above is that in the `hasOne` case, the resultant owenrs have a "pug" field with the name of their (single) pug. In the `hasMany` case, the resultant owners have a "pugs" (plural!) field with an _array_ of their (possibly many) pugs!

This same rule applies to many-to-many associations!

### Model.findOrCreate
[Docs](http://docs.sequelizejs.com/manual/tutorial/models-usage.html#-findorcreate-search-for-a-specific-element-or-create-it-if-not-available)

Finds an instance that matches the specified query. If no such instance exists, it will create one. This method is a little funny - it returns a promise for an array! The first element of the array is the instance. The second element is a boolean (true or false), which will be true if the instance was newly created, and false if it wasn't (that is, an existing match was found).

In the example below, assume we do not have any existing row in our pugs table with the name 'Cody'.

```javascript
Pug.findOrCreate({where: {name: 'Cody'}})
  .then(arr => { // findOrCreate is a promise for an array!
    const instance = arr[0] // the first element is the instance
    const wasCreated = arr[1] // the second element tells us if the instance was newly created
    console.log(instance) // {id: 1, name: 'Cody', etc...}
    console.log(wasCreated) // true

    return Pug.findOrCreate({where: {name: 'Cody'}}) // now if we findOrCreate a second time...
  })
  .then(arr => {
    const instance = arr[0]
    const wasCreated = arr[1]
    console.log(instance) // {id: 1, name: 'Cody', etc...}
    console.log(wasCreated) // false -> the query found an existing pug that matched the query
  })
```

It's often preferably to handle with a promise for an array using `.spread`. We can do this because the promises returned by Sequelize are "Bluebird" promises.

```javascript
Pug.findOrCreate({where: {name: 'Cody'}})
  .spread((instance, wasCreated) => {/* ...etc */})
```

With pure JavaScript, we can use array destructuring to do the same thing:

```javascript
Pug.findOrCreate({where: {name: 'Cody'}})
  .spread(([instance, wasCreated]) => {/* ...etc */})
```
For other examples of this pattern: http://es6-features.org/#ParameterContextMatching

### Model.build

Creates a temporary instance. Returns the instance. This instance is NOT yet saved to the database!

```javascript
const cody = Pug.build({name: 'Cody'})
console.log(cody) // we can start using cody right away...but cody is NOT in our db yet
```

### Model.create

Creates and saves a new row to the database. Returns a promise for the created instance.

```javascript
Pug.create({name: 'Cody'})
  .then(cody => {
    // now, cody is saved in our database
    console.log(cody)
  })
```

### Model.update

Updates all instances that match a query.
Takes two parameters: the first parameter contains the info you want to update. The second parameter contains the query for which instances to update.

Like `findOrCreate`, it returns a promise for an array. The first element of the array is the number of rows that were affected. The second element of the array is the affected rows themselves.

```javascript
Pug.update({adoptedStatus: true}, {where: {age: 7}}) // update all pugs whose age is 7 to have an adoptedStatus of true
  .spread((numberOfAffectedRows, affectedRows) => { // because we return a promise for an array, .spread is recommended
    console.log(numberOfAffectedRows) // say we had 3 pugs with the age of 7. This will then be 3
    console.log(affectedRows) // this will be an array of the three affected pugs
  })
```

### Model.destroy

Destroys all instances that match a query.
It returns a promise for the number of rows that were deleted.

```javascript
Pug.destroy({
  where: {
    age: 7 // deletes all pugs whose age is 7
  }
})
  .then(numAffectedRows => {
    console.log(numAffectedRows) // if we had 3 pugs with the age of 7, this will be 3
  })
```

---

## Using Instances

### instance.save and instance.update
[Docs](http://docs.sequelizejs.com/manual/tutorial/instances.html#updating-saving-persisting-an-instance)

If we already have an instance, we can save changes with either instance.save or instance.update

Both returns promises for the saved/updated instance

Here's an example using save:
```javascript
// we already have a pug instance, which we've put in a variable called cody
console.log(cody.age) // 7
cody.age = 8 // we can change the age to 8 (but it isn't saved in the database yet)
cody.save() // we can use .save to actually save to the database
  .then(updatedCody => {
    console.log(updatedCody.age) // 8
  })
```

Here's another example using update:
```javascript
console.log(cody.age) // 7
cody.update({age: 8})
  .then(updatedCody => {
    console.log(updatedCody.age) // 8
  })
```

### instance.destroy
[Docs](http://docs.sequelizejs.com/manual/tutorial/instances.html#destroying-deleting-persistent-instances)

If we want to remove an individual instance from the database, we can use instance.destroy.
It returns a promise that will be resolved when the row is removed from the database.
(The promise itself does not resolve to anything in particular though - it's always just an empty array)

```javascript
cody.destroy() // no! bye Cody!
  .then(() => { // no need to expect the promise to resolve to any useful value
    // now the cody row is no longer in the database
  })
```

