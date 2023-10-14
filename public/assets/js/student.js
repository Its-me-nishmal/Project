// did = document.getElementById(id)
function did(...ids) {return ids.map(id => document.getElementById(id));}


const [treg,submit] = did('treg','submit'); // treg is teacher registration , submit for teacher login
const ok = submit.textContent == "Sign in"
console.log(ok);
if (ok) {
    function temp1 () {
        // submit.addEventListener('click', (e) => {
        //     const [email,password,changelog] = did('email', 'password','changelog')
        //     if (!email.value || !password.value) {
        //         changelog.textContent = 'Please fill all fields below'
        //         changelog.style.color = 'orange';
        //         e.preventDefault()
        //     } else {
        //         fetch('/student/login',{
        //             method:'POST',
        //             headers: {'Content-Type': 'application/json',
        //             body: JSON.stringify({
        //                 email:email.value,
        //                 password:password.value
        //             })}
        //         })
        //     }
        // })
        alert('login')
    } temp1()
} else {
    function temp2() {
        alert('payment')
        submit.addEventListener('click', (e) => {
            const [email,password,changelog] = did('email', 'password','changelog')
            if (!email.value || !password.value) {
                changelog.textContent = 'Please fill all fields below'
                changelog.style.color = 'orange';
                e.preventDefault()
            } else {
                fetch('/student/payment',{
                    method:'POST',
                    headers: {'Content-Type': 'application/json',
                    body: JSON.stringify({
                        email:email.value,
                        password:password.value
                    })}
                })
            }
        })
    }   temp2()
}



if (treg) {
    treg.addEventListener('click', (e) => {
        const [name , email, password, repassword, terms , chngein , std] = did('anme', 'email', 'password', 'repassword','terms-conditions', 'chngein' ,'selectNumber');
        const valid = validateInput(name.value, email.value, password.value, repassword.value, terms , std.value);
        if (valid === true) {
            fetch('/student/register',
            method  = 'POST',
            headers = {'Content-Type': 'application/json'}
            )
        } else {
            e.preventDefault();
            chngein.textContent = valid;
            chngein.style.color = "red"
        }
    });
}


function validateInput(name, email, password, repassword, terms , std) {
    if (!(name && email && password && repassword) || !std) return 'Please fill all fields';
    if (password !== repassword) return 'Password does not match';
    if (password.length < 6 || password.length > 20) return 'Password must be 6-20 characters';
    if (!/[a-z]/.test(password) 
    || !/[A-Z]/.test(password) 
    || !/[0-9]/.test(password)) { return 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol (!@#$%^&*)'}
    if (email.length < 13 || email.length > 30 || !email.includes('@') || !email.includes('.')) return 'Invalid email format';
    if (!terms.checked) return 'You must accept the terms and conditions';
    return true;
}
