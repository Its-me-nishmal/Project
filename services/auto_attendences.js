const mongoose = require('mongoose');
const Attendances = require('../model/Attendences');
const Students = require('../model/Students');

async function auto_attendance() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day for comparison
        const students = await Students.find();
        let atd = [];

        for (let i = 0; i < students.length; i++) {
            atd.push({
                std_id: students[i]._id,
                isPresent: true
            });
        }

        const existingRecord = await Attendances.findOne({ date: today });

        if (existingRecord) {
            // Update the existing document with new attendance data
            existingRecord.students = atd;
            await existingRecord.save();
        } else {
            // Create a new document
            const newAttendance = new Attendances({
                date: today,
                students: atd
            });
            await newAttendance.save();
        }
    } catch (e) {
        console.error(e);
    }
}

module.exports = auto_attendance;
