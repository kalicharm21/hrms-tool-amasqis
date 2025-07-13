import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    startTime: { type: Date, required: true, index: true },
    title: { type: String, required: true},
    description: { type: String, trim: true },
    tag: { type: String, trim: true},
    leadId: {type: String, required: true},
}, {timestamps: true,})
export const meeting = mongoose.model("meeting", meetingSchema);

const skillSchema = new mongoose.Schema({
    name: {type: String, required: true},
    proficiency: { type: Number, required: true, min: 0, max: 100 }, 
}, {timestamps: true,})
export const skills = mongoose.model("skills", skillSchema);

const notificationSchema = new mongoose.Schema({
    title: {type: String, required: true},
    time: { type: Date, required: true, index: true },
    type: {type:String, required:true },
}, {timestamps: true,})
export const notifications = mongoose.model("notifications", notificationSchema);


