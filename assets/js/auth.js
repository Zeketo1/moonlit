function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const BaseUrl = "https://hotel-backend-buns.onrender.com/";

// Login Form Handler
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    email: document.getElementById("email-popup").value,
    password: document.getElementById("password").value,
  };

  try {
    const response = await fetch(`${BaseUrl}api/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify(formData),
      credentials: "include",
    });

    if (!response.ok) throw new Error("Login failed");

    const data = await response.json();
    localStorage.setItem("authToken", data.access);

    // Fetch user profile to check admin status
    const profileResponse = await fetch(`${BaseUrl}api/user/`, {
      headers: {
        Authorization: `Bearer ${data.access}`,
      },
    });

    if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
    const userProfile = await profileResponse.json();

    // Check if user is admin (adjust this based on your user model)
    if (userProfile.is_staff || userProfile.is_superuser) {
      window.location.href = "admin_dashboard.html";
    } else {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Login failed. Please check your credentials.");
  }
});

// Registration Form Handler
document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      username: document.getElementById("sname").value,
      email: document.getElementById("signemail").value,
      phone: document.getElementById("signphone").value,
      password: document.getElementById("spassword").value,
    };

    try {
      const response = await fetch(`${BaseUrl}api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Registration Response:", data);

      if (response.ok) {
        if (data.access) {
          // If using JWT
          // localStorage.setItem('authToken', data.access);
          alert("Registration successful! Redirecting...");
          // window.location.href = '/dashboard.html';
        } else {
          alert("Registration successful! Please login.");
          // window.location.href = '/login.html';
        }
      } else {
        // Handle validation errors
        const errors = data.errors || data;
        const errorMessage =
          typeof errors === "object"
            ? Object.values(errors).join("\n")
            : data.detail || "Registration failed";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Registration Error:", error);
      alert(error.message || "Registration failed. Please try again.");
    }
  });

document.addEventListener("DOMContentLoaded", async () => {
  const parentElement = document.querySelector(".main__right");
  const parentElement2 = document.querySelector(".main_responsive");
  const profileElement = document.querySelector(".profile-container");
  const authToken = localStorage.getItem("authToken");

  // Show loading state immediately
  parentElement.innerHTML = '<div class="loading">Loading...</div>';
  parentElement2.innerHTML = '<div class="loading">Loading...</div>';

  if (authToken) {
    try {
      // 1. Fetch user data first
      console.log("Fetching user data...");
      const userResponse = await fetch(`${BaseUrl}api/user/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(
          `User data error: ${error.detail || userResponse.statusText}`
        );
      }

      const userData = await userResponse.json();
      console.log("User data received:", userData);

      // 2. Fetch bookings data
      console.log("Fetching bookings...");
      const bookingsResponse = await fetch(
        `${BaseUrl}api/bookings/my-bookings/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!bookingsResponse.ok) {
        const error = await bookingsResponse.json();
        throw new Error(
          `Bookings error: ${error.detail || bookingsResponse.statusText}`
        );
      }

      const bookingsData = await bookingsResponse.json();
      console.log("Bookings data received:", bookingsData);

      // 3. Generate bookings HTML with safe data handling
      const bookingsHTML = bookingsData
        .filter((booking) => booking.status !== "canceled")
        .map((booking) => {
          // Handle missing room data
          const room = booking.room_detail || {};
          return `
                    <div class="booking-item" data-booking-id="${booking.id}">
                        <img src="${
                          room.image_url || "https://via.placeholder.com/100x70"
                        }" 
                             class="room-image"
                             alt="${room.type || "Room image"}">
                        <div class="booking-details">
                            <div class="room-type">${
                              room.type || "No room type available"
                            }</div>
                            <div class="booking-dates">
                                Check-in: ${
                                  booking.check_in || "N/A"
                                } - Check-out: ${booking.check_out || "N/A"}
                            </div>
                            <div class="booking-status">Status: ${
                              booking.status || "unknown"
                            }</div>
                            <div class="booking-price">Price: $${
                              booking.total_price || "0.00"
                            }</div>
                        </div>
                        ${
                          booking.status === "pending"
                            ? `<span class="delete-booking" onclick={handleDeleteBooking(${booking.id})}>Delete</span>`
                            : '<span class="status-display">Cannot delete</span>'
                        }
                    </div>
                `;
        })
        .join("");

      // 4. Update UI
      parentElement.innerHTML = `
                <a href="room-four.html" class="theme-btn btn-style sm-btn fill">
                    <span>Book Now</span>
                </a>
                <a href="#" class="theme-btn btn-style sm-btn border d-none d-lg-block" 
                   aria-label="Profile Button" 
                   data-bs-toggle="modal" 
                   data-bs-target="#profileModal">
                    <span>Profile</span>
                </a>
                <button class="theme-btn btn-style sm-btn fill menu__btn d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
                  <span><img src="assets/images/icon/menu-icon.svg" alt=""></span>
                </button>
            `;

      parentElement2.innerHTML = `
                <a href="room-four.html" class="theme-btn btn-style sm-btn fill">
                    <span>Book Now</span>
                </a>
                <a href="#" class="theme-btn btn-style sm-btn border d-lg-block" 
                   aria-label="Profile Button" 
                   data-bs-toggle="modal" 
                   data-bs-target="#profileModal">
                    <span>Profile</span>
                </a>
            `;

      profileElement.innerHTML = `
                <div class="user-info-section">
                    <h2 class="profile-title">User Info</h2>
                    <div class="info-item">
                        <span class="info-label">Username:</span>
                        <span class="info-value">${
                          userData.username || "Not available"
                        }</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${
                          userData.email || "Not provided"
                        }</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone Number:</span>
                        <span class="info-value">${
                          userData.phone || "Not provided"
                        }</span>
                    </div>
                </div>
                <div class="bookings-section">
                    <h2 class="profile-title">Bookings</h2>
                    ${bookingsHTML || "<p>No bookings found</p>"}
                    <button id="logoutBtn" class="theme-btn btn-style sm-btn border">
                        <span>Logout</span>
                    </button>
                </div>
            `;

      // 5. Add logout handler
      document.getElementById("logoutBtn")?.addEventListener("click", () => {
        localStorage.removeItem("authToken");
        window.location.reload();
      });
    } catch (error) {
      console.error("Full error details:", error);
      profileElement.innerHTML = `
                <div class="error-message">
                    <h3>Error loading data</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="retry-btn">
                        Try Again
                    </button>
                    <button onclick="localStorage.removeItem('authToken'); window.location.href='/';" class="logout-btn">
                        Logout
                    </button>
                </div>
            `;
      parentElement.innerHTML = ""; // Clear parent element
    }
  } else {
    // User not logged in UI
    parentElement.innerHTML = `
            <a href="#" class="theme-btn btn-style sm-btn border d-none d-lg-block" 
               aria-label="Login Button" 
               data-bs-toggle="modal" 
               data-bs-target="#loginModal">
                <span>Sign In</span>
            </a>
            <a href="#" class="theme-btn btn-style sm-btn border d-none d-lg-block" 
               aria-label="Sign Up Button" 
               data-bs-toggle="modal" 
               data-bs-target="#signupModal">
                <span>Sign Up</span>
            </a>
        `;
    parentElement2.innerHTML = `
            <a href="#" class="theme-btn btn-style sm-btn border d-lg-block" 
               aria-label="Login Button" 
               data-bs-toggle="modal" 
               data-bs-target="#loginModal">
                <span>Sign In</span>
            </a>
            <a href="#" class="theme-btn btn-style sm-btn border d-lg-block" 
               aria-label="Sign Up Button" 
               data-bs-toggle="modal" 
               data-bs-target="#signupModal">
                <span>Sign Up</span>
            </a>
        `;
  }
});

const bookingForm = document.getElementById("bookingForm");
const roomBookingBtn = document.getElementById("room-booking");

function formatDateToISO(inputDate) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(inputDate)) {
    throw new Error("Invalid date format (DD-MM-YYYY required)");
  }
  const [day, month, year] = inputDate.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getSelectedServices() {
  const services = Array.from(
    document.querySelectorAll('.query__input.checkbox input[type="checkbox"]')
  )
    .filter((checkbox) => {
      console.log("Checkbox:", {
        name: checkbox.name,
        id: checkbox.getAttribute("data-service-id"),
        checked: checkbox.checked,
      });
      return checkbox.checked;
    })
    .map((checkbox) => {
      const serviceId = parseInt(checkbox.dataset.serviceId, 10); // Add radix
      if (isNaN(serviceId)) {
        console.error("Invalid service ID:", checkbox.dataset.serviceId);
        throw new Error("Invalid service ID");
      }
      return serviceId;
    });

  console.log("Selected Service IDs:", services);
  return services;
}

const handleDeleteBooking = async (hotelId) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Please login to book a room");
      return window.location.reload();
    }
    const response = await fetch(`${BaseUrl}api/bookings/cancel/${hotelId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log(response.json());

    alert("Booking cancelled successfully");
    window.location.reload();
  } catch (e) {
    console.error("Error cancelling booking:", e);
    alert("Error cancelling booking");
  }
};

async function handleBooking(e) {
  e.preventDefault();

  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Please login to book a room");
      return window.location.assign("/login.html");
    }

    // const userData = JSON.parse(localStorage.getItem("user"));
    // if (!userData?.id) throw new Error("User information not found");

    const rawCheckIn = document.getElementById("check__in").value;
    const rawCheckOut = document.getElementById("check__out").value;

    const checkIn = formatDateToISO(rawCheckIn);
    const checkOut = formatDateToISO(rawCheckOut);

    const roomId = parseInt(document.getElementById("roomId").value);
    if (isNaN(roomId)) throw new Error("Invalid room selection");

    const serviceIds = getSelectedServices();

    if (new Date(checkIn) >= new Date(checkOut)) {
      throw new Error("Check-out date must be after check-in date");
    }

    roomBookingBtn.innerHTML = '<div class="spinner"></div> Booking...';

    const response = await fetch(`${BaseUrl}api/bookings/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        check_in: checkIn,
        check_out: checkOut,
        room: roomId,
        services: serviceIds,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Booking failed");
    }

    const data = await response.json();
    alert("Booking successful! Redirecting...");
    window.location.reload();
  } catch (error) {
    console.error("Booking error:", error);
    alert(error.message || "Booking failed. Please try again.");
  } finally {
    roomBookingBtn.innerHTML = "<span>Book Your Room</span>";
  }
}

if (bookingForm && roomBookingBtn) {
  bookingForm.addEventListener("submit", handleBooking);
}
