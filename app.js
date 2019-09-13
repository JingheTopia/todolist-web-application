//jshint esversion: 6
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/toDoListDB", {
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

const todoItem = mongoose.model("todoItem", itemSchema);

const item1 = new todoItem({
  name: "This is a default item."
});

const item2 = new todoItem({
  name: "please enter your item to the list."
});

const item3 = new todoItem({
  name: "check this checkbox to complete a todo item."
});

const defaultItems = [item1, item2, item3];

let workItems = [];

let options = {
  // weekday: 'long',
  day: "numeric",
  month: "numeric",
  year: "numeric"
};
let today = new Date();
let day = today.toLocaleDateString("en-US", options);

app.get("/", function(req, res) {
  todoItem.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      todoItem.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved the default items.");
          res.redirect("/");
        }
      });
    } else {
      res.render("list", {
        ListTitle: day,
        newItemLists: foundItems
      });
    }
  });
});

let deleteName;

app.get("/:customizedName", function(req, res) {
  // res.render("list", {ListTitle : "Work", newItemLists: workItems});
  const customizedName = _.capitalize(req.params.customizedName);
  deleteName = customizedName;
  List.findOne({
    name: customizedName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const newlist = new List({
          name: customizedName,
          items: defaultItems
        });
        newlist.save();
        res.redirect("/" + customizedName);
        // console.log("Doesn't exists");
      } else {
        // console.log("exists");
        res.render("list", {
          ListTitle: foundList.name,
          newItemLists: foundList.items
        });
      }
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.post("/", function(req, res) {
  let nextItem = req.body.nextItem;
  let listName = req.body.buttonList;
  const itemTobeAdded = new todoItem({
    name: nextItem
  });
  console.log(nextItem);
  if (listName === day) {
    itemTobeAdded.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        console.log(itemTobeAdded);
        foundList.items.push(itemTobeAdded);
        console.log(foundList.items);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === day) {
    todoItem.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("successfully deleted the item!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: checkedItemId
          }
        }
      },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }
});



app.listen(process.env.PORT || 3000, function() {
  console.log("This server is running on port 3000");
});
