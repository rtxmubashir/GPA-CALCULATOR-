/**
 * FAST-NU GPA Calculator
 * Professional, accessible, and cross-platform compatible
 * 
 * Features:
 * - Staggered animations with reduced motion support
 * - Toast notifications for user feedback
 * - Keyboard navigation support
 * - Auto-save with localStorage
 * - Input validation
 * - Mobile-optimized interactions
 */

// Grade mapping with descriptive labels
const GRADE_MAP = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.67,
    'B+': 3.33,
    'B': 3.0,
    'B-': 2.67,
    'C+': 2.33,
    'C': 2.0,
    'C-': 1.67,
    'D+': 1.33,
    'D': 1.0,
    'F': 0.0
};

// State management
const state = {
    rowCount: 0,
    isAnimating: false,
    prefersReducedMotion: false
};

// DOM Elements
const elements = {
    tbody: null,
    output: null,
    loadingOverlay: null,
    toastContainer: null,
    currentGPA: null,
    currentCredits: null,
    calculateBtn: null
};

/**
 * Initialize the application
 */
function init() {
    // Cache DOM elements
    elements.tbody = document.querySelector("#courseTable tbody");
    elements.output = document.getElementById("output");
    elements.loadingOverlay = document.getElementById("loadingOverlay");
    elements.toastContainer = document.getElementById("toastContainer");
    elements.currentGPA = document.getElementById("currentGPA");
    elements.currentCredits = document.getElementById("currentCredits");
    elements.calculateBtn = document.getElementById("calculateBtn");
    
    // Check for reduced motion preference
    state.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        state.prefersReducedMotion = e.matches;
    });
    
    // Set current year in footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Load saved data
    loadSavedData();
    
    // Initialize rows
    if (state.rowCount === 0) {
        for (let i = 0; i < 6; i++) {
            addRow(true);
        }
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Hide loading overlay
    setTimeout(() => {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
        }
    }, 500);
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Auto-save on input change
    document.addEventListener('input', debounce(saveData, 500));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Calculate on Enter in last input
    elements.currentCredits?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculate();
        }
    });
    
    // Prevent form submission
    document.addEventListener('submit', (e) => e.preventDefault());
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculate();
    }
    
    // Ctrl/Cmd + Shift + N to add row
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        addRow();
    }
}

/**
 * Generate grade options HTML
 */
function getGradeOptions() {
    return Object.entries(GRADE_MAP)
        .map(([grade, points]) => `<option value="${points}" data-grade="${grade}">${grade}</option>`)
        .join("");
}

/**
 * Add a new course row
 * @param {boolean} isInitial - Whether this is an initial page load row
 */
function addRow(isInitial = false) {
    if (state.isAnimating) return;
    
    state.rowCount++;
    const row = document.createElement('tr');
    row.className = 'row-enter';
    row.dataset.rowId = state.rowCount;
    
    if (isInitial && !state.prefersReducedMotion) {
        row.style.animationDelay = `${state.rowCount * 0.05}s`;
    }

    row.innerHTML = `
        <td class="row-number">${state.rowCount}</td>
        <td>
            <input 
                type="number" 
                class="cr" 
                placeholder="1-4" 
                min="1" 
                max="4" 
                step="1"
                inputmode="numeric"
                aria-label="Course credits"
                autocomplete="off"
            >
        </td>
        <td>
            <select class="gr" aria-label="Course grade">
                <option value="">Grade</option>
                ${getGradeOptions()}
            </select>
        </td>
        <td class="repeat-cell">
            <input 
                type="checkbox" 
                class="rp" 
                aria-label="Is this a repeated course?"
                title="Check if repeating this course"
            >
        </td>
        <td>
            <select class="old" disabled aria-label="Previous grade if repeated">
                <option value="">Prev</option>
                ${getGradeOptions()}
            </select>
        </td>
        <td>
            <button 
                type="button" 
                class="btn-delete" 
                onclick="deleteRow(this)" 
                aria-label="Delete this row"
                title="Delete row"
            >
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </td>
    `;

    elements.tbody.appendChild(row);
    
    // Setup row event listeners
    setupRowListeners(row);
    
    // Focus on credits input for new rows (not initial)
    if (!isInitial) {
        const creditsInput = row.querySelector('.cr');
        setTimeout(() => creditsInput?.focus(), 100);
        showToast('Row added', 'success');
    }
}

/**
 * Setup event listeners for a row
 */
function setupRowListeners(row) {
    const repeatCheckbox = row.querySelector(".rp");
    const oldGradeSelect = row.querySelector(".old");
    const creditsInput = row.querySelector(".cr");
    const gradeSelect = row.querySelector(".gr");

    // Repeat checkbox handler
    repeatCheckbox?.addEventListener('change', () => {
        oldGradeSelect.disabled = !repeatCheckbox.checked;
        row.classList.toggle("highlight", repeatCheckbox.checked);
        
        if (!repeatCheckbox.checked) {
            oldGradeSelect.value = "";
        } else {
            oldGradeSelect.focus();
        }
    });

    // Remove error state on input
    [creditsInput, gradeSelect, oldGradeSelect].forEach(input => {
        input?.addEventListener('input', () => {
            row.classList.remove('error-row');
        });
        input?.addEventListener('change', () => {
            row.classList.remove('error-row');
        });
    });
    
    // Navigate to next row on Tab from last input
    oldGradeSelect?.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            const nextRow = row.nextElementSibling;
            if (!nextRow) {
                // Add new row if this is the last one
                e.preventDefault();
                addRow();
            }
        }
    });
    
    // Validate credits input
    creditsInput?.addEventListener('blur', () => {
        const value = parseInt(creditsInput.value);
        if (creditsInput.value && (value < 1 || value > 4)) {
            creditsInput.value = Math.max(1, Math.min(4, value));
            showToast('Credits must be between 1 and 4', 'warning');
        }
    });
}

/**
 * Delete a specific row
 */
function deleteRow(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Don't delete if it's the only row
    if (elements.tbody.querySelectorAll('tr').length <= 1) {
        showToast('Cannot delete the last row', 'warning');
        return;
    }
    
    if (state.prefersReducedMotion) {
        row.remove();
        updateRowNumbers();
    } else {
        row.classList.add('row-exit');
        row.addEventListener('animationend', () => {
            row.remove();
            updateRowNumbers();
        }, { once: true });
    }
    
    showToast('Row deleted', 'success');
}

/**
 * Update row numbers after deletion
 */
function updateRowNumbers() {
    const rows = elements.tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const numberCell = row.querySelector('.row-number');
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
    });
    state.rowCount = rows.length;
}

/**
 * Clear all rows with animation
 */
function clearRows() {
    if (state.isAnimating) return;
    
    const rows = elements.tbody.querySelectorAll('tr');
    if (rows.length === 0) return;
    
    state.isAnimating = true;
    
    if (state.prefersReducedMotion) {
        elements.tbody.innerHTML = "";
        state.rowCount = 0;
        elements.output.classList.remove('show');
        for (let i = 0; i < 6; i++) addRow(true);
        state.isAnimating = false;
        showToast('All rows cleared', 'success');
        return;
    }
    
    rows.forEach((row, i) => {
        setTimeout(() => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            row.style.transition = 'all 0.3s ease';
        }, i * 30);
    });

    setTimeout(() => {
        elements.tbody.innerHTML = "";
        state.rowCount = 0;
        elements.output.classList.remove('show');
        for (let i = 0; i < 6; i++) addRow(true);
        state.isAnimating = false;
        showToast('All rows cleared', 'success');
    }, rows.length * 30 + 200);
}

/**
 * Calculate GPA and display results
 */
function calculate() {
    // Validate current GPA
    const currentGPA = parseFloat(elements.currentGPA.value) || 0;
    const currentCredits = parseFloat(elements.currentCredits.value) || 0;

    if (currentGPA > 4.0 || currentGPA < 0) {
        showToast('Please enter a valid CGPA (0-4)', 'error');
        elements.currentGPA.focus();
        return;
    }

    if (currentCredits < 0) {
        showToast('Credits cannot be negative', 'error');
        elements.currentCredits.focus();
        return;
    }

    let overallQualityPoints = currentGPA * currentCredits;
    let overallCredits = currentCredits;
    let semesterQualityPoints = 0;
    let semesterCredits = 0;
    let hasErrors = false;
    let hasValidCourses = false;

    const rows = elements.tbody.querySelectorAll("tr");
    
    rows.forEach((row) => {
        const creditsInput = row.querySelector(".cr");
        const gradeSelect = row.querySelector(".gr");
        const repeatCheckbox = row.querySelector(".rp");
        const oldGradeSelect = row.querySelector(".old");

        const credits = parseFloat(creditsInput.value);
        const grade = parseFloat(gradeSelect.value);

        // Skip empty rows
        if (!creditsInput.value && !gradeSelect.value) return;

        // Check for incomplete rows
        if (!creditsInput.value || !gradeSelect.value) {
            row.classList.add("error-row");
            hasErrors = true;
            return;
        }

        // Validate credits
        if (isNaN(credits) || credits <= 0 || credits > 4) {
            row.classList.add("error-row");
            hasErrors = true;
            return;
        }

        hasValidCourses = true;
        semesterQualityPoints += credits * grade;
        semesterCredits += credits;

        if (repeatCheckbox.checked) {
            const oldGrade = parseFloat(oldGradeSelect.value);
            
            if (!oldGradeSelect.value) {
                row.classList.add("error-row");
                hasErrors = true;
                return;
            }
            
            // For repeated courses: replace old grade with new grade
            overallQualityPoints = overallQualityPoints - (credits * oldGrade) + (credits * grade);
        } else {
            overallQualityPoints += credits * grade;
            overallCredits += credits;
        }
    });

    if (hasErrors) {
        showToast('Please fix the highlighted errors', 'error');
        return;
    }
    
    if (!hasValidCourses) {
        showToast('Please add at least one course', 'warning');
        return;
    }

    const semesterGPA = semesterQualityPoints / semesterCredits;
    const cumulativeGPA = overallCredits > 0 ? (overallQualityPoints / overallCredits) : 0;

    // Animate the result values
    animateValue("sgpa", 0, semesterGPA, 600);
    animateValue("cgpa", 0, cumulativeGPA, 600);
    animateValue("totalCredits", 0, overallCredits, 600, true);

    // Update GPA scale indicator
    updateScaleIndicator(cumulativeGPA);

    // Show results card
    elements.output.classList.add("show");
    
    // Scroll to results smoothly
    setTimeout(() => {
        elements.output.scrollIntoView({ 
            behavior: state.prefersReducedMotion ? 'auto' : 'smooth', 
            block: 'nearest' 
        });
    }, 100);

    showToast('Calculation complete!', 'success');
    saveData();
}

/**
 * Animate a number value with easing
 */
function animateValue(id, start, end, duration, isInteger = false) {
    if (state.prefersReducedMotion) {
        document.getElementById(id).textContent = isInteger ? Math.round(end) : end.toFixed(2);
        return;
    }

    const element = document.getElementById(id);
    if (!element) return;

    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + (end - start) * easeOut;
        
        element.textContent = isInteger ? Math.round(currentValue) : currentValue.toFixed(2);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

/**
 * Update the GPA scale indicator position
 */
function updateScaleIndicator(gpa) {
    const indicator = document.getElementById('scaleIndicator');
    if (!indicator) return;
    
    // Calculate position (0-100%)
    const position = (gpa / 4) * 100;
    indicator.style.left = `${Math.min(100, Math.max(0, position))}%`;
    indicator.classList.add('visible');
}

/**
 * Reset all data
 */
function resetAll() {
    const confirmed = confirm("Are you sure you want to reset all data? This cannot be undone.");
    
    if (confirmed) {
        elements.currentGPA.value = "";
        elements.currentCredits.value = "";
        clearRows();
        localStorage.removeItem('gpaCalculatorData');
        showToast('All data has been reset', 'success');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon" aria-hidden="true"></i>
        <span class="toast-message">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Remove toast after delay
    setTimeout(() => {
        if (state.prefersReducedMotion) {
            toast.remove();
        } else {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }
    }, 3000);
}

/**
 * Save data to localStorage
 */
function saveData() {
    try {
        const data = {
            currentGPA: elements.currentGPA?.value || '',
            currentCredits: elements.currentCredits?.value || '',
            courses: []
        };
        
        const rows = elements.tbody?.querySelectorAll('tr') || [];
        rows.forEach(row => {
            data.courses.push({
                credits: row.querySelector('.cr')?.value || '',
                grade: row.querySelector('.gr')?.value || '',
                repeat: row.querySelector('.rp')?.checked || false,
                oldGrade: row.querySelector('.old')?.value || ''
            });
        });
        
        localStorage.setItem('gpaCalculatorData', JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save data to localStorage:', e);
    }
}

/**
 * Load saved data from localStorage
 */
function loadSavedData() {
    try {
        const saved = localStorage.getItem('gpaCalculatorData');
        if (!saved) return;
        
        const data = JSON.parse(saved);
        
        if (elements.currentGPA && data.currentGPA) {
            elements.currentGPA.value = data.currentGPA;
        }
        
        if (elements.currentCredits && data.currentCredits) {
            elements.currentCredits.value = data.currentCredits;
        }
        
        if (data.courses && data.courses.length > 0) {
            data.courses.forEach((course, index) => {
                addRow(true);
                const row = elements.tbody.children[index];
                if (row) {
                    const cr = row.querySelector('.cr');
                    const gr = row.querySelector('.gr');
                    const rp = row.querySelector('.rp');
                    const old = row.querySelector('.old');
                    
                    if (cr) cr.value = course.credits;
                    if (gr) gr.value = course.grade;
                    if (rp) {
                        rp.checked = course.repeat;
                        if (course.repeat && old) {
                            old.disabled = false;
                            old.value = course.oldGrade;
                            row.classList.add('highlight');
                        }
                    }
                }
            });
        }
    } catch (e) {
        console.warn('Could not load saved data:', e);
    }
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for global access
window.addRow = addRow;
window.deleteRow = deleteRow;
window.clearRows = clearRows;
window.calculate = calculate;
window.resetAll = resetAll;
