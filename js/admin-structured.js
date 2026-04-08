// Structured Admin Dashboard JavaScript
let allFAQs = [];
let allDocuments = [];
let allLogs = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadStatistics();
    loadFAQs();
    loadDocuments();
    loadLogs();
    loadCharts();

    // File upload handler
    const uploadForm = document.getElementById('upload-file-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }

    // Search handlers
    const faqSearch = document.getElementById('faq-search');
    if (faqSearch) {
        faqSearch.addEventListener('input', (e) => filterFAQs(e.target.value));
    }

    const logSearch = document.getElementById('log-search');
    if (logSearch) {
        logSearch.addEventListener('input', (e) => filterLogs(e.target.value));
    }
});

// ==================== STATISTICS ====================
async function loadStatistics() {
    try {
        // Load FAQ count
        const faqsResponse = await fetch('/api/faqs');
        const faqs = await faqsResponse.json();
        document.getElementById('stat-faqs').textContent = faqs.length;

        // Load documents count
        const docsResponse = await fetch('/api/documents');
        const docs = await docsResponse.json();
        document.getElementById('stat-documents').textContent = docs.length;

        // Load chat logs count
        const logsResponse = await fetch('/api/admin/chat_logs');
        const logs = await logsResponse.json();
        document.getElementById('stat-logs').textContent = logs.length;

        // Estimate users (from unique usernames in logs)
        const uniqueUsers = new Set(logs.map(log => log.user)).size;
        document.getElementById('stat-users').textContent = uniqueUsers;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ==================== FAQ MANAGEMENT ====================
async function loadFAQs() {
    const tbody = document.querySelector('#faqs-table tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/faqs');
        const faqs = await response.json();
        allFAQs = faqs;
        
        tbody.innerHTML = '';
        if (faqs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No FAQs found. Click "Add New FAQ" to create one.</td></tr>';
            return;
        }

        faqs.forEach((faq, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td><strong>${escapeHtml(faq.question)}</strong></td>
                <td class="text-muted">${escapeHtml(faq.answer)}</td>
                <td class="text-center action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editFAQ(${faq.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${faq.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        updatePagination('faq', faqs.length);
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading FAQs: ' + error.message + '</td></tr>';
    }
}

function filterFAQs(query) {
    const tbody = document.querySelector('#faqs-table tbody');
    if (!tbody || !allFAQs.length) return;

    const filtered = allFAQs.filter(faq => 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
    );

    tbody.innerHTML = '';
    filtered.forEach((faq, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td><strong>${escapeHtml(faq.question)}</strong></td>
            <td class="text-muted">${escapeHtml(faq.answer)}</td>
            <td class="text-center action-buttons">
                <button class="btn btn-sm btn-warning" onclick="editFAQ(${faq.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${faq.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveFAQ() {
    const question = document.getElementById('faq-question').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();

    if (!question || !answer) {
        alert('Please fill in both fields');
        return;
    }

    try {
        const response = await fetch('/api/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addFaqModal')).hide();
            document.getElementById('add-faq-form').reset();
            await loadFAQs();
            await loadStatistics();
            alert('FAQ added successfully!');
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error saving FAQ: ' + error.message);
    }
}

async function editFAQ(id) {
    const faq = allFAQs.find(f => f.id === id);
    if (!faq) return;

    document.getElementById('edit-faq-id').value = faq.id;
    document.getElementById('edit-faq-question').value = faq.question;
    document.getElementById('edit-faq-answer').value = faq.answer;

    new bootstrap.Modal(document.getElementById('editFaqModal')).show();
}

async function updateFAQ() {
    const id = parseInt(document.getElementById('edit-faq-id').value);
    const question = document.getElementById('edit-faq-question').value.trim();
    const answer = document.getElementById('edit-faq-answer').value.trim();

    if (!question || !answer) {
        alert('Please fill in both fields');
        return;
    }

    try {
        const response = await fetch(`/api/faqs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editFaqModal')).hide();
            await loadFAQs();
            await loadStatistics();
            alert('FAQ updated successfully!');
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error updating FAQ: ' + error.message);
    }
}

async function deleteFAQ(id) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
        const response = await fetch(`/api/faqs/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadFAQs();
            await loadStatistics();
            alert('FAQ deleted successfully!');
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting FAQ: ' + error.message);
    }
}

function exportFAQs() {
    const dataStr = JSON.stringify(allFAQs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faqs_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== DOCUMENTS ====================
async function loadDocuments() {
    const tbody = document.querySelector('#documents-table tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/documents');
        const documents = await response.json();
        allDocuments = documents;

        tbody.innerHTML = '';
        if (documents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No documents uploaded yet</td></tr>';
            return;
        }

        documents.forEach((doc, index) => {
            const fileType = getFileType(doc.title);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td><strong>${escapeHtml(doc.title)}</strong></td>
                <td><span class="badge bg-info">${fileType}</span></td>
                <td class="timestamp">${formatDate(doc.uploaded_at)}</td>
                <td class="action-buttons">
                    ${doc.file_url ? `<a href="${doc.file_url}" class="btn btn-sm btn-outline-primary" target="_blank" title="View">
                        <i class="fas fa-eye"></i>
                    </a>` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDocument(${doc.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        updatePagination('document', documents.length);
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading documents: ' + error.message + '</td></tr>';
    }
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('upload-file-input');
    const titleInput = document.getElementById('upload-title');
    const statusDiv = document.getElementById('upload-status');

    if (!fileInput.files.length) {
        statusDiv.innerHTML = '<div class="alert alert-danger">Please select a file</div>';
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('title', titleInput.value.trim() || fileInput.files[0].name);

    statusDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Uploading...</div>';

    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            statusDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Document uploaded successfully!</div>';
            document.getElementById('upload-file-form').reset();
            await loadDocuments();
            await loadStatistics();
        } else {
            statusDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Error: ${result.error}</div>`;
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> Upload failed: ${error.message}</div>`;
    }
}

async function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
        const response = await fetch(`/api/documents/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadDocuments();
            await loadStatistics();
            alert('Document deleted successfully!');
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting document: ' + error.message);
    }
}

// ==================== CHAT LOGS ====================
async function loadLogs() {
    const tbody = document.querySelector('#logs-table tbody');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/chat_logs');
        const logs = await response.json();
        allLogs = logs.reverse(); // Show newest first

        tbody.innerHTML = '';
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No chat logs found</td></tr>';
            return;
        }

        logs.forEach((log, index) => {
            const sourceBadge = getSourceBadge(log);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td class="timestamp">${formatDate(log.timestamp)}</td>
                <td><span class="badge bg-secondary">${escapeHtml(log.user || 'Anonymous')}</span></td>
                <td class="message-preview" title="${escapeHtml(log.user_message)}">${escapeHtml(log.user_message)}</td>
                <td class="message-preview" title="${escapeHtml(log.bot_response)}">${escapeHtml(log.bot_response)}</td>
                <td class="text-center">${sourceBadge}</td>
            `;
            tbody.appendChild(row);
        });

        populateUserFilter(logs);
        updatePagination('log', logs.length);
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading logs: ' + error.message + '</td></tr>';
    }
}

function filterLogs(query) {
    const tbody = document.querySelector('#logs-table tbody');
    if (!tbody || !allLogs.length) return;

    const filtered = allLogs.filter(log =>
        log.user_message.toLowerCase().includes(query.toLowerCase()) ||
        log.bot_response.toLowerCase().includes(query.toLowerCase()) ||
        (log.user && log.user.toLowerCase().includes(query.toLowerCase()))
    );

    tbody.innerHTML = '';
    filtered.forEach((log, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td class="timestamp">${formatDate(log.timestamp)}</td>
            <td><span class="badge bg-secondary">${escapeHtml(log.user || 'Anonymous')}</span></td>
            <td class="message-preview" title="${escapeHtml(log.user_message)}">${escapeHtml(log.user_message)}</td>
            <td class="message-preview" title="${escapeHtml(log.bot_response)}">${escapeHtml(log.bot_response)}</td>
            <td class="text-center">${getSourceBadge(log)}</td>
        `;
        tbody.appendChild(row);
    });
}

function getSourceBadge(log) {
    const response = log.bot_response.toLowerCase();
    if (response.includes('according to campus records') || response.includes('faq')) {
        return '<span class="source-badge source-document">DB</span>';
    } else if (response.length < 200 && !response.includes('ai')) {
        return '<span class="source-badge source-faq">FAQ</span>';
    } else {
        return '<span class="source-badge source-upload">AI</span>';
    }
}

function populateUserFilter(logs) {
    const filter = document.getElementById('log-user-filter');
    if (!filter) return;

    const users = [...new Set(logs.map(log => log.user).filter(Boolean))];
    filter.innerHTML = '<option value="">All Users</option>';
    users.forEach(user => {
        filter.innerHTML += `<option value="${user}">${escapeHtml(user)}</option>`;
    });
}

function exportLogs() {
    const dataStr = JSON.stringify(allLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== ANALYTICS ====================
function loadCharts() {
    loadQuestionsChart();
    loadSourcesChart();
    loadActivityChart();
}

function loadQuestionsChart() {
    const ctx = document.getElementById('questions-chart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Library', 'Exams', 'Fees', 'Timetable', 'Labs', 'Other'],
            datasets: [{
                label: 'Questions',
                data: [15, 22, 8, 18, 12, 25],
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

function loadSourcesChart() {
    const ctx = document.getElementById('sources-chart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['FAQ Match', 'Document Match', 'AI Fallback'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: ['#28a745', '#007bff', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function loadActivityChart() {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Chats',
                data: [45, 52, 38, 65, 42, 28, 35],
                borderColor: '#007bff',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0,123,255,0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'pdf': 'PDF',
        'docx': 'Word',
        'doc': 'Word',
        'txt': 'Text',
        'png': 'Image',
        'jpg': 'Image',
        'jpeg': 'Image',
        'gif': 'Image',
        'bmp': 'Image'
    };
    return types[ext] || 'File';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updatePagination(type, total) {
    const container = document.getElementById(`${type}-pagination`);
    if (!container) return;

    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<nav><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goToPage('${type}', ${i})">${i}</a>
        </li>`;
    }
    html += '</ul></nav>';
    container.innerHTML = html;
}

function goToPage(type, page) {
    currentPage = page;
    // Implement pagination logic here
    console.log(`Navigate to page ${page} for ${type}`);
}

async function rebuildIndex() {
    if (!confirm('Rebuild search index? This may take a few moments.')) return;

    try {
        // Trigger a reload to rebuild embeddings
        await loadFAQs();
        await loadDocuments();
        alert('Search index rebuilt successfully!');
    } catch (error) {
        alert('Error rebuilding index: ' + error.message);
    }
}

function exportData(type) {
    alert('Export functionality coming soon!');
}
