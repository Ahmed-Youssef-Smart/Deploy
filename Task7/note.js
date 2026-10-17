const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Note",
    tableName: "notes",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        title: {
            type: "varchar",
        },
        content: {
            type: "text",
        },
    },
    relations: {
        user: {
            target: "User",
            type: "many-to-one",
            joinColumn: {
                name: "userId",
            },
            onDelete: "CASCADE", 
        },
    },
});
