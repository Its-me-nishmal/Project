function deleteClass(name) {
    const confirmDelete = confirm(`Are you sure you want to delete the class "${name}"?`);
    if (confirmDelete) {
        fetch(`/admin/classes/${name}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    location.reload();
                } else {
                    console.error('Failed to delete the class.');
                }
            })
            .catch(error => {
                console.error('Error deleting class:', error);
            });
    }
}

function addClassPrompt() {
    const classNames = prompt('Enter class names (comma-separated):');
    if (classNames) {
        const classArray = classNames.split(',').map(name => name.trim());
        classArray.forEach(className => {
            fetch('/admin/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: className })
            })
                .then(response => {
                    if (response.ok) {
                        location.reload();
                    } else {
                        console.error('Failed to add the class.');
                    }
                })
                .catch(error => {
                    console.error('Error adding class:', error);
                });
        });
    }
}


document.addEventListener("DOMContentLoaded", function() {
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
        const playlist = form.querySelector('.playlist').value;
        const idd = form.querySelector(".idd").value
        if (!playlist || !idd) {
          alert('Fields cannot be empty');
        } else if (!isValidYouTubeUrl(playlist)) {
            alert('Please enter a valid YouTube playlist URL');
          }else {
            try {
                const playlistId = (new URL(playlist).searchParams.get('list')) || playlist;
                const response = await fetch('/admin/courses', {
                  method: "POST",
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ playlist: playlistId, id: idd })
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

  function isValidYouTubeUrl(url) {
    // Regular expression to match YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(playlist\?list=|embed\/|v\/|watch\?v=)|youtu\.be\/)/;
    return youtubeRegex.test(url);
  }