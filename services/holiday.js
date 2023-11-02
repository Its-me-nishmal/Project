const { isWeekend, isSameDay, addDays } = require('date-fns');
var Holidays = require('date-holidays')
var hd = new Holidays()

hd = new Holidays('US', 'IN')
hd.getHolidays(2023)

function isholiday(d){
    return hd.isHoliday(new Date(d))
}



module.exports = isholiday;