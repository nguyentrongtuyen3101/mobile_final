import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FavouriteItem {
  id: number; // ID của mục yêu thích
  sanPhamId: number; // ID của sản phẩm thực tế
  title: string;
  subtitle: string;
  price: string;
  image: any;
}

interface FavouriteContextValue {
  favouriteItems: FavouriteItem[];
  addToFavourites: (item: FavouriteItem) => void;
  removeFromFavourites: (title: string) => void;
}

const FavouriteContext = createContext<FavouriteContextValue | undefined>(undefined);

interface FavouriteProviderProps {
  children: ReactNode;
}

export const FavouriteProvider: React.FC<FavouriteProviderProps> = ({ children }) => {
  const [favouriteItems, setFavouriteItems] = useState<FavouriteItem[]>([]);

  const addToFavourites = (item: FavouriteItem) => {
    setFavouriteItems((prevItems) => {
      const existingItem = prevItems.find((favItem) => favItem.id === item.id);
      if (!existingItem) {
        return [...prevItems, item];
      }
      return prevItems;
    });
  };

  const removeFromFavourites = (title: string) => {
    setFavouriteItems((prevItems) => prevItems.filter((item) => item.title !== title));
  };

  return (
    <FavouriteContext.Provider value={{ favouriteItems, addToFavourites, removeFromFavourites }}>
      {children}
    </FavouriteContext.Provider>
  );
};

export const useFavourites = (): FavouriteContextValue => {
  const context = useContext(FavouriteContext);
  if (!context) {
    throw new Error('useFavourites must be used within a FavouriteProvider');
  }
  return context;
};