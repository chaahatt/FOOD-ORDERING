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
