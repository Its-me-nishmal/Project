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
      const playlistInput = form.querySelector('.playlist');
      const idd = form.querySelector(".idd").value;

      if (!idd) {
        alert('ID cannot be empty');
        return;
      }

      const playlists = extractPlaylists(form);

      if (playlists.length === 0) {
        alert('Playlist(s) cannot be empty');
        return;
      } else if (!areValidYouTubeUrls(playlists)) {
        alert('Please enter valid YouTube playlist URL(s)');
        return;
      }

      try {
        const playlistIds = playlists.map(playlist => (new URL(playlist).searchParams.get('list')) || playlist);

        const response = await fetch('/admin/courses', {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlist: playlistIds, id: idd })
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
    });
  });

  // Helper function to extract playlists from the form
  function extractPlaylists(form) {
    const playlistInputs = form.querySelectorAll('.playlist');
    return Array.from(playlistInputs).map(input => input.value);
  }

  // Helper function to check if all URLs are valid YouTube URLs
  function areValidYouTubeUrls(urls) {
    return urls.every(isValidYouTubeUrl);
  }

  // Helper function to check if a URL is a valid YouTube URL
 function isValidYouTubeUrl(url) {
            try {
                const parsedUrl = new URL(url);
                return parsedUrl.hostname === "youtube.com" && parsedUrl.searchParams.has("list");
            } catch (error) {
                return false;
            }
        }
});
