import mongoose from "mongoose";

const connectDB = () => {
  return mongoose.connect(process.env.MONGODB_URI);
};
export { connectDB };
