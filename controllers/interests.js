import Interest from "../models/interestsModel.js";
import User from "../models/usersModel.js";

//@desc: create interest
//route: POST /api/v1/interest/create
//access: public

const createInterest = async (req, res) => {
  const { name } = req.body;
  const existingInterest = await Interest.findOne({ name });
  console.log("existing user", existingInterest);
  if (existingInterest) {
    return res
      .status(400)
      .json({ message: "Interest with this name already exists" });
  }
  try {
    const interest = await Interest.create({
      name,
    });
    res.status(200).json({
      status: "Interest created successfully",
      interest: interest,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed to create interest",
      message: err.message,
    });
  }
};

//@desc: get all categories
//route: GET /api/v1/Interest
//access: public - all users
const getInterests = async (req, res) => {
  // res.send('get all users')
  try {
    const interest = await Interest.find({});
    res.status(200).json({
      status: "success",
      interest: interest,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      error: err.message,
    });
  }
};

//@desc: get single interest
//route: GET /api/v1/interest
//access: public - all users
const getInterest = async (req, res) => {
  const { id } = req.params;
  try {
    const interest = await Interest.findById(id);
    const userinterest = await User.find({ interests_id: id });
    res.status(200).json({
      status: `Interest  successfully  find`,
      interest,
      userinterest
    });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export { createInterest, getInterests, getInterest };
