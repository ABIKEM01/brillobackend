import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: [false, "name is required"] },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "phone number is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      default: "123456",
    },
    interests_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interest",
      required: true,
    },
    role: {
      type: String,
      required: false,
      enum: ["user", "admin"],
      default: "user",
    },
    // interests: {
    //   type: String,
    //   required: false,
    //   enum: ["Football", "Basketball", "Ice Hockey", "Motorsports"],
    //   default: "Football",
    // },
    newPassword: { type: String },
    password2: { type: String },
    isVerified: { type: Boolean, default: false },
    resetLink: { data: String },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.passwordMatched = async function (passwordToBeVerified) {
  return await bcrypt.compare(passwordToBeVerified, this.password);
};

userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    // Handle the uniqueness violation error
    const uniqueFieldError = new Error("User unique already exists.");
    next(uniqueFieldError);
  } else {
    next(error);
  }
});
// userSchema.pre("save", async function (next) {
//   console.log(this);
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   const hashed = await bcrypt.hash(this.password, salt);
//   this.password = hashed;
// });

const User = mongoose.model("User", userSchema);

export default User;
