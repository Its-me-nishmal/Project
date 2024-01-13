// did = document.getElementById(id)
function did(...ids) { return ids.map(id => document.getElementById(id)); }

function showAdminModal() {
  const adminEmail = document.getElementById('adminEmail').textContent;
  const targetEmail = 'admin@example.com';
  if (adminEmail === targetEmail) {
    const adminModal = new bootstrap.Modal(document.getElementById('adminModal'));
    adminModal.show();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  showAdminModal();
  const [submitButton] = did('submit')
  if (submitButton) {
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      if (!email || !password) return alert('Fields cannot be empty');
      try {
        const response = await fetch('login', {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Failed to log in');
        const data = await response.json();
        if (data.reload) {
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const [modalok] = did('modalok');
  if (modalok) {
    const [email, password, repassword] = did('adEmail', 'adminPassword', 'adminRePassword');
    modalok.addEventListener('click', async (e) => email.value === '' || email.value === 'admin@example.com' ? showtoast('change email and try again') : password.value === '' || password.value !== repassword.value ? showtoast('password not match') : adminchange(email.value, password.value))
  }
});


function showtoast(msg) {
  alert(msg)
}



async function adminchange(email, password) {
  const validationResult = validation(email, password);

  if (validationResult === 'Valid') {
    try {
      const response = await fetch('admin/new_pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Something went wrong!!!');
      }

      const data = await response.json();

      if (!document.cookie.admin_token) window.location.href = '/admin/login'
    } catch (err) {
      console.error(err);
    }
  } else if (validationResult === 'Invalid email') {
    alert('Please enter a valid email');
  } else {
    alert('Password must be exactly 4 characters long and contain unique symbols');
  }
}


function validation(email, password) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  if (!emailRegex.test(email)) {
    return "Invalid email";
  }

  // Password should be exactly 4 characters long and contain unique symbols
  const passwordRegex = /^[@#$%^&*()_+{}\[\]:;<>,.?~\\\-|=\/]+$/;

  if (password.length !== 4) {
    return "Invalid password";
  }

  // Check if all characters in the password are unique
  const uniqueCharacters = new Set(password);
  if (uniqueCharacters.size !== 4) {
    return "Invalid password";
  }

  return "Valid";
}

document.addEventListener("DOMContentLoaded", function () {
  const changestatusButtons = document.querySelectorAll('.changestatus');

  changestatusButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const modal = button.closest('.modal-top');

      if (!modal) {
        console.error("Modal not found");
        return;
      }

      // Traverse the DOM to find the closest parent form and then find the associated inputs
      const form = button.closest('form') || button.closest('div');
      const selectedOption = form.querySelector('.tclasses');
      const tclassValue = selectedOption.value;
      const tstatusValue = form.querySelector('.tstatus').value;
      const nmaeValue = form.querySelector('.nmae').value;
      const clickout = document.querySelector('.modalclickkkout')
      if (!nmaeValue || !tclassValue || !tstatusValue) {
        alert('Fields cannot be empty');
      } else {
        try {
          const response = await fetch('/change_statuss', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nmae: nmaeValue, tclass: tclassValue, tstatus: tstatusValue })
          });
          if (!response.ok) throw new Error('Failed to save data');
          const data = await response.json();
          if (data) {
            modal.classList.remove('show');
            modal.setAttribute('aria-modal', 'false');
            const modalContent = modal.querySelector('.modal-content');
            modalContent.classList.remove('in');
            Swal.fire({
              position: "center",
              icon: "success",
              title: `status of ${data.name} changed to ${data.status}`,
              showConfirmButton: false,
              timer: 2000
            });
          }
        } catch (err) {
          Swal.fire({
            position: "center",
            icon: "error",
            title: `${err}`,
            showConfirmButton: false,
            timer: 3000
          });
        }
      }
    });
  });
});
