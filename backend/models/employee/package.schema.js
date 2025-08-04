import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: true },
  role: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  reportOffice: { type: String, required: true },
  joinedOn: { type: String, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  avatar: { type: String, default: 'assets/img/profiles/default-avatar.jpg' },
  seededAt: { type: Date, default: Date.now },
  timeZone: {type:String, required: true},
},
  { timestamps: true }
);
module.exports = mongoose.model('Employee', employeeSchema);

const taskSchema = new Schema({
  title: { type: String, required: true },
  empIds: [{ type: Types.ObjectId, ref: 'employees', required: true }],
  projectId: { type: Types.ObjectId, ref: 'projects', required: true },
  starred: { type: Boolean, default: false },
  checked: { type: Boolean, default: false },
  status: { type: String, enum: ["onHold", "ongoing", "completed", "pending"], default: "pending" }
});
export const tasks = mongoose.model("tasks", taskSchema)

const projectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  projLead: { type: Types.ObjectId, ref: 'leads', required: true },
  projManager: { type: Types.ObjectId, ref: 'employees', required: true },
  empMembers: [{ type: Types.ObjectId, ref: 'employees', required: true }],
  status: { type: String, enum: ["ongoing", "onHold", "completed", "cancelled"], default: "on-going" },
  startDate: { type: Date },
  dueDate: { type: Date },
  domain: { type: String },
  priority: { type: String, enum: ["high", "medium", "low"], default: "low" },
  clientName: { type: String },
}, { timestamps: true });

export const projects = mongoose.model("projects", projectSchema)

const meetingSchema = new mongoose.Schema({
  startTime: { type: Date, required: true,},
  title: { type: String, required: true },
  description: { type: String, trim: true },
  tag: { type: String,  enum: ["review", "development", "celebration"],default:"review" },
  leadId: { type: String, required: true },
}, { timestamps: true, })

export const meetings = mongoose.model("meetings", meetingSchema);

const skillSchema = new mongoose.Schema({
  employeeId: { type: Types.ObjectId, ref: 'employees', required: true },
  name: { type: String, required: true },
  proficiency: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true, })

export const skills = mongoose.model("skills", skillSchema);

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: Date, required: true, index: true },
  description: { type: String, required: true },
  employeeId: { type: Types.ObjectId, ref: 'leads', required: true },
}, { timestamps: true, })

export const notifications = mongoose.model("notifications", notificationSchema);

const attendanceSchema = new Schema({
  employeeId: { type: Types.ObjectId, ref: 'employees', required: true },
  date: { type: Date, required: true },
  punchIn: { type: Date },
  punchOut: { type: Date },
  breakDetails: [
    {
      start: { type: Date },
      end: { type: Date }
    }
  ],
  totalBreakMins: { type: Number, default: 0 },
  totalProductiveHours: { type: Number, default: 0 },
  attendanceStatus: { type: String, enum: ['onTime', 'late', 'absent'], required: true },
  mode: { type: String, enum: ["workFromHome", "onSite"], default: "onSite" },
  overtimeRequestStatus: { type: String, enum: ["pending", "approved", "rejected", "none"], default: "none" },
  expectedOvertimeHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
}, { timestamps: true });

export const attendance = mongoose.model("attendance", attendanceSchema);

const salaryHistorySchema = new Schema({
  empId: { type: Types.ObjectId, ref: 'employees', required: true },
  salary: { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
}, { timestamps: true, });

export const SalaryHistory = mongoose.model('salaryHistory', salaryHistorySchema);

const detailsSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  headOffice: { type: String, required: true },
  punchInTime: { type: String, required: true },
  punchOutTime: { type: String, required: true },
  totalWorkingHoursInDay: { type: Number, required: true },
  totalWorkingDays: { type: Number, required: true },
  totalLeavesAllowed: { type: Number, required: true },
  timeZone: {type: String, required: true},
}, {
  timestamps: true
});

module.exports = mongoose.model('details', detailsSchema);

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'employees' },
  leaveType: { type: String, enum: ["causual", "sick", "lossOfPay"], default: "casual", required: true },
  status: { type: String, enum: ["pending", "approved","rejected"], default: "pending", required: true },
  noOfDays: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
}, {
  timestamps: true
});

module.exports = mongoose.model('leaves', leaveSchema);