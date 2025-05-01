HTML structure for each order
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
