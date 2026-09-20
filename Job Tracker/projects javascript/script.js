// ================================
// JOBTRACK APPLICATION
// ================================

let jobs = JSON.parse(localStorage.getItem("jobtrack_jobs")) || [];

let editingId = null;

let chart;


// ================================
// DOM ELEMENTS
// ================================

const modal = document.getElementById("jobModal");
const form = document.getElementById("jobForm");

const companyInput = document.getElementById("company");
const positionInput = document.getElementById("position");
const locationInput = document.getElementById("location");
const dateInput = document.getElementById("date");
const statusInput = document.getElementById("status");
const interviewInput = document.getElementById("interviewDate");
const urlInput = document.getElementById("jobUrl");
const notesInput = document.getElementById("notes");

const table = document.getElementById("jobTable");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");


// ================================
// OPEN MODAL
// ================================

function openModal() {

    modal.classList.add("show");

    editingId = null;

    form.reset();

    document.getElementById("modalTitle").textContent =
        "Add Job Application";
}


// ================================
// CLOSE MODAL
// ================================

function closeModal() {

    modal.classList.remove("show");

    editingId = null;

    form.reset();
}


// Close when clicking outside

modal.addEventListener("click", function(e) {

    if (e.target === modal) {
        closeModal();
    }

});


// ================================
// ADD / UPDATE APPLICATION
// ================================

form.addEventListener("submit", function(e) {

    e.preventDefault();

    const job = {

        id: editingId || Date.now(),

        company: companyInput.value.trim(),

        position: positionInput.value.trim(),

        location: locationInput.value.trim(),

        date: dateInput.value,

        status: statusInput.value,

        interviewDate: interviewInput.value,

        jobUrl: urlInput.value.trim(),

        notes: notesInput.value.trim()

    };


    if (editingId) {

        jobs = jobs.map(item =>
            item.id === editingId ? job : item
        );

    } else {

        jobs.push(job);

    }


    saveData();

    renderJobs();

    updateDashboard();

    closeModal();

});


// ================================
// SAVE DATA
// ================================

function saveData() {

    localStorage.setItem(
        "jobtrack_jobs",
        JSON.stringify(jobs)
    );

}


// ================================
// RENDER JOBS
// ================================

function renderJobs() {

    let filteredJobs = [...jobs];

    const search = searchInput.value
        .toLowerCase()
        .trim();

    const selectedStatus = statusFilter.value;


    // Search

    if (search) {

        filteredJobs = filteredJobs.filter(job =>

            job.company.toLowerCase().includes(search) ||

            job.position.toLowerCase().includes(search) ||

            job.location.toLowerCase().includes(search)

        );

    }


    // Status filter

    if (selectedStatus !== "All") {

        filteredJobs = filteredJobs.filter(
            job => job.status === selectedStatus
        );

    }


    // Sorting

    if (sortFilter.value === "newest") {

        filteredJobs.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

    }

    else if (sortFilter.value === "oldest") {

        filteredJobs.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

    }

    else if (sortFilter.value === "company") {

        filteredJobs.sort(
            (a, b) =>
                a.company.localeCompare(b.company)
        );

    }


    table.innerHTML = "";


    if (filteredJobs.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;">
                    No applications found.
                </td>
            </tr>
        `;

        return;
    }


    filteredJobs.forEach(job => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>
                <span class="company-name">
                    ${escapeHTML(job.company)}
                </span>
            </td>

            <td>
                ${escapeHTML(job.position)}
            </td>

            <td>
                ${escapeHTML(job.location || "-")}
            </td>

            <td>
                ${formatDate(job.date)}
            </td>

            <td>
                <span class="status status-${job.status}">
                    ${job.status}
                </span>
            </td>

            <td>
                ${job.interviewDate
                    ? formatDate(job.interviewDate)
                    : "-"
                }
            </td>

            <td>

                <div class="actions">

                    <button
                        class="action-btn edit"
                        onclick="editJob(${job.id})">
                        ✏️
                    </button>

                    <button
                        class="action-btn delete"
                        onclick="deleteJob(${job.id})">
                        🗑️
                    </button>

                </div>

            </td>
        `;

        table.appendChild(row);

    });

}


// ================================
// EDIT JOB
// ================================

function editJob(id) {

    const job = jobs.find(item => item.id === id);

    if (!job) return;

    editingId = id;

    companyInput.value = job.company;

    positionInput.value = job.position;

    locationInput.value = job.location;

    dateInput.value = job.date;

    statusInput.value = job.status;

    interviewInput.value = job.interviewDate;

    urlInput.value = job.jobUrl;

    notesInput.value = job.notes;


    document.getElementById("modalTitle").textContent =
        "Edit Job Application";

    modal.classList.add("show");

}


// ================================
// DELETE JOB
// ================================

function deleteJob(id) {

    const confirmDelete =
        confirm("Are you sure you want to delete this application?");

    if (!confirmDelete) return;

    jobs = jobs.filter(job => job.id !== id);

    saveData();

    renderJobs();

    updateDashboard();

}


// ================================
// DASHBOARD
// ================================

function updateDashboard() {

    const total = jobs.length;

    const interviews = jobs.filter(
        job => job.status === "Interview"
    ).length;

    const selected = jobs.filter(
        job => job.status === "Selected"
    ).length;

    const rejected = jobs.filter(
        job => job.status === "Rejected"
    ).length;


    document.getElementById("totalApplications")
        .textContent = total;

    document.getElementById("interviews")
        .textContent = interviews;

    document.getElementById("selected")
        .textContent = selected;

    document.getElementById("rejected")
        .textContent = rejected;


    updateChart();

    updateInterviews();

}


// ================================
// CHART
// ================================

function updateChart() {

    const applied = jobs.filter(
        job => job.status === "Applied"
    ).length;

    const interview = jobs.filter(
        job => job.status === "Interview"
    ).length;

    const selected = jobs.filter(
        job => job.status === "Selected"
    ).length;

    const rejected = jobs.filter(
        job => job.status === "Rejected"
    ).length;


    const ctx =
        document.getElementById("jobChart");


    if (chart) {
        chart.destroy();
    }


    chart = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: [
                "Applied",
                "Interview",
                "Selected",
                "Rejected"
            ],

            datasets: [{

                data: [
                    applied,
                    interview,
                    selected,
                    rejected
                ]

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}


// ================================
// UPCOMING INTERVIEWS
// ================================

function updateInterviews() {

    const container =
        document.getElementById("interviewList");


    const interviews = jobs
        .filter(job =>
            job.interviewDate &&
            new Date(job.interviewDate) >= new Date()
        )
        .sort(
            (a, b) =>
                new Date(a.interviewDate) -
                new Date(b.interviewDate)
        )
        .slice(0, 5);


    if (interviews.length === 0) {

        container.innerHTML =
            `<p class="empty">No upcoming interviews</p>`;

        return;
    }


    container.innerHTML = "";


    interviews.forEach(job => {

        const div = document.createElement("div");

        div.style.padding = "12px 0";
        div.style.borderBottom = "1px solid var(--border)";

        div.innerHTML = `

            <strong>
                ${escapeHTML(job.company)}
            </strong>

            <p style="color:var(--muted);font-size:13px;margin-top:4px;">
                ${escapeHTML(job.position)}
            </p>

            <small>
                📅 ${formatDate(job.interviewDate)}
            </small>

        `;

        container.appendChild(div);

    });

}


// ================================
// SEARCH & FILTER
// ================================

searchInput.addEventListener(
    "input",
    renderJobs
);

statusFilter.addEventListener(
    "change",
    renderJobs
);

sortFilter.addEventListener(
    "change",
    renderJobs
);


// ================================
// DARK MODE
// ================================

const themeBtn =
    document.getElementById("themeBtn");


themeBtn.addEventListener("click", function() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "jobtrack_dark",
        dark
    );

    themeBtn.textContent =
        dark ? "☀️ Light Mode" : "🌙 Dark Mode";

});


if (
    localStorage.getItem("jobtrack_dark") === "true"
) {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️ Light Mode";

}


// ================================
// EXPORT CSV
// ================================

function exportCSV() {

    if (jobs.length === 0) {

        alert("No applications available to export.");

        return;
    }


    const headers = [
        "Company",
        "Position",
        "Location",
        "Applied Date",
        "Status",
        "Interview Date",
        "Job URL",
        "Notes"
    ];


    const rows = jobs.map(job => [

        job.company,

        job.position,

        job.location,

        job.date,

        job.status,

        job.interviewDate,

        job.jobUrl,

        job.notes

    ]);


    const csv = [

        headers,

        ...rows

    ].map(row =>

        row.map(value =>

            `"${String(value || "")
                .replace(/"/g, '""')}"`
        ).join(",")

    ).join("\n");


    const blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "jobtrack-applications.csv";

    link.click();


    URL.revokeObjectURL(url);

}


// ================================
// UTILITIES
// ================================

function formatDate(date) {

    if (!date) return "-";

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ================================
// INITIAL LOAD
// ================================

renderJobs();

updateDashboard();