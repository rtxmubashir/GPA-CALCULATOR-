/**
 * Professional GPA Calculator
 * Features: Staggered animations, micro-interactions, and robust calculation logic.
 */

const gradeMap = {
    'A': 4.0, 'A-': 3.67, 'B+': 3.33, 'B': 3.0, 'B-': 2.67,
    'C+': 2.33, 'C': 2.0, 'C-': 1.67, 'D+': 1.33, 'D': 1.0, 'F': 0.0
};

const tbody = document.querySelector("#courseTable tbody");
let rowCount = 0;

/**
 * Generates grade options for select elements
 */
function getGradeOptions() {
    return Object.entries(gradeMap)
        .map(([grade, points]) => `<option value="${points}">${grade} (${points.toFixed(2)})</option>`)
        .join("");
}

/**
 * Adds a new course row with entrance animation
 */
function addRow(isInitial = false) {
    rowCount++;
    const row = document.createElement('tr');
    row.className = 'row-enter';
    if (isInitial) {
        row.style.animationDelay = `${rowCount * 0.05}s`;
    }

    row.innerHTML = `
        <td class="row-number">${rowCount}</td>
        <td><input type="number" class="cr" placeholder="Credits" min="1" max="10" step="0.5"></td>
        <td>
            <select class="gr">
                <option value="">Grade</option>
                ${getGradeOptions()}
            </select>
        </td>
        <td class="repeat-cell">
            <input type="checkbox" class="rp">
        </td>
        <td>
            <select class="old" disabled>
                <option value="">Prev</option>
                ${getGradeOptions()}
            </select>
        </td>
    `;
    
    tbody.appendChild(row);

    const repeatCheckbox = row.querySelector(".rp");
    const oldGradeSelect = row.querySelector(".old");
    
    repeatCheckbox.addEventListener('change', () => {
        oldGradeSelect.disabled = !repeatCheckbox.checked;
        row.classList.toggle("highlight", repeatCheckbox.checked);
        if (!repeatCheckbox.checked) oldGradeSelect.value = "";
    });

    // Remove error state on input
    row.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => row.classList.remove('error-row'));
    });
}

/**
 * Clears rows with a simple exit effect
 */
function clearRows() {
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
        setTimeout(() => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            row.style.transition = 'all 0.3s ease';
        }, i * 30);
    });

    setTimeout(() => {
        tbody.innerHTML = "";
        rowCount = 0;
        document.getElementById('output').classList.remove('show');
        for (let i = 0; i < 5; i++) addRow(true);
    }, rows.length * 30 + 200);
}

/**
 * Calculate and animate results
 */
function calculate() {
    const curGPA = parseFloat(document.getElementById("currentGPA").value) || 0;
    const curCr = parseFloat(document.getElementById("currentCredits").value) || 0;
    
    if (curGPA > 4.0 || curGPA < 0) {
        alert("Please enter a valid CGPA (0-4.0)");
        return;
    }
    
    let overallQP = curGPA * curCr;
    let overallCr = curCr;
    let semQP = 0, semCr = 0;
    let hasErrors = false;
    
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
        const crInput = row.querySelector(".cr");
        const grSelect = row.querySelector(".gr");
        const rpCheck = row.querySelector(".rp");
        const oldSelect = row.querySelector(".old");
        
        const cr = parseFloat(crInput.value);
        const gr = parseFloat(grSelect.value);
        
        if (isNaN(cr) && grSelect.value === "") return;
        
        if (isNaN(cr) || cr <= 0 || grSelect.value === "") {
            row.classList.add("error-row");
            hasErrors = true;
            return;
        }
        
        semQP += cr * gr;
        semCr += cr;
        
        if (rpCheck.checked) {
            const oldGr = parseFloat(oldSelect.value);
            if (oldSelect.value === "") {
                row.classList.add("error-row");
                hasErrors = true;
                return;
            }
            overallQP = overallQP - (cr * oldGr) + (cr * gr);
        } else {
            overallQP += cr * gr;
            overallCr += cr;
        }
    });
    
    if (hasErrors) return;
    if (semCr === 0) {
        alert("Please add at least one course.");
        return;
    }
    
    const sgpa = semQP / semCr;
    const cgpa = overallCr > 0 ? (overallQP / overallCr) : 0;
    
    // Animate numbers
    animateValue("sgpa", 0, sgpa, 1000);
    animateValue("cgpa", 0, cgpa, 1000);
    animateValue("totalCredits", 0, overallCr, 1000, true);
    
    const output = document.getElementById("output");
    output.classList.add("show");
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Smooth number animation
 */
function animateValue(id, start, end, duration, isInt = false) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = progress * (end - start) + start;
        obj.innerHTML = isInt ? Math.floor(val) : val.toFixed(2);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function resetAll() {
    if (confirm("Reset all data?")) {
        document.getElementById("currentGPA").value = "";
        document.getElementById("currentCredits").value = "";
        clearRows();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 5; i++) addRow(true);
});
