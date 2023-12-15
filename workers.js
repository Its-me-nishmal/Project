// const { Worker, isMainThred, parentPort } = require('worker_threads');
// const { auto_attendance, auto_holi_attendance } = require('./services/auto_attendences');
// const auto_leave = require('./services/auto_leave')

// if(!isMainThred) {
//     parentPort.on('message',async(task)=>{
//         try{
//             if(task.type === 'auto_attendance'){
//                 await auto_attendance();
//             } else if (task.type === 'auto_holi_attendance') {
//                 await auto_holi_attendance();
//             } else if (task.type === 'auto_leave') {
//                 await auto_leave();
//             }
//             parentPort.postMessage({result:'compleate'})
//         } catch(e){parentPort.postMessage({error: e.message})}
//     })
// }