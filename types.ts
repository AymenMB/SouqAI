
export type Language = 'en' | 'fr' | 'ar';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  logoUrl?: string;
}

export interface ProductListing {
  id: string;
  sellerId: string;
  sellerName: string;
  organizationId?: string; // Link to the shop/company
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  videoUrl?: string;
  views: number;
  createdAt: string;
}

export interface ProductDraft {
  category: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum AppState {
  HOME = 'HOME',
  SELLER_FLOW = 'SELLER_FLOW',
  BUYER_FLOW = 'BUYER_FLOW',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD'
}
