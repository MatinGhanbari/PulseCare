const form = document.querySelector('form');
form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        editPatient();
    }
});

form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission
    editPatient();
});

function editPatient() {
    const patient_id = document.getElementById('patient_id').value;
    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const files = document.getElementById('files').files;

    const formData = new FormData();
    formData.append('firstname', firstname);
    formData.append('lastname', lastname);
    formData.append('age', age);
    formData.append('gender', gender);
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    fetch(`/api/patients/${patient_id}/`, {
        method: 'PUT',
        headers: {
            'Authorization': `${localStorage.getItem('token')}`
        },
        body: formData,
    })
        .then(response => {
            if (response.ok) {
                window.open('/patients/', '_self');
            } else {
                alert(response.json());
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
}