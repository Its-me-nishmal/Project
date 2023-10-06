document.getElementById('submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) return alert('not be empty')
    try {
        const response = await fetch('login', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        if (!response.ok) throw new Error('filed to log');
        const data = await response.json();
        if (data.message == 'success') window.location.href = '/admin'
    } catch (err) { console.error(err) }
})