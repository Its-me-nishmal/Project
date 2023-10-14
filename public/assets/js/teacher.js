// did = document.getElementById(id)
function did(...ids) {return ids.map(id => document.getElementById(id));}


const [treg,submit] = did('treg','submit'); // treg is teacher registration , submit for teacher login

if (submit) {
    submit.addEventListener('click', (e) => {
        const [email,password,changelog] = did('email', 'password','changelog')
        if (!email.value || !password.value) {
            changelog.textContent = 'Please fill all fields below'
            changelog.style.color = 'orange';
            e.preventDefault()
        } else {
            fetch('/teacher/login',{
                method:'POST',
                headers: {'Content-Type': 'application/json',
                body: JSON.stringify({
                    email:email.value,
                    password:password.value
                })}
            })
        }
    })
}

if (treg) {
    treg.addEventListener('click', (e) => {
        const [name , email, password, repassword, terms , chngein] = did('anme', 'email', 'password', 'repassword','terms-conditions', 'chngein');
        const valid = validateInput(name.value, email.value, password.value, repassword.value, terms);

        if (valid === true) {
            fetch('/teacher/register',
            method  = 'POST',
            headers = {'Content-Type': 'application/json'},
            body = JSON.stringify({
                name: name.value,
                email: email.value,
                password: password.value
            })
            )
        } else {
            e.preventDefault();
            chngein.textContent = valid;
            chngein.style.color = "red"
        }
    });
}


function validateInput(name, email, password, repassword, terms) {
    if (!(name && email && password && repassword)) return 'Please fill all fields';
    if (password !== repassword) return 'Password does not match';
    if (password.length < 6 || password.length > 20) return 'Password must be 6-20 characters';
    if (!/[a-z]/.test(password) 
    || !/[A-Z]/.test(password) 
    || !/[0-9]/.test(password)) { return 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol (!@#$%^&*)'}
    if (email.length < 13 || email.length > 30 || !email.includes('@') || !email.includes('.')) return 'Invalid email format';
    if (!terms.checked) return 'You must accept the terms and conditions';
    return true;
}


document.addEventListener("DOMContentLoaded", function() {
    const changestatusButtons = document.querySelectorAll('.changestatus');
  
    changestatusButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
  
        // Traverse the DOM to find the closest parent form and then find the associated inputs
        const form = button.closest('form') || button.closest('div'); 
        const tclassValue = form.querySelector('.tclass').value;
        const tstatusValue = form.querySelector('.tstatus').value;
        const nmaeValue = form.querySelector('.nmae').value;
        if (!nmaeValue || !tclassValue || !tstatusValue) {
          alert('Fields cannot be empty');
        } else {
          try {
            const response = await fetch('/teacher/change_status', {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ nmae: nmaeValue, tclass: tclassValue, tstatus: tstatusValue })
            });
            if (!response.ok) throw new Error('Failed to save data');
            const data = await response.json();
            if (data) {
              window.location.reload();
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
    });
  });