import mongoose, { Schema } from "mongoose";
// import { User } from "./users.model";

const meetingSchema = new Schema(
    {
        user_id : {type:String},
        meetingCode: {type: String, required: true},
        date: {type: String, default:Date.now, required: true}

    }
)
const Meeting = mongoose.model("Meeting", meetingSchema);
export {Meeting};