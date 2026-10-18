const { EntitySchema } = require("typeorm");

//const userSchema =  new EntitySchema({
module.exports = new EntitySchema({
    name: "user",
    tableName: "users",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        name: {
            type: "varchar",
        },
        email:{
            type: "varchar",
            unique: true,
            nullable: false, 
        },
        password:{
            type:"varchar",

        },
    },
    relations: {
        notes: {
            target: "Note",
            type: "one-to-many",
            inverseSide: "user",
            cascade: true,
        },
    },
});
