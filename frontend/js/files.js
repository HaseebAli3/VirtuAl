// Files Page JavaScript - Fixed Edit Functionality

document.addEventListener('DOMContentLoaded', function() {
    const filesGrid = document.getElementById('filesGrid');
    const searchInput = document.getElementById('searchInput');
    const newFileBtn = document.getElementById('newFileBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const alertContainer = document.getElementById('alertContainer');
    
    // Stats elements
    const totalFilesCount = document.getElementById('totalFilesCount');
    const textFilesCount = document.getElementById('textFilesCount');
    const lastModified = document.getElementById('lastModified');
    
    // View file modal
    const viewFileModal = document.getElementById('viewFileModal');
    const viewFileName = document.getElementById('viewFileName');
    const viewFileContent = document.getElementById('viewFileContent');
    const viewFileClose = document.getElementById('viewFileClose');
    const viewFileCloseBtn = document.getElementById('viewFileCloseBtn');
    const editFromViewBtn = document.getElementById('editFromViewBtn');
    
    // File form modal
    const fileFormModal = document.getElementById('fileFormModal');
    const fileFormTitle = document.getElementById('fileFormTitle');
    const formFileName = document.getElementById('formFileName');
    const formFileContent = document.getElementById('formFileContent');
    const fileFormClose = document.getElementById('fileFormClose');
    const fileFormCancelBtn = document.getElementById('fileFormCancelBtn');
    const fileFormSaveBtn = document.getElementById('fileFormSaveBtn');
    
    // Delete modal
    const deleteModal = document.getElementById('deleteModal');
    const deleteFileName = document.getElementById('deleteFileName');
    const deleteModalClose = document.getElementById('deleteModalClose');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    
    let allFiles = [];
    let currentFile = null;
    let isEditing = false;

    // ==================== API REQUEST ====================
    
    async function apiRequest(options) {
        try {
            const currentPath = window.location.pathname;
            let apiUrl;
            
            if (currentPath.includes('/frontend/')) {
                apiUrl = currentPath.replace(/\/frontend\/.*$/, '/backend/api/command_handler.php');
            } else if (currentPath.includes('/virtual-assistant/')) {
                apiUrl = '/virtual-assistant/backend/api/command_handler.php';
            } else {
                apiUrl = '../backend/api/command_handler.php';
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options)
            });
            
            const rawText = await response.text();
            
            if (rawText.startsWith('<!') || rawText.startsWith('<html') || rawText.startsWith('<br')) {
                return { 
                    success: false, 
                    message: 'PHP error or server not configured correctly.'
                };
            }
            
            try {
                const data = JSON.parse(rawText);
                return data;
            } catch (parseError) {
                return { 
                    success: false, 
                    message: 'Invalid response from server.'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: 'Cannot connect to PHP backend. Make sure XAMPP is running.'
            };
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const icons = {
            txt: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>`,
            json: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                     <polyline points="14 2 14 8 20 8"></polyline>
                     <path d="M10 12h4"></path>
                     <path d="M10 16h4"></path>
                   </svg>`,
            html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polyline points="16 18 22 12 16 6"></polyline>
                     <polyline points="8 6 2 12 8 18"></polyline>
                   </svg>`,
            css: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M12 11l4 4-4 4"></path>
                  </svg>`,
            js: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                   <path d="M12 8v8"></path>
                   <path d="M8 12h8"></path>
                 </svg>`
        };
        
        return icons[ext] || `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
        </svg>`;
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    }

    function showAlert(container, type, message) {
        const alertHtml = `
            <div class="alert alert-${type}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${type === 'success' 
                        ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                        : type === 'error'
                        ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
                        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                    }
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (container) {
            container.innerHTML = alertHtml;
            
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        container.innerHTML = '';
                    }, 300);
                }
            }, 5000);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== FILE OPERATIONS ====================

    // Load files
    async function loadFiles() {
        filesGrid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <p style="color: var(--color-gray-500);">Loading files...</p>
            </div>
        `;
        
        const result = await apiRequest({ action: 'list' });
        
        if (result.success) {
            allFiles = result.files || [];
            updateStats();
            displayFiles(allFiles);
        } else {
            filesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 60px 20px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" stroke-width="2" style="margin: 0 auto 16px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p style="color: var(--color-gray-500);">Failed to load files. Please try again.</p>
                </div>
            `;
        }
    }

    // Update statistics
    function updateStats() {
        totalFilesCount.textContent = allFiles.length;
        
        const txtFiles = allFiles.filter(f => f.filename.endsWith('.txt'));
        textFilesCount.textContent = txtFiles.length;
        
        if (allFiles.length > 0) {
            const sorted = [...allFiles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            lastModified.textContent = formatDate(sorted[0].created_at);
        } else {
            lastModified.textContent = '--';
        }
    }

    // Display files in grid
    function displayFiles(files) {
        if (files.length === 0) {
            filesGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 60px 20px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-400)" stroke-width="2" style="margin: 0 auto 16px;">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p style="color: var(--color-gray-600); font-weight: 500; margin-bottom: 8px;">No files found</p>
                    <p style="color: var(--color-gray-500);">Create your first file to get started</p>
                </div>
            `;
            return;
        }
        
        filesGrid.innerHTML = files.map(file => `
            <div class="file-card" data-id="${file.id}" data-filename="${file.filename}">
                <div class="file-icon">
                    ${getFileIcon(file.filename)}
                </div>
                <h3>${escapeHtml(file.filename)}</h3>
                <div class="file-meta">
                    ${formatFileSize(file.size)} • ${formatDate(file.created_at)}
                </div>
                <div class="file-actions">
                    <button class="file-action-btn view" onclick="viewFile('${escapeHtml(file.filename)}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="file-action-btn delete" onclick="deleteFile('${escapeHtml(file.filename)}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Search files
    function searchFiles(query) {
        const lowerQuery = query.toLowerCase();
        const filtered = allFiles.filter(f => 
            f.filename.toLowerCase().startsWith(lowerQuery) ||
            f.filename.toLowerCase().includes(lowerQuery)
        );
        displayFiles(filtered);
    }

    // View file
    window.viewFile = async function(filename) {
        const result = await apiRequest({
            action: 'read',
            filename: filename
        });
        
        if (result.success) {
            currentFile = filename;
            viewFileName.textContent = filename;
            viewFileContent.textContent = result.content || '(Empty file)';
            openModal('viewFileModal');
        } else {
            showAlert(alertContainer, 'error', result.message || 'Failed to read file');
        }
    };

    // Delete file
    window.deleteFile = function(filename) {
        currentFile = filename;
        deleteFileName.textContent = filename;
        openModal('deleteModal');
    };

    // Confirm delete
    async function confirmDelete() {
        if (!currentFile) return;
        
        setButtonLoading(deleteConfirmBtn, true);
        
        const result = await apiRequest({
            action: 'delete',
            filename: currentFile
        });
        
        setButtonLoading(deleteConfirmBtn, false);
        closeModal('deleteModal');
        
        if (result.success) {
            showAlert(alertContainer, 'success', `File "${currentFile}" deleted successfully`);
            loadFiles();
        } else {
            showAlert(alertContainer, 'error', result.message || 'Failed to delete file');
        }
        
        currentFile = null;
    }

    // Open create file modal
    function openCreateModal() {
        isEditing = false;
        currentFile = null;
        fileFormTitle.textContent = 'Create New File';
        formFileName.value = '';
        formFileName.readOnly = false;
        formFileContent.value = '';
        const editHelpText = document.getElementById('editHelpText');
        if (editHelpText) editHelpText.style.display = 'none';
        openModal('fileFormModal');
    }

    // Open edit file modal - FIXED: Properly loads file content into textarea
    async function openEditModal(filename) {
        const result = await apiRequest({
            action: 'read',
            filename: filename
        });
        
        if (result.success) {
            isEditing = true;
            currentFile = filename;
            fileFormTitle.textContent = 'Edit File';
            formFileName.value = filename;
            formFileName.readOnly = true;
            // FIXED: Properly set the content in the textarea
            formFileContent.value = result.content || '';
            // Show help text for editing
            const editHelpText = document.getElementById('editHelpText');
            if (editHelpText) editHelpText.style.display = 'block';
            closeModal('viewFileModal');
            openModal('fileFormModal');
            // Focus on the content textarea for immediate editing
            setTimeout(() => {
                formFileContent.focus();
            }, 100);
        } else {
            showAlert(alertContainer, 'error', result.message || 'Failed to load file for editing');
        }
    }

    // Save file
    async function saveFile() {
        const filename = formFileName.value.trim();
        const content = formFileContent.value;
        
        if (!filename) {
            alert('Please enter a file name');
            return;
        }
        
        setButtonLoading(fileFormSaveBtn, true);
        
        const result = await apiRequest({
            action: isEditing ? 'edit' : 'create',
            filename: filename,
            content: content
        });
        
        setButtonLoading(fileFormSaveBtn, false);
        closeModal('fileFormModal');
        
        if (result.success) {
            showAlert(alertContainer, 'success', `File "${filename}" ${isEditing ? 'updated' : 'created'} successfully`);
            loadFiles();
        } else {
            showAlert(alertContainer, 'error', result.message || `Failed to ${isEditing ? 'update' : 'create'} file`);
        }
        
        currentFile = null;
        isEditing = false;
    }

    // ==================== EVENT LISTENERS ====================

    searchInput?.addEventListener('input', function() {
        searchFiles(this.value);
    });

    newFileBtn?.addEventListener('click', openCreateModal);
    
    refreshBtn?.addEventListener('click', function() {
        setButtonLoading(this, true);
        loadFiles().then(() => {
            setButtonLoading(this, false);
        });
    });

    // View modal
    viewFileClose?.addEventListener('click', () => closeModal('viewFileModal'));
    viewFileCloseBtn?.addEventListener('click', () => closeModal('viewFileModal'));
    editFromViewBtn?.addEventListener('click', () => {
        if (currentFile) {
            openEditModal(currentFile);
        }
    });

    // File form modal
    fileFormClose?.addEventListener('click', () => closeModal('fileFormModal'));
    fileFormCancelBtn?.addEventListener('click', () => closeModal('fileFormModal'));
    fileFormSaveBtn?.addEventListener('click', saveFile);

    // Delete modal
    deleteModalClose?.addEventListener('click', () => closeModal('deleteModal'));
    deleteCancelBtn?.addEventListener('click', () => closeModal('deleteModal'));
    deleteConfirmBtn?.addEventListener('click', confirmDelete);

    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Initial load
    loadFiles();
});
