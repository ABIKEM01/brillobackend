import express from "express";
const router = express.Router();
import {createInterest, getInterests, getInterest} from "../controllers/interests.js"
import { protect, authorizeUser } from "../middleware/auth.js";

//create interest
router.route("/create").post(protect,createInterest);

//get all interest
router.route("/").get(protect, getInterests);

//get single interest
router.route("/:id").get(protect,getInterest);

export default router;