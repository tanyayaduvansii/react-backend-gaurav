import { Schema, model } from "mongoose";
// import { USER_STATUS, PAYMENT_STATUS  } from '../constants/app.constants';
// import {  USER_ROLE , ADMIN_ROLE } from '../constants/user.constants';

const TodoModel = new Schema(
  {
    todoName: { type: String, required: true },
  },
  { timestamps: true }
);
export default model("TodoModel", TodoModel);
