// vendor.js - Handles the restaurant/vendor side order management
document.addEventListener('DOMContentLoaded', () => {
  const orderList = document.querySelector('.order-list');
  const scannerContainer = document.getElementById('qr-scanner-container');
  const stopScannerBtn = document.getElementById('stop-scanner-btn');
  let qrScanner = null;
  let currentOrderId = null;

  // Load data from localStorage or use default data if not available
  const initializeData = () => {
    // Check if orders exist in localStorage, if not, use the default one
    if (!localStorage.getItem('orders')) {
      const defaultOrders = [
        {
          orderId: "12345",
          selectedTimeSlot: "12:00 PM - 1:00 PM",
          date: "2025-04-15",
          status: "Order Confirmed",
          items: [
            { id: 1, name: "Pepperoni Pizza", quantity: 2, price: 20 },
            { id: 2, name: "Chicken Cheese Pizza", quantity: 1, price: 25 }
          ]
        }
      ];
      localStorage.setItem('orders', JSON.stringify(defaultOrders));
    }
  };

  // Load orders from localStorage and display them dynamically
  const loadOrders = () => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orderList.innerHTML = '';

    if (orders.length === 0) {
      orderList.innerHTML = "<p>No orders placed yet.</p>";
      return;
    }

    orders.forEach(order => {
      // Skip completed orders when displaying
      if (order.status === "Completed") return;
      
      const card = document.createElement('div');
      card.className = "card";
      card.id = `order-${order.orderId}`;

      // Collecting items directly from the order
      const itemsHtml = order.items.map(item => {
        return `<p>${item.name} — ${item.quantity} × $${item.price.toFixed(2)}</p>`;
      }).join('');

      // Calculating the total price
      const total = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Determine which buttons to show based on status
      let buttonsHtml = '';
      
      if (order.status === "Pending" || order.status === "Order Confirmed") {
        buttonsHtml = `<button class="status-btn preparing-btn" data-order-id="${order.orderId}" data-status="Preparing">Mark Preparing</button>`;
      } else if (order.status === "Preparing") {
        buttonsHtml = `<button class="status-btn prepared-btn" data-order-id="${order.orderId}" data-status="Prepared">Mark Prepared</button>`;
      } else if (order.status === "Prepared") {
        buttonsHtml = `<button class="scan-btn" data-order-id="${order.orderId}">Scan QR</button>`;
      }

      // HTML structure for each order
      card.innerHTML = `
        <h3>Order ID: <span>${order.orderId}</span></h3>
        <p><strong>Time Slot:</strong> ${order.selectedTimeSlot}</p>
        <p><strong>Date:</strong> ${order.date || 'Today'}</p>
        <p><strong>Total Price:</strong> $${total.toFixed(2)}</p>
        <div class="order-items"><strong>Items:</strong><br>${itemsHtml}</div>
        <p class="status-display">Status: <strong><span id="status-${order.orderId}" class="status-${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</span></strong></p>
        <div class="action-buttons">${buttonsHtml}</div>
      `;
      orderList.appendChild(card);
    });

    // Add event listeners after updating the order list
    const statusButtons = document.querySelectorAll('.status-btn');
    statusButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const orderId = event.target.getAttribute('data-order-id');
        const status = event.target.getAttribute('data-status');
        updateStatus(orderId, status);
      });
    });

    const scanButtons = document.querySelectorAll('.scan-btn');
    scanButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const orderId = event.target.getAttribute('data-order-id');
        currentOrderId = orderId;
        startQRCodeScanner();
      });
    });
  };

  // Update the status of the order
  const updateStatus = (orderId, status) => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const index = orders.findIndex(o => o.orderId === orderId);
    
    if (index !== -1) {
      orders[index].status = status;
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // Update the status in localStorage to communicate with customer page
      // This is how we trigger the customer timeline update
      localStorage.setItem(`order-${orderId}-stage`, status.toLowerCase());
      
      // Update the UI
      const statusElement = document.getElementById(`status-${orderId}`);
      if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      // Reload orders to update buttons
      loadOrders();
    }
  };

  // Start the QR code scanner
  const startQRCodeScanner = () => {
    scannerContainer.classList.remove('hidden');
    
    if (typeof Html5Qrcode !== 'undefined') {
      qrScanner = new Html5Qrcode("qr-reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      qrScanner.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          try {
            const scanned = JSON.parse(decodedText);
            if (scanned.orderId === currentOrderId) {
              alert(`✅ Order ${currentOrderId} QR Verified!`);
              completeOrder(currentOrderId);
              stopQRCodeScanner();
            } else {
              alert("❌ Incorrect QR code. Please ensure customer is presenting the correct order QR.");
            }
          } catch (error) {
            alert("❌ Invalid QR code format. Please try scanning again.");
            console.error("QR code parsing error:", error);
          }
        },
        (errorMessage) => {
          // Error callback is required but we'll handle errors elsewhere
        }
      ).catch(error => {
        console.error("Scanner start error:", error);
        alert("Error starting the scanner. Please check camera permissions.");
      });
    } else {
      alert("QR scanner library not loaded. Please ensure Html5Qrcode is properly included.");
    }
  };

  // Stop the QR code scanner
  const stopQRCodeScanner = () => {
    if (qrScanner) {
      qrScanner.stop()
        .then(() => {
          return qrScanner.clear();
        })
        .then(() => {
          scannerContainer.classList.add('hidden');
        })
        .catch(error => {
          console.error("Scanner stop error:", error);
          scannerContainer.classList.add('hidden');
        });
    } else {
      scannerContainer.classList.add('hidden');
    }
  };

  // Complete the order after QR verification
  const completeOrder = (orderId) => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const index = orders.findIndex(o => o.orderId === orderId);
    
    if (index !== -1) {
      orders[index].status = "Completed";
      localStorage.setItem('orders', JSON.stringify(orders));
      
      // Update the customer timeline
      localStorage.setItem(`order-${orderId}-stage`, 'completed');
      
      // Add animation class before removal
      const orderCard = document.getElementById(`order-${orderId}`);
      if (orderCard) {
        orderCard.classList.add('completed-animation');
        setTimeout(() => {
          orderCard.remove();
        }, 1000); // Remove after animation completes
      }
      
      loadOrders();
    }
  };

  // Event listener for stop scanner button
  if (stopScannerBtn) {
    stopScannerBtn.addEventListener('click', stopQRCodeScanner);
  }

  // Initialize data and load orders on page load
  initializeData();
  loadOrders();
  
  // Set up periodic refresh to check for new orders
  setInterval(() => {
    loadOrders();
  }, 10000); // Refresh every 10 seconds
});