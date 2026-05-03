export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  gallery?: string[];
  colors?: string[];
  sizes?: string[];
  description?: string;
  details?: string[];
  fabric?: string;
  careInstructions?: string[];
  isNewArrival?: boolean;
  soldOut?: boolean;
  stock?: number;
}

export interface Order {
  id?: string;
  customerInfo: {
    socialName: string;
    phone: string;
    altPhone?: string;
    address: string;
    deliveryZone: 'inside' | 'outside';
    paymentInfo: string;
    designDetails?: string;
  };
  items: CartItem[];
  totalAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'COD' | 'WhatsApp';
  createdAt: any;
  updatedAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}
