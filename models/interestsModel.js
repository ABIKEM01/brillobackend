import mongoose from "mongoose";

const interestSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Interest name is required"] },
  },
  {
    timestamps: true,
  }
);

const Interest = mongoose.model("Interest", interestSchema);
export default Interest;
