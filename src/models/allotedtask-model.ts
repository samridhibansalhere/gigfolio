import mongoose from "mongoose";

const AllotedTaskSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tasks",
    required: true,
  },
  isPayed: {
    type: Boolean,
    default: false,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  attachments: {
    type: Array,
    required: true,
  },
}, { timestamps: true });

if (mongoose.models && mongoose.models["allotedtasks"]) {
  delete mongoose.models["allotedtasks"];
}

const AllotedTaskModel = mongoose.model("allotedtasks", AllotedTaskSchema);

export default AllotedTaskModel;
