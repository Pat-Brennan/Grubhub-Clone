const { statSync } = require("fs");
const path = require("path");
const { isArray } = require("util");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//* VALIDATION FUNCTIONS
function ifProps(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
    if (!deliverTo) {
      return next({ status: 400, message: `order must include a deliverTo ` });
    }
    if (!mobileNumber) {
      return next({ status: 400, message: `order must include a mobileNumber ` });
    }
    if (!dishes || !isArray(dishes) || dishes.length <= 0) {
      return next({ status: 400, message: `order must include dishes ` });
    }
    dishes.forEach((dish) => {
      if (
        typeof dish.quantity != "number" ||
        dish.quantity <= 0 ||
        !dish.quantity
      ) {
        return next({
          status: 400,
          message: `dish ${dish.id} must include quantity `,
        });
      }
    });
    next();
  }
  
  function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const theOrder = orders.find((order) => order.id === orderId);
    if (theOrder) {
      res.locals.order = theOrder;
      return next();
    }
    next({ status: 404, message: `order ${orderId} not found  ` });
  }

  function isStatus(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (!status || status === "delivered" || status === "invalid") {
      return next({
        status: 400,
        message: `status must exist and not be delivered  `,
      });
    }
    next();
  }

  function idMatch(req, res, next) {
    if (req.body.data.id != req.params.orderId && req.body.data.id) {
      return next({
        status: 400,
        message: `id ${req.body.data.id} must match  ${req.params.orderId}`,
      });
    }
    next();
  }

  function isPending(req, res, next) {
    if (res.locals.order.status === "pending") {
      return next();
    }
    return next({
      status: 400,
      message: `order must have status pending`,
    });
  }


//* CRUDL FUNCTIONS
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const newOrder = req.body.data;
  newOrder.id = nextId();
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const orderUpdate = req.body.data;
  if (!orderUpdate.id) {
    orderUpdate.id = req.params.orderId;
  }
  const index = orders.findIndex((order) => {
    order.id === orderUpdate.id;
  });
  orders[index] = orderUpdate;
  res.json({ data: orderUpdate });
}

function destroy(req, res) {
  const index = orders.findIndex((order) => {
    order.id === req.params.orderId;
  });
  orders.splice(index, 1);
  res.status(204).json({ data: req.body.data });
}


module.exports = {
  list,
  create: [ifProps, create],
  read: [orderExists, read],
  update: [orderExists, ifProps, isStatus, idMatch, update],
  delete: [orderExists, isPending, destroy],
};