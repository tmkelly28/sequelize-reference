/**
 * Welcome to the Sequelize sandbox!
 * Want to try out some sequelize code?
 * Define your models below, and then use them in the
 * promise chain!
 */
const Sequelize = require('sequelize')
const db = new Sequelize('postgres://localhost:5432/pug-party')

// write your models and associations here!

db.sync({force: true})
  .then(() => {
    // start using your models here!
  })
  .then(() => {
    db.close() // closes the db gracefully
  })
  .catch(err => {
    console.error('Uh oh, something does not compute!')
    console.error(err.message)
    console.error(err.stack)
    db.close()
  })
