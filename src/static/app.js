document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to avoid HTML injection when inserting participant names/emails
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s];
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // Force fresh network fetch to avoid cached responses
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (list without bullets) and attach remove buttons
        const participants = details.participants || [];
        let participantsHTML = "";
        if (participants.length) {
          participantsHTML = `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${participants
                  .map((p) => {
                    const label = typeof p === "string" ? p : p.name || p.email || JSON.stringify(p);
                    const emailVal = typeof p === "string" ? p : p.email || p.name || JSON.stringify(p);
                    return `<li><span class="participant-label">${escapeHtml(label)}</span><button class="participant-remove" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(emailVal)}" title="Unregister">✖</button></li>`;
                  })
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `<div class="participants info">No participants yet. Be the first!</div>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for participants in this activity
        activityCard.querySelectorAll(".participant-remove").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activity = btn.dataset.activity;
            const email = btn.dataset.email;

            // Show confirmation modal
            const confirmed = window.confirm(`Unregister ${email} from ${activity}?`);
            if (!confirmed) return;

            // Disable the button while request is in-flight
            btn.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";

                // Animate removal of the list item for feedback
                const li = btn.closest("li");
                if (li) {
                  li.classList.add("removing");
                  // Wait for animation to finish before refreshing
                  setTimeout(() => {
                    fetchActivities();
                  }, 300);
                } else {
                  // Fallback refresh
                  fetchActivities();
                }
              } else {
                messageDiv.textContent = result.detail || "Failed to unregister participant";
                messageDiv.className = "error";
                btn.disabled = false;
              }

              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (error) {
              messageDiv.textContent = "Failed to unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering participant:", error);
              btn.disabled = false;
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Return fetched activities so callers can await if needed
      return activities;
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
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so participants/availability update immediately (await to ensure UI updates)
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
