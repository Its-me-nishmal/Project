document.getElementById('update').addEventListener('click',(e)=> {
    e.preventDefault()
    const datas = document.querySelectorAll('.check-data')
    const tosend = []
    datas.forEach((b)=>{
        tosend.push({
            std: b.value,
            att: b.checked
        });
    })
    fetch('/update_attendences', {
        method: "post",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tosend)
    })
    .then(res => res.json())
    .then(data => {
        Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            text: 'Attendance has been updated.',
        });
    })
    .catch(error => {
        // Display SweetAlert notification for error
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update attendance.',
        });
    });
})