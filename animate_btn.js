// customer.js - Handles the customer-side order placement and status tracking

let orderPlaced = false;

// Generate time slots dynamically
function generateTimeSlots() {
  const select = document.getElementById("time-slot");
  if (!select) return;

  select.innerHTML = '<option value="">--Choose--</option>'; // Reset options

  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

  const timeSlots = JSON.parse(localStorage.getItem('timeSlots')) || {};

  for (let i = 0; i < 8; i++) { // Generate 8 slots (2 hours of options)
    const start = new Date(now.getTime() + i * 15 * 60000);
    const end = new Date(start.getTime() + 15 * 60000);

    const slotText = `${formatTime(start)} - ${formatTime(end)}`;
    const option = document.createElement("option");
    option.value = slotText;
    option.textContent = slotText;

    // Disable the slot if it's full
    if (timeSlots[slotText] && timeSlots[slotText] >= 5) {
      option.disabled = true;
      option.textContent = `${slotText} (Full)`;
    }

    select.appendChild(option);
  }
}

// Format time to 12-hour AM/PM format
function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Initialize the timeline with the current status
function initializeTimeline(currentStatus) {
  const statuses = ["Order Confirmed", "Preparing", "Ready for Pickup", "Completed"];
  const timeline = document.getElementById("order-timeline");
  if (!timeline) return;

  // Create timeline items if they don't exist
  if (timeline.children.length === 0) {
    statuses.forEach((status, index) => {
      const item = document.createElement("div");
      item.className = "timeline-item";
      item.id = `status-${index}`;

      const dot = document.createElement("div");
      dot.className = "timeline-dot";

      const label = document.createElement("div");
      label.className = "timeline-label";
      label.textContent = status;

      item.appendChild(dot);
      item.appendChild(label);
      timeline.appendChild(item);
    });
  }

  // Update timeline based on current status
  const currentIndex = statuses.indexOf(currentStatus);
  if (currentIndex >= 0) {
    for (let i = 0; i <= currentIndex; i++) {
      const item = document.getElementById(`status-${i}`);
      if (item) {
        item.classList.add("active");
      }
    }
  }
}

// Place an order and generate QR code
function placeOrder() {
  const timeSlotElement = document.getElementById("time-slot");
  if (!timeSlotElement) {
    alert("Time slot selection not available.");
    return;
  }

  const slot = timeSlotElement.value;
  if (!slot || slot === "--Choose--") {
    alert("Please select a time slot.");
    return;
  }

  // Update time slot availability
  const timeSlots = JSON.parse(localStorage.getItem('timeSlots')) || {};
  if (!timeSlots[slot]) timeSlots[slot] = 0;

  // Check if slot is full
  if (timeSlots[slot] >= 5) {
    alert("Sorry, this time slot is full. Please select another.");
    return;
  }

  // Reserve the slot
  timeSlots[slot]++;
  localStorage.setItem('timeSlots', JSON.stringify(timeSlots));

  // Hide the order button and show confirmation animation
  const orderBtn = document.getElementById("order-btn");
  if (orderBtn) orderBtn.style.display = "none";

  const confirmation = document.getElementById("confirmation");
  if (confirmation) {
    confirmation.classList.remove("hidden");
  }

  // Play sound
  const sound = document.getElementById("order-sound");
  if (sound) {
    sound.play().catch(e => console.log("Sound play error:", e));
  }

  // Trigger animation on order button, then show QR and timeline
  orderBtn.classList.add("button-animation");

  // Wait for animation to complete, then generate QR code and show timeline
  setTimeout(() => {
    // Generate QR code only after animation
    generateQRCode(slot);

    // Show timeline after QR code is generated
    const timeline = document.getElementById("order-timeline");
    if (timeline) {
      timeline.classList.remove("hidden");
      initializeTimeline("Order Confirmed");
    }
  }, 1500); // Delay for animation completion
  
  orderPlaced = true;
}

// Generate QR code with order information
function generateQRCode(timeSlot) {
  const qrDiv = document.getElementById("qrcode");
  if (!qrDiv) return;

  // Hide QR code initially
  qrDiv.classList.add("hidden");

  // Clear previous QR code
  qrDiv.innerHTML = "";

  // Generate random order ID
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

  // Order data
  const orderData = {
    orderId: orderId,
    selectedTimeSlot: timeSlot,
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, name: "Pizza", quantity: 1, price: 12.99 }
    ],
    status: "Order Confirmed"
  };

  // Save order to localStorage
  const existingOrders = JSON.parse(localStorage.getItem('orders')) || [];
  existingOrders.push(orderData);
  localStorage.setItem('orders', JSON.stringify(existingOrders));
  localStorage.setItem('currentOrderId', orderId);

  // Create QR code
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrDiv, {
      text: JSON.stringify(orderData),
      width: 150,
      height: 150,
      colorDark: "#ffffff",
      colorLight: "#000000"
    });

    // Add order ID below QR code
    const orderIdElement = document.createElement("p");
    orderIdElement.style.color = "#ffffff";
    orderIdElement.style.marginTop = "10px";
    orderIdElement.innerHTML = `<strong>Order ID:</strong> ${orderId}`;
    qrDiv.appendChild(orderIdElement);

    // Add instruction
    const instructionElement = document.createElement("p");
    instructionElement.style.color = "#cccccc";
    instructionElement.style.fontSize = "0.8rem";
    instructionElement.textContent = "Show this QR code when picking up";
    qrDiv.appendChild(instructionElement);

    // Make QR code visible with animation
    setTimeout(() => {
      qrDiv.classList.remove("hidden");
    }, 100);
  } else {
    qrDiv.innerHTML = "<p>QR Code library not loaded.</p>";
    console.error("QRCode library not found");
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  generateTimeSlots();

  // Check if order is already in progress
  const currentOrderId = localStorage.getItem('currentOrderId');
  if (currentOrderId) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const currentOrder = orders.find(order => order.orderId === currentOrderId);

    if (currentOrder) {
      // Restore order state
      orderPlaced = true;

      // Hide order form elements
      const orderBtn = document.getElementById("order-btn");
      if (orderBtn) orderBtn.style.display = "none";

      const timeSlotSelect = document.getElementById("time-slot");
      if (timeSlotSelect) timeSlotSelect.disabled = true;

      // Show confirmation
      const confirmation = document.getElementById("confirmation");
      if (confirmation) confirmation.classList.remove("hidden");

      // Regenerate QR code
      generateQRCode(currentOrder.selectedTimeSlot);

      // Show and update timeline
      const timeline = document.getElementById("order-timeline");
      if (timeline) {
        timeline.classList.remove("hidden");
        initializeTimeline(currentOrder.status);
      }
    }
  }

  // Add event listener for the order button
  const orderBtn = document.getElementById("order-btn");
  if (orderBtn) {
    orderBtn.addEventListener("click", placeOrder);
  }
});
