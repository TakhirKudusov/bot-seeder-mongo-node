import mongoose, { Document } from "mongoose";

export interface IBot extends Document {
  _id: mongoose.Types.ObjectId;
  image: string;
  login: string;
  createdAt: Date;
}
