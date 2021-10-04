const { builtinModules } = require("module");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//* VALIDATION FUNCTIONS
function dishProps(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (!name) {
        return next({
            status: 400,
            message: "Dish must include a name."
        });
    }
    if (!description) {
        return next({
            status: 400,
            message: "Dish must include a description."
        });
    }
    if (Number(price) <= 0 || typeof price != "number") {
        return next({
            status: 400,
            message: "Dish must include a price."
        });
    }
    if (!image_url) {
        next({
            status: 400,
            message: "Dish must include a image_url."
        });
    }
    res.locals.dish = req.body.data;
    next();
}

function dishExists(req, res, next) {
    const theDish = dishes.find((dish) => dish.id === req.params.dishId);
    if (theDish) {
        res.locals.dish = theDish;
        return next();
    }
    return next({
        status: 404,
        message: `Dish with id ${req.params.dishId} not found`,
    });
}

function idMatch(req, res, next) {
    if (req.params.dishId !== req.body.data.id && req.body.data.id) {
        return next({
            status: 400,
            message: `id ${req.body.data.id}`
        });
    }
    next();
}

//* CRUDL FUNCTIONS
function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
    let lastDishesId = nextId();
    const newDish = { ...res.locals.dish, id: lastDishesId };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const dishUpdate = req.body.data;
    const index = dishes.findIndex((dish) => {
        dish.id === dishUpdate.id;
    });
    if (!dishUpdate.id) {
        dishUpdate.id = req.params.dishId;
    }
    dishes[index] = dishUpdate;
    res.json({ data: dishUpdate });
}

module.exports = {
    list,
    create: [dishProps, create],
    read: [dishExists, read],
    update: [dishExists, dishProps, idMatch, update],
};
