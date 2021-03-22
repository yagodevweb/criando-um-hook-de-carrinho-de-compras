import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyInCart = cart.find(product => product.id === productId);

      if (productAlreadyInCart) {
        const stock = (await api.get<Stock>(`stock/${productAlreadyInCart.id}`)).data;

        if (stock.amount > productAlreadyInCart.amount) {
          const storagedCartUpdated = cart.map(cartItem => cartItem.id === productAlreadyInCart.id ? {
            ...cartItem,
            amount: Number(cartItem.amount += 1)
          } : cartItem);

          setCart(storagedCartUpdated);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(storagedCartUpdated));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const product = (await api.get<Product>(`products/${productId}`)).data;
        const stock = (await api.get<Stock>(`stock/${productId}`)).data;

        if (stock.amount > 0) {
          product.amount = 1;
          const newStoragedCart = [...cart, product];

          setCart(newStoragedCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newStoragedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productAlreadyInCart = cart.find(product => product.id === productId);

      if (productAlreadyInCart) {
        const storagedCartUpdated = cart.filter(product => product.id !== productAlreadyInCart.id);

        setCart(storagedCartUpdated);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(storagedCartUpdated));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const productAlreadyInCart = cart.find(product => product.id === productId);

      if (productAlreadyInCart) {
        const stock = (await api.get<Stock>(`stock/${productId}`)).data;

        if (stock.amount >= amount) {

          const storagedCartUpdated = cart.map(cartItem => cartItem.id === productAlreadyInCart?.id ? {
            ...cartItem,
            amount
          } : cartItem);

          setCart(storagedCartUpdated);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(storagedCartUpdated));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
