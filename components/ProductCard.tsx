import React from 'react';

interface ProductCardProps {
    image: string;
    title: string;
    price: string;
    seller: string;
    aspectRatio?: 'square' | 'portrait' | 'landscape';
}

const ProductCard: React.FC<ProductCardProps> = ({
    image,
    title,
    price,
    seller,
    aspectRatio = 'square'
}) => {
    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[4/3]';
            case 'square': default: return 'aspect-square';
        }
    };

    return (
        <div className="break-inside-avoid mb-6 flex flex-col gap-3 pb-3 bg-card-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div
                className={`w-full bg-center bg-no-repeat bg-cover ${getAspectRatioClass()}`}
                style={{ backgroundImage: `url("${image}")` }}
                role="img"
                aria-label={title}
            />
            <div className="p-4 pt-1">
                <p className="text-dark-grey dark:text-background-light text-base font-medium leading-normal line-clamp-2">
                    {title}
                </p>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-medium-grey dark:text-gray-400 text-sm font-normal">
                        {price}
                    </p>
                    <p className="text-primary text-xs font-medium bg-primary/10 px-2 py-1 rounded-full">
                        {seller}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
