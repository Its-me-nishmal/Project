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
    fetch('/teacher/update_attendences', {
        method: "post",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tosend)
    })
    .then(res => res.json())
    .then(data => {
        window.location.reload();
    });
})