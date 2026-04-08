// Admin functionality

document.addEventListener('DOMContentLoaded', function() {
    loadFAQs();
    loadDocs();
    loadLogs();

    const addFaqForm = document.getElementById('add-faq-form');
    if (addFaqForm) {
        addFaqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = document.getElementById('faq-question').value.trim();
            const answer = document.getElementById('faq-answer').value.trim();
            if (!question || !answer) return;

            try {
                const response = await fetch('/api/faqs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, answer }) });
                if (response.ok) {
                    loadFAQs();
                    bootstrap.Modal.getInstance(document.getElementById('addFaqModal')).hide();
                    addFaqForm.reset();
                }
            } catch (error) {
                alert('Error adding FAQ');
            }
        });
    }

    const editFaqForm = document.getElementById('edit-faq-form');
    if (editFaqForm) {
        editFaqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-faq-id').value;
            const question = document.getElementById('edit-faq-question').value.trim();
            const answer = document.getElementById('edit-faq-answer').value.trim();
            if (!question || !answer) return;

            try {
                const response = await fetch(`/api/faqs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, answer }) });
                if (response.ok) {
                    loadFAQs();
                    bootstrap.Modal.getInstance(document.getElementById('editFaqModal')).hide();
                }
            } catch (error) {
                alert('Error updating FAQ');
            }
        });
    }

    const uploadDocumentForm = document.getElementById('upload-file-form');
    if (uploadDocumentForm) {
        uploadDocumentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('upload-title').value.trim();
            const fileInput = document.getElementById('upload-file-input');

            const formData = new FormData();
            formData.append('title', title);
            if (fileInput.files.length) {
                formData.append('file', fileInput.files[0]);
            }

            try {
                const response = await fetch('/api/documents', { method: 'POST', body: formData });
                if (response.ok) {
                    loadDocs();
                    uploadDocumentForm.reset();
                } else {
                    const result = await response.json();
                    alert(result.error || 'Document upload failed');
                }
            } catch (error) {
                alert('Error adding document');
            }
        });
    }

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = document.getElementById('search-logs').value.toLowerCase();
            const rows = document.querySelectorAll('#logs-table tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
});

async function loadFAQs() {
    try {
        const response = await fetch('/api/faqs');
        const faqs = await response.json();
        const tbody = document.querySelector('#faqs-table tbody');
        tbody.innerHTML = '';
        faqs.forEach(faq => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${faq.question}</td>
                <td>${faq.answer}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editFAQ(${faq.id}, ${JSON.stringify(faq.question)}, ${JSON.stringify(faq.answer)})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${faq.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading FAQs', error);
    }
}

async function loadDocs() {
    try {
        const response = await fetch('/api/documents');
        const docs = await response.json();
        const tbody = document.querySelector('#documents-table tbody');
        tbody.innerHTML = '';
        docs.forEach(doc => {
            const snippet = doc.content ? doc.content.slice(0, 120) + (doc.content.length > 120 ? '...' : '') : '';
            const fileLink = doc.file_url ? `<div><a href="${doc.file_url}" target="_blank">Open file</a></div>` : '';
            const imagePreview = doc.file_url && doc.filename && doc.filename.match(/\.(jpe?g|png|gif|bmp)$/i)
                ? `<div class="mt-2"><img src="${doc.file_url}" alt="${doc.title}" style="max-width:150px; max-height:120px; object-fit:contain; border:1px solid #ddd; padding:4px;"></div>`
                : '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.title}</td>
                <td>${snippet}${fileLink}${imagePreview}</td>
                <td>${new Date(doc.uploaded_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editDocument(${doc.id}, ${JSON.stringify(doc.title)}, ${JSON.stringify(doc.content)})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading documents', error);
    }
}

async function loadLogs() {
    try {
        const response = await fetch('/api/admin/chat_logs');
        const logs = await response.json();
        const tbody = document.querySelector('#logs-table tbody');
        tbody.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.user_message}</td>
                <td>${log.bot_response}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading logs', error);
    }
}

function editFAQ(id, question, answer) {
    document.getElementById('edit-faq-id').value = id;
    document.getElementById('edit-faq-question').value = question;
    document.getElementById('edit-faq-answer').value = answer;
    new bootstrap.Modal(document.getElementById('editFaqModal')).show();
}

async function deleteFAQ(id) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
        const response = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
        if (response.ok) loadFAQs();
    } catch (error) {
        alert('Error deleting FAQ');
    }
}

function editDocument(id, title, content) {
    const editTitle = prompt('Edit document title:', title);
    const editContent = prompt('Edit document content:', content);
    if (!editTitle || !editContent) return;
    fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent })
    }).then(r => {
        if (r.ok) loadDocs();
    }).catch(() => alert('Error editing document'));
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
        const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        if (response.ok) loadDocs();
    } catch (error) {
        alert('Error deleting document');
    }
}
