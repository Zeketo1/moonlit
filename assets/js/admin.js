const API_BASE_URL = 'http://localhost:8000/api';
const authToken = localStorage.getItem('authToken');

// Fetch Dashboard Stats
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        document.getElementById('total-rooms').querySelector('p').textContent = data.total_rooms;
        document.getElementById('total-bookings').querySelector('p').textContent = data.total_bookings;
        document.getElementById('total-customers').querySelector('p').textContent = data.total_customers;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// Add New Room
document.getElementById('add-room-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomData = {
        type: document.getElementById('room-type').value,
        price: parseFloat(document.getElementById('room-price').value),
        description: document.getElementById('room-description').value,
        image_url: document.getElementById('room-image').value,
        max_guests: document.getElementById('room-guest').value,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(roomData),
        });
        if (response.ok) {
            alert('Room added successfully!');
            fetchDashboardStats(); // Refresh stats
        } else {
            alert('Failed to add room.');
        }
    } catch (error) {
        console.error('Error adding room:', error);
    }
});

// Fetch and Display Bookings
async function fetchBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const bookings = await response.json();
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <p>Booking ID: ${booking.id}</p>
                <p>Customer ID: ${booking.user}</p>
                <p>Status: ${booking.status}</p>
                <p>Total Price: $${booking.total_price}</p>
                <button onclick="approveBooking(${booking.id})">Approve</button>
                <button onclick="rejectBooking(${booking.id})">Reject</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}

// Approve Booking
async function approveBooking(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/approve/${bookingId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.ok) {
            alert('Booking approved!');
            fetchBookings(); // Refresh bookings list
        }
    } catch (error) {
        console.error('Error approving booking:', error);
    }
}

// Reject Booking
async function rejectBooking(bookingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings/reject/${bookingId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (response.ok) {
            alert('Booking rejected!');
            fetchBookings(); // Refresh bookings list
        }
    } catch (error) {
        console.error('Error rejecting booking:', error);
    }
}

// Logout
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.reload()
});

// Initial Load
fetchDashboardStats();
fetchBookings();










let currentEditingId = null;

// Fetch all rooms
async function fetchRooms() {
    try {
        console.log("Fetching rooms...");
        const response = await fetch(`${API_BASE_URL}/rooms/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`  // Use dynamic token
            }
        });
        console.log("Response status:", response.status);
        if (!response.ok) {
            console.error("Response not OK:", await response.text());
            throw new Error("Failed to fetch rooms");
        }
        const rooms = await response.json();
        console.log("Rooms data:", rooms);
        renderRooms(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        alert('Failed to load rooms');
    }
}

// Render rooms to DOM
function renderRooms(rooms) {
    const container = document.getElementById('roomContainer');
    if (!container) {
        console.error("Room container not found!");
        return;
    }
    container.innerHTML = rooms.map(room => `
        <div class="room-card">
    <div class="room-image-container">
        <img src="${room.image_url}" alt="${room.type} room" class="room-image">
        <span class="room-status ${room.is_available ? 'available' : 'occupied'}">
            ${room.is_available ? 'Available' : 'Occupied'}
        </span>
    </div>
    <div class="room-content">
        <div class="room-header">
            <h3 class="room-title">${room.type}</h3>
            <p class="room-price">$${room.price}<span class="price-label">/night</span></p>
        </div>
        <p class="room-description">${room.description}</p>
        <div class="room-details">
            <div class="detail-item">
                <svg class="detail-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7 7c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3zm12 10H5v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/>
                </svg>
                <span>Max Guests: ${room.max_guests}</span>
            </div>
        </div>
        <div class="room-actions">
            <button class="btn btn-edit" onclick="openEditModal(${room.id})">
                <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Edit
            </button>
            <button class="btn btn-delete" onclick="deleteRoom(${room.id})">
                <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete
            </button>
        </div>
    </div>
</div>
    `).join('');
}

// Open edit modal
async function openEditModal(roomId) {
    try {
        // Changed to GET request
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/`, { // Verify endpoint URL
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch room details");
        const room = await response.json();

        // Corrected field mapping (using 'type' instead of 'name')
        document.getElementById('editType').value = room.type; // Ensure HTML has editType input
        document.getElementById('editPrice').value = room.price;
        document.getElementById('editDescription').value = room.description;
        document.getElementById('editAvailable').checked = room.is_available;
        document.getElementById('editImage').value = room.image_url;
        document.getElementById('editMaxGuests').value = room.max_guests;
        // Add other necessary fields like image_url and max_guests if required
        currentEditingId = roomId;
        document.getElementById('editModal').style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load room details');
    }   
}

// Handle form submission (Corrected)
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updatedData = {
        type: document.getElementById('editType').value, // Changed from 'name' to 'type'
        price: parseFloat(document.getElementById('editPrice').value),
        description: document.getElementById('editDescription').value,
        is_available: document.getElementById('editAvailable').checked,
        image_url: document.getElementById('editImage').value,
        max_guests: document.getElementById('editMaxGuests').value
        // Include image_url and max_guests if required
    };

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/update/${currentEditingId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error(await response.text());
        alert('Room updated successfully!');
        closeModal();
        fetchRooms();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update room');
    }
});


// Delete room
async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/delete/${roomId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            console.error("Response not OK:", await response.text());
            throw new Error("Failed to delete room");
        }
        alert('Room deleted successfully!');
        fetchRooms();
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room');
    }
}

// Modal controls
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingId = null;
}

// Initial load
if (!authToken) {
    window.location.href = '/index.html';
} else {
    fetchRooms();
}