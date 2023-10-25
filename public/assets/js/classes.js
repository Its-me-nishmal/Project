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