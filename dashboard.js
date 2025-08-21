const sectionSelect = document.getElementById("sectionSelect");
const studentSelect = document.getElementById("studentSelect");
const studentSearch = document.getElementById("studentSearch");
const gradesContainer = document.getElementById("gradesContainer");
const gradesTable = document.getElementById("gradesTable");
const newGradeInput = document.getElementById("newGrade");
const addGradeBtn = document.getElementById("addGradeBtn");
const averageContainer = document.getElementById("averageContainer");
const downloadJsonBtn = document.getElementById("downloadJson");

let studentsData = {};
let selectedSection = "";
let selectedStudent = null;

let gradesChart = null;
let passFailChart = null;
let classChart = null;

// Load students.json
fetch("students.json")
  .then(res => res.json())
  .then(data => {
    studentsData = data;
    Object.keys(data).forEach(section => {
      const option = document.createElement("option");
      option.value = section;
      option.textContent = section;
      sectionSelect.appendChild(option);
    });
  });

// Handle section selection
sectionSelect.addEventListener("change", () => {
  selectedSection = sectionSelect.value;
  studentSelect.innerHTML = '<option value="">-- Choose a Student --</option>';
  studentSelect.disabled = !selectedSection;
  studentSearch.disabled = !selectedSection;
  studentSearch.value = "";
  gradesContainer.style.display = "none";

  if (selectedSection) {
    studentsData[selectedSection].forEach(student => {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = student.name;
      studentSelect.appendChild(option);
    });
    renderClassChart();
  }
});

// Search students
studentSearch.addEventListener("input", () => {
  const searchTerm = studentSearch.value.toLowerCase();
  studentSelect.innerHTML = '<option value="">-- Choose a Student --</option>';
  studentsData[selectedSection]
    .filter(student => student.name.toLowerCase().includes(searchTerm))
    .forEach(student => {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = student.name;
      studentSelect.appendChild(option);
    });
});

// Handle student selection
studentSelect.addEventListener("change", () => {
  const studentId = studentSelect.value;
  if (!studentId) return;

  selectedStudent = studentsData[selectedSection].find(s => s.id === studentId);
  renderGrades();
});

// Render student grades & charts
function renderGrades() {
  gradesTable.innerHTML = "";
  gradesContainer.style.display = "block";

  selectedStudent.grades.forEach((grade, index) => {
    const gradeClass = grade >= 75 ? "grade-pass" : "grade-fail";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <input type="number" value="${grade}" class="form-control gradeInput ${gradeClass}" data-index="${index}">
      </td>
      <td>
        <button class="btn btn-sm btn-danger deleteBtn" data-index="${index}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    `;
    gradesTable.appendChild(row);
  });

  updateAverage();
  updateCharts();

  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.getAttribute("data-index");
      if (confirm("Are you sure you want to delete this grade?")) {
        selectedStudent.grades.splice(index, 1);
        saveChanges();
        renderGrades();
      }
    });
  });

  document.querySelectorAll(".gradeInput").forEach(input => {
    input.addEventListener("change", () => {
      const index = input.getAttribute("data-index");
      selectedStudent.grades[index] = parseInt(input.value);
      saveChanges();
      renderGrades();
    });
  });
}

// Add new grade
addGradeBtn.addEventListener("click", () => {
  const grade = parseInt(newGradeInput.value);
  if (isNaN(grade) || grade < 0 || grade > 100) {
    alert("Please enter a valid grade between 0 and 100.");
    return;
  }
  selectedStudent.grades.push(grade);
  newGradeInput.value = "";
  saveChanges();
  renderGrades();
});

// Update student average
function updateAverage() {
  const grades = selectedStudent.grades;
  if (grades.length === 0) {
    averageContainer.textContent = "No grades available.";
    return;
  }
  const avg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
  const status = avg >= 75 ? "PASSED" : "FAILED";
  const badgeClass = avg >= 75 ? "bg-success" : "bg-danger";
  averageContainer.innerHTML = `
    Average: <span class="badge ${badgeClass}">${avg}</span> — Status: <span class="badge ${badgeClass}">${status}</span>
  `;
}

// Update student-level charts
function updateCharts() {
  const grades = selectedStudent.grades;
  const passCount = grades.filter(g => g >= 75).length;
  const failCount = grades.filter(g => g < 75).length;

  if (gradesChart) gradesChart.destroy();
  if (passFailChart) passFailChart.destroy();

  gradesChart = new Chart(document.getElementById("gradesChart"), {
    type: "bar",
    data: {
      labels: grades.map((_, i) => `Grade ${i + 1}`),
      datasets: [{
        label: "Grades",
        data: grades,
        backgroundColor: grades.map(g => g >= 75 ? "#28a745" : "#dc3545")
      }]
    }
  });

  passFailChart = new Chart(document.getElementById("passFailChart"), {
    type: "doughnut",
    data: {
      labels: ["Pass", "Fail"],
      datasets: [{
        data: [passCount, failCount],
        backgroundColor: ["#28a745", "#dc3545"]
      }]
    }
  });
}

// Render class-level analytics
function renderClassChart() {
  if (classChart) classChart.destroy();
  const averages = studentsData[selectedSection].map(s =>
    s.grades.length ? (s.grades.reduce((a, b) => a + b, 0) / s.grades.length).toFixed(2) : 0
  );
  const labels = studentsData[selectedSection].map(s => s.name);
  classChart = new Chart(document.getElementById("classChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Average Grades",
        data: averages,
        backgroundColor: averages.map(a => a >= 75 ? "#28a745" : "#dc3545")
      }]
    },
    options: { responsive: true }
  });
}

// Save changes locally & update download button
function saveChanges() {
  const dataStr = JSON.stringify(studentsData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  downloadJsonBtn.href = url;
  downloadJsonBtn.download = "students.json";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("teacherName");
  window.location.href = "index.html";
});
