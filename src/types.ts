export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  colors?: string[];
  soldOut?: boolean;
  isNewArrival?: boolean;
}

export interface Order {
  id?: string;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'COD';
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}
