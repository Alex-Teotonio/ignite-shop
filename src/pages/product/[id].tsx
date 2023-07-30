import { GetStaticPaths, GetStaticProps } from "next";

import Stripe from "stripe";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { stripe } from "../../lib/stripe";
import { ImageContainer, ProductContainer, ProductDetails } from "../../styles/pages/product";
import { useShoppingCart } from 'use-shopping-cart';


import { loadStripe } from '@stripe/stripe-js';

// ...

const stripePromise = loadStripe('your-publishable-key');
interface ProductProps {
  product: {
    id: string
    name: string
    imageUrl: string
    price: string
    description: string
    defaultPriceId: string
  }
}

export default function Product({ product }: ProductProps) {
  const { addItem, cartDetails } = useShoppingCart();
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false);

  async function handleBuyButton() {
    try {
      setIsCreatingCheckoutSession(true);

      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId,
      })

      const { checkoutUrl } = response.data;

      window.location.href = checkoutUrl;
    } catch (err) {
      setIsCreatingCheckoutSession(false);

      alert('Falha ao redirecionar ao checkout!')
    }
  }

  async function handleCheckoutButton() {
    const stripe = await stripePromise;
    
    if (cartDetails) {
      const line_items = Object.values(cartDetails).map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));
  
      axios.post('/api/checkout', { line_items })
        .then(response => {
          const { sessionId } = response.data;
  
          if (stripe) {
            // redirecionar para o checkout do Stripe
            stripe.redirectToCheckout({ sessionId });
          } else {
            // Tratar erro de chave de API inválida ou falta de chave de API
            console.error('Stripe key is invalid!');
          }
        })
        .catch(error => {
          // tratar erros
        });
    }
  }
  function handleAddToCart() {
    addItem({
      sku: product.id,
      name: product.name,
      image: product.imageUrl,
      price: parseInt(product.price),
      currency: "BRL"
    });
  }

  return (
    <ProductContainer>
      <ImageContainer>
      <Image src={product.imageUrl} width={520} height={480} alt="" />
      </ImageContainer>

      <ProductDetails>
        <h1>{product.name}</h1>
        <span>{product.price}</span>

        <p>{product.description}</p>

        <button disabled={isCreatingCheckoutSession} onClick={handleBuyButton}>
          Comprar agora
        </button>
        <button onClick={handleAddToCart}>
          Adicionar ao carrinho
        </button>
      </ProductDetails>
    </ProductContainer>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {
        params: { id: 'prod_OMKefDaDB4bJ8a' }
      }
    ],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async (context) => {
  if (!context.params) {
    throw new Error('`params` is undefined. This is unexpected in getStaticProps with dynamic routing.');
  }

  const productId = context.params.id;

  const product = await stripe.products.retrieve(productId, {
    expand: ['default_price']
  });

  const price = product.default_price as Stripe.Price;

  return {
    props: {
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.images[0],
        price: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(price.unit_amount !== null ? price.unit_amount / 100 : 0),
        description: product.description,
        defaultPriceId: price.id
      }
    },
    revalidate: 60 * 60 * 1 // 1 hours
  }
}