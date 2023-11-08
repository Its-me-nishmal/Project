const mongoose = require('mongoose');
const Attendances = require('../model/Attendences');
const Students = require('../model/Students');
const Parent = require('../model/Parents');
const isholiday = require('./holiday');
const {student_leave} = require("./mailsender")

async function auto_leave() {
  const today = new Date();
  const without_time = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (isholiday(without_time)) {
    console.log('Today is a holiday, no leave information for holidays.');
  } else {
    const leave = await Attendances.aggregate([
      {
        $match: { date: without_time }
      },
      {
        $project: {
          date: 1,
          students: {
            $filter: {
              input: '$students',
              as: 'student',
              cond: { $eq: ['$$student.isPresent', false] }
            }
          }
        }
      }
    ]);

    if (leave[0] && leave[0].students) {
      leave[0].students.filter(async (student) => {
        const parents = await Parent.find({ student_id: student.std_id });
        if (parents.length > 0) {
          parents.forEach((parent) => {
            student_leave(parent.email)
            console.log(`sending mail to ${parent.email}`)
          });
        } else{
          const studentInfo = await Students.findById(student.std_id);
          console.log(`Parents Details not completed by ${studentInfo.name}`);
        }
      });
    } else {
      console.log('No leave information for the selected date.');
    }
  }
}

module.exports = auto_leave;
