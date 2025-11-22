# SouqAI 🇹🇳 - The Ultimate AI-Commerce Platform

![Status](https://img.shields.io/badge/Status-Beta-red)
![Tech](https://img.shields.io/badge/Built%20With-React%20%7C%20Supabase%20%7C%20Google%20Gemini-blue)
![AI](https://img.shields.io/badge/AI%20Models-Veo%20%7C%20Nano%20Banana%20%7C%20Gemini%203%20Pro-purple)

**SouqAI** is a revolutionary e-commerce marketplace designed specifically for the Tunisian market. It leverages cutting-edge Google Gemini AI models to democratize online selling.

> **"Selling is as easy as taking a photo. Buying is as easy as chatting."**

---

## 🌟 Key Features

### 1. 🛍️ Hyper-Speed Seller Studio (AI-Powered)
Forget expensive product photography. Users simply upload a raw photo of an item, and SouqAI handles the rest:
*   **Vision Analysis:** `Gemini 2.5 Flash` analyzes the image to auto-fill the Title, Category, and Description.
*   **Smart Refinement:** The AI improves the listing copy for SEO and sales conversion.
*   **Generative Backgrounds:** Uses **Nano Banana** (`gemini-2.5-flash-image`) to swap messy backgrounds for professional "Studio", "Lifestyle", or "Luxury" environments.
*   **Video Generation:** Uses **Veo** (`veo-3.1-fast-generate-preview`) to turn the static product image into a cinematic marketing video (Zoom, Pan, etc.).

### 2. 🧞‍♂️ "Habibi" Shopping Assistant
A localized AI agent that replaces the traditional search bar.
*   **Powered by Gemini 3 Pro:** Uses the `gemini-3-pro-preview` model with **Thinking Mode** (Budget: 32k) for complex reasoning.
*   **Trilingual Support:** Fluent in English, French, and **Tunisian Arabic (Derja)**.
*   **Context Aware:** Acts like a friendly Tunisian shopkeeper, helping negotiate prices or find specific items.

### 3. 🏢 Organization Management
*   **Multi-Tenant System:** Users can create Organizations (e.g., "MyTek", "Zara TN") to manage brands separately from personal profiles.
*   **Dashboard:** Real-time analytics on Views, Revenue, and Inventory.

### 4. 🌍 Fully Localized
*   **Languages:** English, Français, Tounsi (Derja).
*   **RTL Support:** Full Right-to-Left layout support for Arabic.
*   **Currency:** Tunisians Dinar (TND).

---

## 🏗️ Technical Architecture

### Frontend
*   **Framework:** React 19
*   **Styling:** Tailwind CSS (Glassmorphism UI)
*   **State Management:** React Hooks
*   **Icons:** Heroicons / SVG

### Backend (BaaS)
*   **Provider:** Supabase
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (Email/Password)
*   **Storage:** Supabase Storage (Bucket: `media`)

### AI Stack (Google GenAI SDK)
| Feature | Model ID | Function |
| :--- | :--- | :--- |
| **Chatbot** | `gemini-3-pro-preview` | Logic, Reasoning, Derja conversation |
| **Image Analysis** | `gemini-2.5-flash` | Extracting metadata from raw photos |
| **Text Refinement** | `gemini-2.5-flash` | SEO optimization & Prompt Engineering |
| **Image Gen** | `gemini-2.5-flash-image` | Background replacement (Nano Banana) |
| **Video Gen** | `veo-3.1-fast-generate-preview` | Product video creation |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js & npm
*   A Google Cloud Project with Gemini API enabled (Paid tier required for Veo).
*   A Supabase Project.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/souqai.git
    cd souqai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file (or configure in your cloud provider):
    ```env
    # Google Gemini API Key (Must support Veo/Pro models)
    API_KEY=your_google_api_key_here
    ```
    *Note: Supabase credentials are currently configured in `services/supabaseClient.ts`.*

4.  **Run the application**
    ```bash
    npm start
    ```

---

## 🗄️ Database Schema (Supabase SQL)

Run the following SQL in your Supabase SQL Editor to set up the required tables and policies.

```sql
-- 1. Profiles (Extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Organizations
create table organizations (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- 3. Products
create table products (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  seller_name text,
  title text,
  description text,
  price numeric,
  currency text,
  category text,
  image_url text, -- Main hero image
  gallery text[], -- Array of additional generated images
  video_url text, -- Veo generated video
  views int default 0,
  created_at timestamptz default now()
);

-- 4. Storage Bucket
insert into storage.buckets (id, name, public) values ('media', 'media', true);

-- 5. RLS Policies (Simplified for Demo)
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table products enable row level security;

create policy "Public read access" on products for select using (true);
create policy "Auth insert" on products for insert with check (auth.role() = 'authenticated');
create policy "Owner delete" on products for delete using (auth.uid() = seller_id);
```

---

## 📖 User Guide

### How to Sell an Item
1.  **Login** via the "Sell Item" button.
2.  **Upload** a photo of your product (e.g., a phone on a table).
3.  **Fill Details:** Enter a rough title and price.
4.  **AI Magic:** The app will auto-refine your description.
5.  **Style It:** Choose "Luxury", "Studio", or type a custom prompt (e.g., "On a rock on Mars").
6.  **Generate Video:** Click "Create Video" to let Veo animate your image.
7.  **Publish:** Your item is now live on the Explorer.

### How to Use "Habibi" Chat
1.  Click **"Habibi Chat"** in the nav.
2.  Type in English, French, or Arabic.
3.  Example Queries:
    *   *"Nlawej 3la pc gamer rkhis" (I'm looking for a cheap gaming PC)*
    *   *"Suggest a gift for a wedding"*
4.  Habibi will "Think" (using Gemini 3 Pro) and provide a structured response.

---

## 🔮 Future Roadmap

*   **Payment Gateway:** Integration with Flouci / Konnect for TND payments.
*   **AR Try-On:** Using Gemini Vision to overlay products (glasses, hats) on user photos.
*   **Delivery Integration:** Connection with Tunisian logistics providers.
*   **Voice Mode:** Enabling Live API for real-time voice conversation with Habibi.

---

## 📄 License

This project is licensed under the MIT License.

---

*Built with ❤️ for Tunisia using Google Gemini.*
