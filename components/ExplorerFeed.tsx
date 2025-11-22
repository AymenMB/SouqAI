import React from 'react';
import ProductCard from './ProductCard';

interface Product {
    id: number;
    title: string;
    price: string;
    seller: string;
    image: string;
    aspectRatio: 'square' | 'portrait' | 'landscape';
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: 1,
        title: "Handcrafted Leather Wallet",
        price: "TND 150",
        seller: "Medina Artisans",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjvvRtwdsXVL6JcoYcxR0uSmbjCslTMND875Cb_W6k2ehkQjz9uZQyZOJNFWuwhNNJiMyEvtJa6ob7MMLaYkZOLpO0Z0ABQ7b_UIgG35tsWCl9X1KcHClxuAy3H024wsVzUrZn3m6rVyj9LtAgK6ryE8SjBKLXue42lbvZdaF--4VduMPZ3Xn_Cpy-j9oSwI4M46lDs48QIHyB8juLT-E7u9M3GZR3abE_Y13ST5s9VUlgD83Mo2wsPqGY6l_gzBSqQBwdGupgpkg",
        aspectRatio: "portrait"
    },
    {
        id: 2,
        title: "Modern Ceramic Vase",
        price: "TND 85",
        seller: "Carthage Pottery",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxSEGMGcWIvUpzB5z88yDDCL_DA-9r7wcMeHN0oiIXIzoyOtStvPK77Mofq8zRcAPbafJ9PnPHh6T0JmJKQYW-UpyADP-zQ52TcLDQ9EtwtB2kZQYxKA8_yII-kPs5emkBSrLbjucixmrxBYkXMpLkr9QjDYay0ia8sBrV_atgFBsvOB-R4bUmBwPI7m6C8YjAGAknwwDfCy5WmerxkqVQUJTiXBiXx4gztfZlx0eZKg6yM0bp14s2Lyq8TnIx_KBUqGZMWKT7fVE",
        aspectRatio: "square"
    },
    {
        id: 3,
        title: "Wireless Bluetooth Earbuds",
        price: "TND 250",
        seller: "TechPro Tunisia",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuClFg9JvgkvUKJWohGisv1JnVlGW9FAcMN8VZ7tLFllI_CJpNqL4AL4A-SEhZk9v6UU4jh3qCmNrGYZDWZHclk7AE9ErrGxM5PXgZ1xUYvQiWgkjjH6uOuu-eHHSwcvRme4qN736elwCPjBqFqTxwqNjWjhLtB0nGv5OZx53XKfxWG9X3rc4zbUO28Ilzok1TJCRanw2SwiblD7oepDO2_WXr89ApO1352Aqxfp4LknU6c7pP_sDJrY3cDTgg3AK3R3HPWiR6yO9do",
        aspectRatio: "landscape"
    },
    {
        id: 4,
        title: "Organic Olive Oil",
        price: "TND 45",
        seller: "Olive Grove Est.",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6wmn5hzFqOZeeoqEWQqpbBZyHgmbbuecqDJ4-NtbHDmd0ZS9h-Y1Vzn6ibJ0ZzWRd29jUBKgfM1dgdkhIYRUdaAHRyPe0s-3IIdLHx5iZRQeB8sOpW1kivJHgzsm5L68BqpsBRuDvQPoOtXcIhTEHK_ab5CKnkf029Z-jTEm8zvdK5mqsEbSS7MZObNitj4e9hxTUlR9n6rP5SKKXo8Ha1WMIWDrb5e5Lxr5_qRQZCYYUFpQ0vVcWYGKnFxBHL5zfexw2sOfdxXI",
        aspectRatio: "square"
    },
    {
        id: 5,
        title: "Vintage Berber Rug",
        price: "TND 600",
        seller: "Atlas Weavers",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHmDz3HDFwS1lJqQcHynG1vQzCxqu0qFcxM--Rm0T4nWGtBCu2UN47Lt29lDWFlWYqFeOtjlf1UGW9NIymwiwWxWacsWVqqPUTnaax8uxREsQyGfSLHcb8eXR8K4p85HcZcrAC7rSUu50EVQ8nEkDHEwS2hWFWD50KBRzEYCy5QvehZKZxiniXV6herbHfNB--vqs9ANHW7lcYe5y4vE8U7bb-l0gPxuZcxHNJBXpfIklujEIUdz7HH2ter4id2wZzVII9020G9eA",
        aspectRatio: "portrait"
    },
    {
        id: 6,
        title: "Artisanal Silver Necklace",
        price: "TND 320",
        seller: "Jewels of Tunis",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfz0sEeTeulie5WJlLWhRVyQT8qUEiGumLPuzRHEX0Ob6EgTVbP4F4FrIsAx5f_ivXTyp6zA0WAASUBT4ghZ7kpEfPS1--VEjZ6n5T2xyV8kGHMSfJHcGjmrD_PNLyjVTpF1C-9w-JzvFkTf1XmselBo4RV3bH7BavjJQGrHXCwc6bDeln2NTZpuMZ3TqpZcHLQGfy0cCEpyq0MKiGKQk8wBrt4-wxlDRJ5lMySSW9r1sCZ8PJRuMRLf-BGoJ1BKmUsu2WNc9Xvbk",
        aspectRatio: "portrait"
    },
    {
        id: 7,
        title: "Designer Sunglasses",
        price: "TND 450",
        seller: "Sidi Bou Shades",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQGIqqduH4OTAjg56Ui4gL0E_3Zpfb8J9BESki65EsBgEgKzFyxy-oHiMj57umfayfvlRRHVD-EHlqDHdSKHt8tqKWKSugmA8pO8-z9D0vRKyrKNYeAzdgcLoXhCZrXnGsqwY9y1l6q-tzAK6VjqTBBcXropQhkucOFr2NSYV7_piuOopwp5Y2K-TJ4CLuTjE_0jMqN4VJU5G9gT7zYnzA8aBwpFrNetFl3j6AI-eHMxZ7W2gTBNjNPTsDHCWrmKCdZ-agDilPsBo",
        aspectRatio: "square"
    },
    {
        id: 8,
        title: "Smart Home Hub",
        price: "TND 300",
        seller: "Habibi Home",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn43f4RdTmfH3ltVYw0dgseXDwSO_tzQ2mmcOZu72my9_e4I7yuYyjdaQ1QH1fROIF6ntIVgN_HKG-pmPyVwkOME91_heizCSJhCek-r7ntPys7ab-6N_QRimDh_O5rMjWF6vVS8jg48hXec541AYVBWaTvqQe9EU1gW074tbpBI6ZV10xpmsOlMwUYe8fz_pL8dctJq2WDfELyU_vJuz1rVP_4oDoojhML9QF4P_mfRCNKthGdWuyL_1YKb0JZYOrXnRoFuaOIv4",
        aspectRatio: "landscape"
    },
    {
        id: 9,
        title: "Gourmet Coffee Beans",
        price: "TND 55",
        seller: "Cafe El Medina",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChxi0cyJRi5DQ2SRcTQFJK0HfzTX98fNevGd6wWxaerRlAyOsVddv-nw2ksfgqOG3G5JS-vjhy8toA_rSPjJrztuGYw2GGMo24S1mNxudwUt0vaKoz1Rs2n1eJywCpQ643jFeHlGthLULZXrS7DlbakW0zKm-0nnxco_IseodEerNV9TkBqUjOVqOaUEx9wxEyuMkQhGy21Zs1i8tvkM1DHgcIfg_5NMkTbBPShI0zTy5trUGtXmGpJywPxXcbPvrzZn58s6GQQqw",
        aspectRatio: "square"
    },
    {
        id: 10,
        title: "Linen Summer Scarf",
        price: "TND 75",
        seller: "Coastal Threads",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkwvytxReBaV-X7fNsn5oqa9z2OUf-KCQMOH2mK8tADJTPtPb_T4qw2-GM4eZ5aL0eYAJ9k7hMOjozf9gP-GU8WJs2QOcUJAleIdm-2No6-tI3LQwdylY1djjIwG_Zuk7E4ih50pBLLdtx1CN1F8rzZQeTboZy-F_y_zfp2vZvoZf_5UUl5LSS_mBCsHb1sMmnnJkE0yrLOuw4mlNQtQTFJQHlsfLdMkLRrbtDlPfmZdYrDgcSwI3Y2tXBYiAy4vzbbMKlm-yrNQ4",
        aspectRatio: "portrait"
    }
];

const ExplorerFeed: React.FC = () => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-6 space-y-6">
                {MOCK_PRODUCTS.map((product) => (
                    <ProductCard
                        key={product.id}
                        image={product.image}
                        title={product.title}
                        price={product.price}
                        seller={product.seller}
                        aspectRatio={product.aspectRatio}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExplorerFeed;
