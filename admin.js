Calculating the total price
      const total = order.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

