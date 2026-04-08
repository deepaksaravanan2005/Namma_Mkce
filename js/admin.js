// Admin functionality
document.addEventListener('DOMContentLoaded', function() {
    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            if (username === '927623bec200' && password === 'senthil@2006') {
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Invalid credentials');
            }
        });
    }

    // Dashboard
    if (window.location.pathname.includes('admin-dashboard.html') || document.getElementById('upload-file-form') || document.getElementById('docs-table')) {
        loadFAQs();
        loadLogs();
        loadAnnouncements();
        loadChart();
        loadDocuments();

        // Upload file
        const uploadFileForm = document.getElementById('upload-file-form');
        if (uploadFileForm) {
            uploadFileForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const fileInput = document.getElementById('upload-file-input');
                const titleInput = document.getElementById('upload-title');
                const status = document.getElementById('upload-status');

                if (!fileInput.files.length) {
                    status.innerHTML = '<div class="alert alert-danger">Please select a file to upload.</div>';
                    return;
                }

                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                formData.append('title', titleInput.value.trim() || fileInput.files[0].name);

                status.innerHTML = '<div class="alert alert-info">Uploading file...</div>';
                try {
                    const response = await fetch('/api/documents', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (response.ok) {
                        status.innerHTML = '<div class="alert alert-success">File uploaded successfully.</div>';
                        uploadFileForm.reset();
                        loadDocuments();
                    } else {
                        status.innerHTML = `<div class="alert alert-danger">${result.error || 'Upload failed'}</div>`;
                    }
                } catch (error) {
                    status.innerHTML = `<div class="alert alert-danger">Upload failed. ${error.message}</div>`;
                }
            });
        }

        // Add FAQ
        const addFaqForm = document.getElementById('add-faq-form');
        if (addFaqForm) {
            addFaqForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const question = document.getElementById('faq-question').value;
                const answer = document.getElementById('faq-answer').value;
                const faqs = JSON.parse(localStorage.getItem('faqs') || '[]');
                faqs.push({ question, answer });
                localStorage.setItem('faqs', JSON.stringify(faqs));
                loadFAQs();
                bootstrap.Modal.getInstance(document.getElementById('addFaqModal')).hide();
                addFaqForm.reset();
            });
        }

        // Add Announcement
        const announcementForm = document.getElementById('announcement-form');
        if (announcementForm) {
            announcementForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const title = document.getElementById('announcement-title').value;
                const content = document.getElementById('announcement-content').value;
                const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
                announcements.push({ title, content, date: new Date().toLocaleDateString() });
                localStorage.setItem('announcements', JSON.stringify(announcements));
                loadAnnouncements();
                announcementForm.reset();
            });
        }
    }
});

function loadFAQs() {
    const faqsTable = document.getElementById('faqs-table').querySelector('tbody');
    faqsTable.innerHTML = '';
    const faqs = JSON.parse(localStorage.getItem('faqs') || '[{"question":"What is the timetable?","answer":"Check the portal."}]');
    faqs.forEach((faq, index) => {
        const row = `<tr>
            <td>${faq.question}</td>
            <td>${faq.answer}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editFAQ(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${index})">Delete</button>
            </td>
        </tr>`;
        faqsTable.innerHTML += row;
    });
}

function editFAQ(index) {
    // Simple edit, for demo
    alert('Edit functionality not fully implemented. Use delete and add new.');
}

function deleteFAQ(index) {
    const faqs = JSON.parse(localStorage.getItem('faqs') || '[]');
    faqs.splice(index, 1);
    localStorage.setItem('faqs', JSON.stringify(faqs));
    loadFAQs();
}

function loadLogs() {
    const logsTable = document.getElementById('logs-table').querySelector('tbody');
    logsTable.innerHTML = '';
    const logs = JSON.parse(localStorage.getItem('logs') || '[{"timestamp":"2023-01-01 10:00","user":"User1","message":"Hello","response":"Hi"}]');
    logs.forEach(log => {
        const row = `<tr>
            <td>${log.timestamp}</td>
            <td>${log.user}</td>
            <td>${log.message}</td>
            <td>${log.response}</td>
        </tr>`;
        logsTable.innerHTML += row;
    });
}

function loadAnnouncements() {
    const announcementsList = document.getElementById('announcements-list');
    announcementsList.innerHTML = '';
    const announcements = JSON.parse(localStorage.getItem('announcements') || '[{"title":"Welcome","content":"Welcome to campus","date":"2023-01-01"}]');
    announcements.forEach(ann => {
        const item = `<li class="list-group-item">
            <h6>${ann.title}</h6>
            <p>${ann.content}</p>
            <small class="text-muted">${ann.date}</small>
        </li>`;
        announcementsList.innerHTML += item;
    });
}

async function loadDocuments() {
    const documentsTable = document.getElementById('documents-table').querySelector('tbody');
    if (!documentsTable) return;
    documentsTable.innerHTML = '<tr><td colspan="3">Loading documents...</td></tr>';
    try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
            documentsTable.innerHTML = '<tr><td colspan="3">Unable to load documents.</td></tr>';
            return;
        }
        const documents = await response.json();
        if (!documents.length) {
            documentsTable.innerHTML = '<tr><td colspan="3">No uploaded documents yet.</td></tr>';
            return;
        }
        documentsTable.innerHTML = '';
        documents.forEach(doc => {
            const fileType = doc.title.match(/\.(pdf|docx|doc|txt|png|jpe?g|gif|bmp)$/i);
            const typeLabel = fileType ? fileType[1].toUpperCase() : 'File';
            documentsTable.innerHTML += `<tr>
                <td>${doc.title}</td>
                <td>${typeLabel}</td>
                <td>${new Date(doc.uploaded_at).toLocaleString()}</td>
            </tr>`;
        });
    } catch (error) {
        documentsTable.innerHTML = `<tr><td colspan="3">Error loading documents: ${error.message}</td></tr>`;
    }
}

function loadChart() {
    const ctx = document.getElementById('questions-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Timetable', 'Fees', 'Departments', 'Others'],
            datasets: [{
                label: 'Questions Asked',
                data: [12, 19, 3, 5],
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}