const mongoose = require('mongoose');
const Attendances = require('../model/Attendences');
const Students = require('../model/Students');
const isholiday = require('./holiday'); 

async function auto_attendance() {
  try {
    const today = new Date();
    const without_time = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const sts = await mongoose.connection.readyState;
    console.log(sts)
    const existingRecord = await Attendances.findOne({ date: without_time });
    const students = await Students.find()
    let atd = [];

    for (let i = 0; i < students.length; i++) {
      atd.push({
        std_id: students[i]._id,
        isPresent: true
      });
    }

    

    if (existingRecord) {
      // Update the existing document with new attendance data
      existingRecord.students = atd;
      await existingRecord.save();
    } else {
      // Create a new document
      const newAttendance = new Attendances({
        date: without_time,
        students: atd
      });
      await newAttendance.save();
    }

    console.log('Regular attendance updated successfully.');
  } catch (e) {
    console.error(e);
  }
}

async function auto_holi_attendance() {
  try {
    const today = new Date();
    const without_time = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    
    if (isholiday(without_time)) {
      const holidayReason = 'Your holiday reason here'; // Replace with the actual holiday reason
      await Attendances.updateOne({ date: without_time }, { holi: holidayReason });
      
      console.log(`Holiday reason set: ${holidayReason}`);
    } else {
      console.log('Today is not a holiday, no holiday attendance required.');
    }
  } catch (e) {
    console.error(e);
  }
}

module.exports = {
  auto_attendance,
  auto_holi_attendance,
};
