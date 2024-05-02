const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const noteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "user" },
  title: String,
  content: String,
  tags: [String],
  color: String,
  archived: Boolean,
  isDeleted: {type: Boolean, default :false},
  deletedAt: {type: Date, default: null}
});

module.exports = mongoose.model("note", noteSchema);
