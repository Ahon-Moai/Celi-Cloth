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

export interface CheckoutSession {
  id?: string;
  session_id: string;
  customer_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  notes?: string | null;
  cart_items: CartItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  status: 'in_progress' | 'abandoned' | 'completed';
  order_id?: string | null;
  last_activity_at: string;
  created_at?: string;
  updated_at?: string;
}
