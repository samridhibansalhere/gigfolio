import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tasks",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models["reviews"]) {
  delete mongoose.models["reviews"];
}

const ReviewModel = mongoose.model("reviews", reviewSchema);
export default ReviewModel;
