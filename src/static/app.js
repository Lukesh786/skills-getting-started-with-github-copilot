document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select to avoid duplicate options on reload
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML as a bulleted list (or a friendly note if none)
        const participantsHtml = details.participants.length
          ? '<ul class="participants-list">' + details.participants.map(p => `
              <li class="participant-item">
                <span class="participant-email">${p}</span>
                <button class="delete-btn" data-activity="${name}" data-email="${p}" aria-label="Unregister ${p}">✖</button>
              </li>
            `).join("") + "</ul>"
          : '<p class="no-participants">No participants yet</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="description">${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants (${details.participants.length}):</strong></p>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh the activities list so new participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 4 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegate delete button clicks to unregister participants
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await res.json();

      if (res.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        // Refresh activities list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 4000);
    } catch (error) {
      messageDiv.textContent = "Error unregistering. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  });
});
