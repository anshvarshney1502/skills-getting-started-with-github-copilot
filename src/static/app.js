document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.className = isError ? "error" : "success";
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Save previous selection if any
      const currentSelected = activitySelect.value;
      // Reset select options preserving default
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants list HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `
            <div class="participants-section">
              <h5>Participants (${details.participants.length}):</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `
                  <li class="participant-item">
                    <span>${email}</span>
                    <button class="delete-btn" title="Unregister" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}">✕</button>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants-section">
              <h5>Participants:</h5>
              <p class="no-participants">No participants signed up yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (name === currentSelected) {
          option.selected = true;
        }
        activitySelect.appendChild(option);
      });

      // Attach unregister event handlers
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async (e) => {
          e.preventDefault();
          const activityName = decodeURIComponent(button.getAttribute("data-activity"));
          const email = decodeURIComponent(button.getAttribute("data-email"));
          await unregisterParticipant(activityName, email);
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to unregister participant
  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(result.message || `Unregistered ${email} from ${activityName}`);
        fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister", true);
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", true);
      console.error("Error unregistering:", error);
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
        showMessage(result.message);
        signupForm.reset();
        // Refresh activities list immediately so user sees update without page reload
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", true);
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", true);
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
